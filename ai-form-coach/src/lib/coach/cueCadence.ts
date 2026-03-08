export interface CueCadenceState {
  activePrimary: string;
  activeSecondary: string;
  candidatePrimary: string | null;
  candidateSecondary: string | null;
  candidateHits: number;
  lastAppliedAt: number;
}

export interface CueCadenceResult {
  primary: string;
  secondary: string;
  state: CueCadenceState;
  primaryChanged: boolean;
}

const CUE_CONFIRMATION_HITS = 3;
const CUE_MIN_HOLD_MS = 1100;
const CUE_FORCE_SWAP_MS = 2200;

function normalizeCue(text: string | null | undefined): string {
  return (text ?? "").trim();
}

export function createCueCadenceState(
  primary = "",
  secondary = "",
  appliedAt = 0,
): CueCadenceState {
  return {
    activePrimary: normalizeCue(primary),
    activeSecondary: normalizeCue(secondary),
    candidatePrimary: null,
    candidateSecondary: null,
    candidateHits: 0,
    lastAppliedAt: appliedAt,
  };
}

export function resolveCueCadence(
  state: CueCadenceState,
  nextPrimary: string,
  nextSecondary: string,
  now: number,
): CueCadenceResult {
  const primary = normalizeCue(nextPrimary);
  const secondary = normalizeCue(nextSecondary);

  if (!state.activePrimary) {
    const nextState = createCueCadenceState(primary, secondary, now);
    return {
      primary,
      secondary,
      state: nextState,
      primaryChanged: true,
    };
  }

  if (primary === state.activePrimary) {
    const nextState: CueCadenceState = {
      ...state,
      activeSecondary: secondary || state.activeSecondary,
      candidatePrimary: null,
      candidateSecondary: null,
      candidateHits: 0,
    };

    return {
      primary: nextState.activePrimary,
      secondary: nextState.activeSecondary,
      state: nextState,
      primaryChanged: false,
    };
  }

  const candidateHits = state.candidatePrimary === primary ? state.candidateHits + 1 : 1;
  const stableLongEnough = now - state.lastAppliedAt >= CUE_MIN_HOLD_MS;
  const forceSwap = now - state.lastAppliedAt >= CUE_FORCE_SWAP_MS;
  const shouldSwap = forceSwap || (stableLongEnough && candidateHits >= CUE_CONFIRMATION_HITS);

  if (!shouldSwap) {
    const nextState: CueCadenceState = {
      ...state,
      candidatePrimary: primary,
      candidateSecondary: secondary,
      candidateHits,
    };

    return {
      primary: state.activePrimary,
      secondary: state.activeSecondary,
      state: nextState,
      primaryChanged: false,
    };
  }

  const nextState: CueCadenceState = {
    activePrimary: primary,
    activeSecondary: secondary || state.activeSecondary,
    candidatePrimary: null,
    candidateSecondary: null,
    candidateHits: 0,
    lastAppliedAt: now,
  };

  return {
    primary: nextState.activePrimary,
    secondary: nextState.activeSecondary,
    state: nextState,
    primaryChanged: nextState.activePrimary !== state.activePrimary,
  };
}
