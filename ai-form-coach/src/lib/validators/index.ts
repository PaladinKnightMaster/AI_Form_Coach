import type { Exercise, Validator } from './types';
import { createSquatValidator } from './squat';
import { createPushupValidator } from './pushup';
import { createPlankValidator } from './plank';
import { withMentorCues } from '../coach/mentorIntegration';

export function createValidator(exercise: Exercise): Validator {
	let baseValidator: Validator;
	
	switch (exercise) {
		case 'squat':
			baseValidator = createSquatValidator();
			break;
		case 'pushup':
			baseValidator = createPushupValidator();
			break;
		case 'plank':
			baseValidator = createPlankValidator();
			break;
		default:
			baseValidator = createSquatValidator();
	}
	
	// Wrap with mentor cue system
	return withMentorCues(baseValidator);
} 