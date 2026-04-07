export const EXERCISE_CATEGORIES = [
    'Strengthening',
    'Stretching',
    'Range of Motion',
    'Balance & Coordination',
    'Gait Training',
    'Breathing Exercises',
    'Functional Training',
    'Postural Correction',
    'Endurance Training',
    'Early Intervention',
    'Home Programme',
    'Prosthetic Training',
    'Orthotic Training',
    'Neuromuscular Re-education',
    'Other',
] as const;

export const EXERCISE_CONDITIONS = [
    'Pain',
    'Neuro',
    'Pulmonary',
    'Post-Operative',
    'Disability',
    'Amputation',
    'Early Intervention',
    'General',
] as const;

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number];
export type ExerciseCondition = typeof EXERCISE_CONDITIONS[number];
