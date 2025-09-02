import { openDB } from 'idb';
import { getSupabaseClient } from '../supabase/client';

const DB_NAME = 'ai-form-coach';
const STORE = 'write_buffer';

async function db() {
	return openDB(DB_NAME, 3, {
		upgrade(database) {
			// Ensure required stores exist (resilient across versions)
			if (!database.objectStoreNames.contains(STORE)) {
				database.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
			}
			if (!database.objectStoreNames.contains('device_calibration')) {
				database.createObjectStore('device_calibration', { keyPath: 'id' });
			}
		},
	});
}

export type BufferedWrite = {
	table: 'sessions' | 'reps';
	payload: Record<string, unknown>;
};

export async function enqueueWrite(write: BufferedWrite) {
	const d = await db();
	await d.add(STORE, write);
}

export async function getPendingCount(): Promise<number> {
	const d = await db();
	const tx = d.transaction(STORE, 'readonly');
	const store = tx.objectStore(STORE);
	const count = await store.count();
	await tx.done;
	return count;
}

export async function flushWrites() {
	const d = await db();
	const tx = d.transaction(STORE, 'readwrite');
	const store = tx.objectStore(STORE);
	const all = await store.getAll();
	if (!all.length) return 0;
	const supabase = getSupabaseClient();
	let lastSessionId: string | null = null;
	for (const w of all) {
		try {
			if (w.table === 'sessions') {
				const { data, error } = await supabase.from('sessions').insert(w.payload).select('id').single();
				if (error) throw error;
				lastSessionId = data?.id ?? null;
				await store.delete(w.id);
				continue;
			}
			if (w.table === 'reps') {
				const payload = { ...(w.payload as Record<string, unknown>) } as Record<string, unknown>;
				if ((payload.session_id as string) === 'PENDING' && lastSessionId) {
					payload.session_id = lastSessionId;
				}
				const { error } = await supabase.from('reps').insert(payload);
				if (error) throw error;
				await store.delete(w.id);
				continue;
			}
		} catch (e) {
			console.warn('flush failed; will retry later', e);
		}
	}
	await tx.done;
	return all.length;
}

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => {
		flushWrites();
	});
} 