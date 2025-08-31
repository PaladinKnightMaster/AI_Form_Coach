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

async function db() {
	return openDB(DB_NAME, 2, {
		upgrade(database, oldVersion) {
			if (oldVersion < 2) database.createObjectStore(STORE, { keyPath: 'id' });
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