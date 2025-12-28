import { v4 as uuidv4 } from 'uuid';

export const EXERCISE_TYPES = {
    CHEST_TRICEPS: 'Chest & Triceps',
    BACK_BICEPS: 'Back & Biceps',
    SHOULDERS: 'Shoulders',
    LEGS: 'Legs',
    CUSTOM: 'Custom'
};

export const SPLIT_COLORS = {
    [EXERCISE_TYPES.CHEST_TRICEPS]: '#ef4444', // Red
    [EXERCISE_TYPES.BACK_BICEPS]: '#3b82f6', // Blue
    [EXERCISE_TYPES.SHOULDERS]: '#eab308', // Yellow
    [EXERCISE_TYPES.LEGS]: '#22c55e', // Green
    [EXERCISE_TYPES.CUSTOM]: '#a3a3a3' // Grey
};

export const createSet = (weight = 0, reps = 12) => ({
    id: uuidv4(),
    weight: Number(weight),
    reps: Number(reps),
    completed: false,
});

export const createExercise = (name, target = '') => ({
    id: uuidv4(),
    name,
    target,
    sets: [createSet(), createSet(), createSet(), createSet()], // Default 4 sets
});

export const createWorkout = (name, type) => ({
    id: uuidv4(),
    name,
    type,
    startTime: new Date().toISOString(),
    endTime: null,
    exercises: [],
});

// Default templates for quick start
export const WORKOUT_TEMPLATES = {
    [EXERCISE_TYPES.CHEST_TRICEPS]: [
        { name: 'Incline Barbell Press', target: 'Chest' },
        { name: 'Butterfly', target: 'Chest' },
        { name: 'Cable Tricep Extension', target: 'Triceps' },
        { name: 'Skull Crushers', target: 'Triceps' }
    ],
    [EXERCISE_TYPES.BACK_BICEPS]: [
        { name: 'Pulldown', target: 'Back' },
        { name: 'Seated Row', target: 'Back' },
        { name: 'Preacher Curls', target: 'Biceps' },
        { name: 'Pulley Bicep Curl Dropset', target: 'Biceps' }
    ],
    [EXERCISE_TYPES.SHOULDERS]: [
        { name: 'Shoulder Press', target: 'Shoulders' },
        { name: 'Lat Raise', target: 'Shoulders' },
        { name: 'Face Pull', target: 'Shoulders' },
        { name: 'Reverse Flies', target: 'Shoulders' }
    ],
    [EXERCISE_TYPES.LEGS]: [
        { name: 'Leg Press', target: 'Legs' },
        { name: 'Calf Raise', target: 'Legs' },
        { name: 'Kickbacks', target: 'Legs' },
        { name: 'Leg Extensions', target: 'Legs' }
    ]
};
