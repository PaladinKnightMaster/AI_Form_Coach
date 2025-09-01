export type Goal = { type: 'reps' | 'time'; value: number };
export type DayPlan = { name: string; blocks: { exercise: 'squat'|'pushup'|'plank'; goal: Goal }[] };
export type Plan = { id: string; name: string; days: DayPlan[] };

export const beginner3x: Plan = {
	id: 'beg-3x',
	name: 'Beginner Full Body (3×/week)',
	days: [
		{ name: 'Day A', blocks: [ { exercise: 'squat', goal: { type: 'reps', value: 12 } }, { exercise: 'pushup', goal: { type: 'reps', value: 10 } }, { exercise: 'plank', goal: { type: 'time', value: 45 } } ] },
		{ name: 'Day B', blocks: [ { exercise: 'squat', goal: { type: 'reps', value: 12 } }, { exercise: 'pushup', goal: { type: 'reps', value: 10 } }, { exercise: 'plank', goal: { type: 'time', value: 45 } } ] },
		{ name: 'Day C', blocks: [ { exercise: 'squat', goal: { type: 'reps', value: 12 } }, { exercise: 'pushup', goal: { type: 'reps', value: 10 } }, { exercise: 'plank', goal: { type: 'time', value: 45 } } ] },
	]
};

export function warmupFor(exercise: 'squat'|'pushup'|'plank'): { title: string; steps: string[] } {
	if (exercise === 'squat') return { title: 'Squat warmup', steps: ['10 bodyweight good-morning', '10 air squats to 90°', '5 slow squats to full depth'] };
	if (exercise === 'pushup') return { title: 'Pushup warmup', steps: ['10 wall pushups', '8 incline pushups', '5 normal pushups (slow)'] };
	return { title: 'Plank warmup', steps: ['15s high plank hold', '10 shoulder taps', '20s plank hold (hollow)'] };
} 