export type Point3 = { x: number; y: number; z: number };

// 2D version for backward compatibility and when z is not needed
export type Point2D = { x: number; y: number };

/**
 * Calculate angle between three 3D points
 * Returns angle in degrees (0-180)
 */
export function angleBetween(p1: Point3, p2: Point3, p3: Point3): number {
	const a = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
	const b = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
	
	// Calculate dot product
	const dot = a.x * b.x + a.y * b.y + a.z * b.z;
	
	// Calculate magnitudes
	const magA = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
	const magB = Math.sqrt(b.x * b.x + b.y * b.y + b.z * b.z);
	
	if (magA === 0 || magB === 0) return 0;
	
	let cos = dot / (magA * magB);
	cos = Math.max(-1, Math.min(1, cos));
	return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Calculate angle between three 2D points (for backward compatibility)
 * Returns angle in degrees (0-180)
 */
export function angleBetween2D(p1: Point2D, p2: Point2D, p3: Point2D): number {
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
	return points.reduce((acc, p) => ({ 
		x: acc.x + p.x / n, 
		y: acc.y + p.y / n, 
		z: acc.z + p.z / n 
	}), { x: 0, y: 0, z: 0 });
}

export function averagePoints2D(points: Point2D[]): Point2D {
	const n = points.length || 1;
	return points.reduce((acc, p) => ({ 
		x: acc.x + p.x / n, 
		y: acc.y + p.y / n 
	}), { x: 0, y: 0 });
}

export function line(p1: Point3, p2: Point3) {
	return { dx: p2.x - p1.x, dy: p2.y - p1.y, dz: p2.z - p1.z };
}

export function line2D(p1: Point2D, p2: Point2D) {
	return { dx: p2.x - p1.x, dy: p2.y - p1.y };
}

/**
 * Calculate 3D Euclidean distance between two points
 */
export function distance3D(p1: Point3, p2: Point3): number {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	const dz = p2.z - p1.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate 2D Euclidean distance between two points
 */
export function distance2D(p1: Point2D, p2: Point2D): number {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(v: number, min: number, max: number) {
	return Math.max(min, Math.min(max, v));
} 