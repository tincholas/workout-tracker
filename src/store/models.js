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

export const TARGET_COLORS = {
    'Chest': '#ef4444', // Red
    'Triceps': '#f87171', // Light Red
    'Back': '#3b82f6', // Blue
    'Biceps': '#60a5fa', // Light Blue
    'Shoulders': '#eab308', // Yellow
    'Legs': '#22c55e', // Green
    'Core': '#a855f7', // Purple
    'Other': '#64748b', // Slate
    'Cardio': '#10b981', // Emerald
    'Custom': '#64748b', // Slate
};

export const MUSCLE_GROUPS = [
    'Back',
    'Biceps',
    'Chest',
    'Triceps',
    'Shoulders',
    'Legs',
    'Core',
    'Cardio',
    'Other'
];

export const createSet = (weight = 0, reps = 12) => ({
    id: uuidv4(),
    weight: Number(weight),
    reps: Number(reps),
    completed: false,
    leftDone: false,
    rightDone: false,
    unilateral: false,
});

export const createExercise = (name, target = '', bodyweight = false) => {
    // Auto-resolve bodyweight flag if available in database
    const dbMatch = EXERCISE_DATABASE.find(ex => ex.name === name);
    const isBodyweight = bodyweight || (dbMatch ? !!dbMatch.bodyweight : false);

    return {
        id: uuidv4(),
        name,
        target,
        bodyweight: isBodyweight,
        supersetWithAbove: false,
        sets: [createSet(), createSet(), createSet(), createSet()], // Default 4 sets
    };
};

export const createWorkout = (name, type) => ({
    id: uuidv4(),
    name,
    type,
    startTime: new Date().toISOString(),
    endTime: null,
    exercises: [],
});

// Default templates for quick start
// Full Library of Exercises for Search/Auto-complete
export const EXERCISE_DATABASE = [
    // Chest
    { name: 'Barbell Bench Press', target: 'Chest' },
    { name: 'Incline Dumbbell Press', target: 'Chest' },
    { name: 'Incline Barbell Press', target: 'Chest' },
    { name: 'Chest Fly (Machine/Dumbbell)', target: 'Chest' },
    { name: 'Dips (Chest Focus)', target: 'Chest', bodyweight: true },
    { name: 'Push-ups', target: 'Chest', bodyweight: true },

    // Back
    { name: 'Pull-ups', target: 'Back', bodyweight: true },
    { name: 'Barbell Row', target: 'Back' },
    { name: 'Lat Pulldown', target: 'Back' },
    { name: 'Seated Cable Row', target: 'Back' },
    { name: 'T-Bar Row', target: 'Back' },

    // Legs
    { name: 'Barbell Squat', target: 'Legs' },
    { name: 'Romanian Deadlift', target: 'Legs' },
    { name: 'Leg Press', target: 'Legs' },
    { name: 'Leg Extension', target: 'Legs' },
    { name: 'Lying Leg Curl', target: 'Legs' },

    // Shoulders
    { name: 'Overhead Press (OHP)', target: 'Shoulders' },
    { name: 'Lateral Raises', target: 'Shoulders' },
    { name: 'Front Dumbbell Raise', target: 'Shoulders' },
    { name: 'Reverse Pec Deck / Rear Delt Fly', target: 'Shoulders' },
    { name: 'Arnold Press', target: 'Shoulders' },

    // Biceps
    { name: 'Barbell Curl', target: 'Biceps' },
    { name: 'Dumbbell Curl', target: 'Biceps' },
    { name: 'Hammer Curl', target: 'Biceps' },
    { name: 'Preacher Curl', target: 'Biceps' },
    { name: 'Cable Bicep Curl', target: 'Biceps' },

    // Triceps
    { name: 'Tricep Pushdown (Cable)', target: 'Triceps' },
    { name: 'Skull Crushers', target: 'Triceps' },
    { name: 'Overhead Tricep Extension', target: 'Triceps' },
    { name: 'Close-Grip Bench Press', target: 'Triceps' },
    { name: 'Bench Dips', target: 'Triceps', bodyweight: true },

    // Cardio
    { name: 'Running', target: 'Cardio' },
    { name: 'Cycling', target: 'Cardio' },
    { name: 'Rowing', target: 'Cardio' },
    { name: 'Elliptical', target: 'Cardio' },
    { name: 'Stair Climber', target: 'Cardio' },
    { name: 'Jump Rope', target: 'Cardio' }
];

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

// The 4 default splits as unified data objects.
// Stable IDs ensure the backfill migration can match existing history records,
// and that splitId references remain valid across app updates.
export const DEFAULT_WORKOUT_TYPES = [
    {
        id: 'builtin-chest-triceps',
        name: 'Chest & Triceps',
        i18nKey: 'CHEST_TRICEPS',
        color: '#ef4444',
        icon: 'Shirt',
        template: WORKOUT_TEMPLATES[EXERCISE_TYPES.CHEST_TRICEPS]
    },
    {
        id: 'builtin-back-biceps',
        name: 'Back & Biceps',
        i18nKey: 'BACK_BICEPS',
        color: '#3b82f6',
        icon: 'BicepsFlexed',
        template: WORKOUT_TEMPLATES[EXERCISE_TYPES.BACK_BICEPS]
    },
    {
        id: 'builtin-shoulders',
        name: 'Shoulders',
        i18nKey: 'SHOULDERS',
        color: '#eab308',
        icon: 'User',
        template: WORKOUT_TEMPLATES[EXERCISE_TYPES.SHOULDERS]
    },
    {
        id: 'builtin-legs',
        name: 'Legs',
        i18nKey: 'LEGS',
        color: '#22c55e',
        icon: 'Footprints',
        template: WORKOUT_TEMPLATES[EXERCISE_TYPES.LEGS]
    }
];
