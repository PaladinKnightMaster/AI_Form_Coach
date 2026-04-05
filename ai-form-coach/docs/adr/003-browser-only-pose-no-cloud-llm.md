# ADR-003: Browser-Only Pose Detection, No Cloud LLM in Live Loop

**Status:** Accepted
**Date:** 2026-03
**Author:** Solo dev

## Context

The coaching loop runs at 15-30fps. Each frame needs pose detection + form evaluation + cue generation. Sending frames to a cloud LLM would add 200-500ms latency per frame, making real-time coaching impossible. It would also create per-frame API costs that are incompatible with a freemium model.

## Decision

All pose detection and form evaluation runs in the browser using @mediapipe/tasks-vision (Pose Landmarker Lite model). Coaching cues are generated from deterministic rules (angle thresholds, rep state machines) defined in `src/lib/coach/`. No cloud API calls during the active coaching session.

Google Generative AI (Gemini) via `@google/generative-ai` is available for **async** features only — post-session analysis, workout plan generation, and conversational coaching review. These are not part of the live frame loop. Future phases may add Claude for more advanced async analysis.

## Consequences

- **Easier:** Zero latency for coaching, works offline, no per-frame cost, privacy-preserving (video never leaves device)
- **Harder:** Coaching quality is limited by rule complexity (no LLM reasoning about novel movement patterns)
- **Revisit when:** WebGPU enables fast on-device LLM inference, or a streaming API achieves <50ms p95 latency
