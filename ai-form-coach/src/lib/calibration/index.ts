import { openDB } from 'idb';

const DB_NAME = 'ai-form-coach';
const STORE = 'device_calibration';

export type Calibration = {
	shoulderLen: number;
	hipLen: number;
	kneeLen: number;
	fovHint?: number;
	createdAt: number;
};

export type ExerciseThresholds = {
	exercise: 'squat' | 'pushup' | 'plank';
	squat?: { downDepth: number; upDepth: number };
	pushup?: { bottomElbow: number; topElbow: number };
	plank?: { minHipAngle: number };
	createdAt: number;
};

async function db() {
	return openDB(DB_NAME, 3, {
		upgrade(database) {
			// Ensure both stores exist regardless of prior version
			if (!database.objectStoreNames.contains(STORE)) {
				database.createObjectStore(STORE, { keyPath: 'id' });
			}
			if (!database.objectStoreNames.contains('write_buffer')) {
				database.createObjectStore('write_buffer', { keyPath: 'id', autoIncrement: true });
			}
		},
	});
}

export async function saveCalibration(cal: Calibration) {
	const d = await db();
	await d.put(STORE, { id: 'default', ...cal });
}

export async function loadCalibration(): Promise<Calibration | null> {
	const d = await db();
	return (await d.get(STORE, 'default')) ?? null;
}

export async function saveExerciseThresholds(t: ExerciseThresholds) {
	const d = await db();
	await d.put(STORE, { id: `thr_${t.exercise}`, ...t });
}

export async function loadExerciseThresholds(exercise: 'squat' | 'pushup' | 'plank'): Promise<ExerciseThresholds | null> {
	const d = await db();
	return (await d.get(STORE, `thr_${exercise}`)) ?? null;
} 