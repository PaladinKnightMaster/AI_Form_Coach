export type Point3 = { x: number; y: number; z?: number };

export function angleBetween(p1: Point3, p2: Point3, p3: Point3): number {
	const a = { x: p1.x - p2.x, y: p1.y - p2.y };
	const b = { x: p3.x - p2.x, y: p3.y - p2.y };
	const dot = a.x * b.x + a.y * b.y;
	const magA = Math.hypot(a.x, a.y);
	const magB = Math.hypot(b.x, b.y);
	if (magA === 0 || magB === 0) return 0;
	let cos = dot / (magA * magB);
	cos = Math.max(-1, Math.min(1, cos));
	return (Math.acos(cos) * 180) / Math.PI;
}

export function exponentialMovingAverage(prev: number, next: number, alpha = 0.5): number {
	return alpha * next + (1 - alpha) * prev;
}

export function averagePoints(points: Point3[]): Point3 {
	const n = points.length || 1;
	return points.reduce((acc, p) => ({ x: acc.x + p.x / n, y: acc.y + p.y / n, z: (acc.z ?? 0) + (p.z ?? 0) / n }), { x: 0, y: 0, z: 0 });
}

export function line(p1: Point3, p2: Point3) {
	return { dx: p2.x - p1.x, dy: p2.y - p1.y };
}

export function clamp(v: number, min: number, max: number) {
	return Math.max(min, Math.min(max, v));
} 