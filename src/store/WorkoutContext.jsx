import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createWorkout, EXERCISE_TYPES, WORKOUT_TEMPLATES, createExercise } from './models';

const WorkoutContext = createContext();

const STORAGE_KEYS = {
    HISTORY: 'workout_history',
    ACTIVE_WORKOUT: 'workout_active',
};

export const WorkoutProvider = ({ children }) => {
    // State
    const [history, setHistory] = useState([]);
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [extraTypes, setExtraTypes] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('workout_history');
        const savedActive = localStorage.getItem('workout_active');
        const savedTypes = localStorage.getItem('workout_custom_types');

        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedActive) setActiveWorkout(JSON.parse(savedActive));
        if (savedTypes) setExtraTypes(JSON.parse(savedTypes));

        setIsInitialized(true);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem('workout_history', JSON.stringify(history));
        localStorage.setItem('workout_active', JSON.stringify(activeWorkout));
        localStorage.setItem('workout_custom_types', JSON.stringify(extraTypes));
    }, [history, activeWorkout, extraTypes, isInitialized]);

    // Actions
    const createCustomType = (name, color) => {
        const newType = {
            id: crypto.randomUUID(),
            name,
            color,
            isCustom: true
        };
        setExtraTypes([...extraTypes, newType]);
    };

    const deleteCustomType = (id) => {
        setExtraTypes(extraTypes.filter(t => t.id !== id));
    };

    const startWorkout = (type, customName = null) => {
        const name = customName || type; // Use custom name if provided
        let workout = createWorkout(name, type);

        // Pre-fill exercises based on type
        if (customName) {
            // Custom workout starts empty
            workout.exercises = [];
        } else if (WORKOUT_TEMPLATES[type]) {
            // Standard templates
            const template = WORKOUT_TEMPLATES[type];

            // Smart Population Logic
            // Find the last completed workout of this same type
            const lastSession = history
                .filter(w => w.type === type && w.endTime)
                .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

            if (lastSession) {
                // If found, copy its exercises structure (exercises, sets, reps, weights)
                // but reset completion status and generate new IDs
                workout.exercises = lastSession.exercises.map(ex => ({
                    ...createExercise(ex.name, ex.target),
                    sets: ex.sets.map(s => ({
                        ...s,
                        id: uuidv4(),
                        completed: false
                    }))
                }));
            } else {
                // Fallback to default template if no history
                workout.exercises = template.map(t => createExercise(t.name, t.target));
            }
        }

        setActiveWorkout(workout);
    };

    const completeWorkout = () => {
        if (!activeWorkout) return;
        const completed = { ...activeWorkout, endTime: new Date().toISOString() };
        setHistory([...history, completed]);
        setActiveWorkout(null);
    };

    const cancelWorkout = () => {
        setActiveWorkout(null);
    };

    const findTarget = (name) => {
        // 1. Check Templates
        for (const list of Object.values(WORKOUT_TEMPLATES)) {
            const match = list.find(ex => ex.name === name);
            if (match && match.target) return match.target;
        }
        // 2. Check Database
        const dbMatch = EXERCISE_DATABASE.find(ex => ex.name === name);
        if (dbMatch && dbMatch.target) return dbMatch.target;

        // 3. Check History
        for (const w of history) {
            const match = w.exercises.find(ex => ex.name === name);
            if (match && match.target) return match.target;
        }
        return 'Custom';
    };

    const addExercise = (exerciseOrName) => {
        if (!activeWorkout) return;

        let name, target;
        if (typeof exerciseOrName === 'string') {
            name = exerciseOrName;
            target = findTarget(name);
        } else {
            name = exerciseOrName.name;
            target = exerciseOrName.target || findTarget(name);
        }

        const newExercise = createExercise(name, target);

        setActiveWorkout({
            ...activeWorkout,
            exercises: [...activeWorkout.exercises, newExercise]
        });
    };

    const removeExercise = (exerciseId) => {
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.exercises.filter(ex => ex.id !== exerciseId);
        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const swapExercise = (oldExerciseId, newExerciseName) => {
        if (!activeWorkout) return;

        const target = findTarget(newExerciseName);

        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id === oldExerciseId) {
                return createExercise(newExerciseName, target);
            }
            return ex;
        });

        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    // Global Rename function
    const renameExercise = (oldName, newName) => {
        // 1. Update History
        const updatedHistory = history.map(workout => ({
            ...workout,
            exercises: workout.exercises.map(ex => {
                if (ex.name === oldName) {
                    return { ...ex, name: newName };
                }
                return ex;
            })
        }));
        setHistory(updatedHistory);

        // 2. Update Active Workout (if applicable)
        if (activeWorkout) {
            const updatedActive = {
                ...activeWorkout,
                exercises: activeWorkout.exercises.map(ex => {
                    if (ex.name === oldName) {
                        return { ...ex, name: newName };
                    }
                    return ex;
                })
            };
            setActiveWorkout(updatedActive);
        }
    };

    const addSet = (exerciseId) => {
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;

            // Clone the last set's weight/reps if available, otherwise default
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet = {
                id: uuidv4(),
                weight: lastSet ? lastSet.weight : 0,
                reps: lastSet ? lastSet.reps : 12,
                completed: false
            };

            return { ...ex, sets: [...ex.sets, newSet] };
        });

        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const removeSet = (exerciseId) => {
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            if (ex.sets.length <= 1) return ex; // Don't remove the last set

            const newSets = ex.sets.slice(0, -1);
            return { ...ex, sets: newSets };
        });

        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const updateSet = (exerciseId, setId, updates) => {
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;

            let weightChanged = false;
            let newWeight = 0;

            // Find the index of the set being updated
            const setIndex = ex.sets.findIndex(s => s.id === setId);

            const updatedSets = ex.sets.map((set, index) => {
                if (set.id === setId) {
                    // Check if weight is being updated
                    if (updates.weight !== undefined && updates.weight !== set.weight) {
                        weightChanged = true;
                        newWeight = updates.weight;
                    }
                    return { ...set, ...updates };
                }

                // Inheritance Logic:
                // If we found a weight change, and this set is AFTER the modified set,
                // and this set is NOT completed, update its weight.
                if (weightChanged && index > setIndex && !set.completed) {
                    return { ...set, weight: newWeight };
                }

                return set;
            });

            return { ...ex, sets: updatedSets };
        });

        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    return (
        <WorkoutContext.Provider value={{
            activeWorkout,
            history,
            startWorkout,
            updateSet,
            addSet,
            removeSet,
            completeWorkout,
            cancelWorkout,
            addExercise,
            removeExercise,
            swapExercise,
            renameExercise,
            extraTypes,
            createCustomType,
            deleteCustomType
        }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
