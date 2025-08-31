import type { Exercise, Validator } from './types';
import { createSquatValidator } from './squat';
import { createPushupValidator } from './pushup';
import { createPlankValidator } from './plank';

export function createValidator(exercise: Exercise): Validator {
	switch (exercise) {
		case 'squat':
			return createSquatValidator();
		case 'pushup':
			return createPushupValidator();
		case 'plank':
			return createPlankValidator();
		default:
			return createSquatValidator();
	}
} 