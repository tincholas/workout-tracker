import { v4 as uuidv4 } from 'uuid';

export const EXERCISE_TYPES = {
    CHEST_TRICEPS: 'Chest & Triceps',
    BACK_BICEPS: 'Back & Biceps',
    SHOULDERS: 'Shoulders',
    LEGS: 'Legs',
    CUSTOM: 'Custom'
};

export const createSet = (weight = 0, reps = 0) => ({
    id: uuidv4(),
    weight: Number(weight),
    reps: Number(reps),
    completed: false,
});

export const createExercise = (name, target = '') => ({
    id: uuidv4(),
    name,
    target,
    sets: [createSet(), createSet(), createSet()], // Default 3 sets
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
        { name: 'Bench Press', target: 'Chest' },
        { name: 'Incline Dumbbell Press', target: 'Chest' },
        { name: 'Tricep Pushdown', target: 'Triceps' },
        { name: 'Skull Crushers', target: 'Triceps' }
    ],
    [EXERCISE_TYPES.BACK_BICEPS]: [
        { name: 'Pull Ups', target: 'Back' },
        { name: 'Barbell Row', target: 'Back' },
        { name: 'Barbell Curl', target: 'Biceps' },
        { name: 'Hammer Curl', target: 'Biceps' }
    ],
    [EXERCISE_TYPES.SHOULDERS]: [
        { name: 'Overhead Press', target: 'Shoulders' },
        { name: 'Lateral Raises', target: 'Shoulders' },
        { name: 'Face Pulls', target: 'Shoulders' }
    ],
    [EXERCISE_TYPES.LEGS]: [
        { name: 'Squat', target: 'Legs' },
        { name: 'Romanian Deadlift', target: 'Legs' },
        { name: 'Leg Extensions', target: 'Legs' },
        { name: 'Calf Raises', target: 'Legs' }
    ]
};
