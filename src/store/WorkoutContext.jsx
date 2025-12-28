import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createWorkout, createExercise, WORKOUT_TEMPLATES, createSet } from './models';

const WorkoutContext = createContext();

const STORAGE_KEYS = {
    HISTORY: 'iron_track_history',
    ACTIVE_WORKOUT: 'iron_track_active',
};

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [history, setHistory] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load data on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
        const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);

        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedActive) setActiveWorkout(JSON.parse(savedActive));

        setIsInitialized(true);
    }, []);

    // Persist Active Workout
    useEffect(() => {
        if (!isInitialized) return;

        if (activeWorkout) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(activeWorkout));
        } else {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
        }
    }, [activeWorkout, isInitialized]);

    // Persist History
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }, [history, isInitialized]);

    // Actions
    const startWorkout = (type) => {
        // 1. Look for last completed workout of this type
        const lastWorkout = history
            .filter(w => w.type === type)
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

        const workout = createWorkout(type, type);

        if (lastWorkout) {
            // Smart Population: Copy exercises from last time
            // We map over them to create NEW IDs so we don't edit history
            workout.exercises = lastWorkout.exercises.map(oldEx => {
                const newEx = createExercise(oldEx.name, oldEx.target);
                // Copy sets structure and weights, but reset completion
                newEx.sets = oldEx.sets.map(oldSet => ({
                    ...createSet(oldSet.weight, oldSet.reps), // Use last weight/reps
                    completed: false
                }));
                return newEx;
            });
        } else {
            // Fallback to Template
            const template = WORKOUT_TEMPLATES[type] || [];
            workout.exercises = template.map(t => createExercise(t.name, t.target));
        }

        setActiveWorkout(workout);
    };

    const updateSet = (exerciseId, setId, updates) => {
        if (!activeWorkout) return;

        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;

            const updatedSets = ex.sets.map(set => {
                if (set.id !== setId) return set;
                return { ...set, ...updates };
            });

            return { ...ex, sets: updatedSets };
        });

        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const addSet = (exerciseId) => {
        if (!activeWorkout) return;
        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            // Clone the previous set's weight/reps if available, else default
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet = createSet(lastSet ? lastSet.weight : 0, lastSet ? lastSet.reps : 12);
            return { ...ex, sets: [...ex.sets, newSet] };
        });
        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const removeSet = (exerciseId, setId) => {
        if (!activeWorkout) return;
        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
        });
        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const completeWorkout = () => {
        if (!activeWorkout) return;

        const completed = {
            ...activeWorkout,
            endTime: new Date().toISOString()
        };

        setHistory(prev => [completed, ...prev]);
        setActiveWorkout(null);
    };

    const cancelWorkout = () => {
        setActiveWorkout(null);
    };

    const addExercise = (name, target) => {
        if (!activeWorkout) return;
        const newEx = createExercise(name, target);
        setActiveWorkout(prev => ({
            ...prev,
            exercises: [...prev.exercises, newEx]
        }));
    };

    const swapExercise = (oldExerciseId, newName, newTarget) => {
        if (!activeWorkout) return;
        const newEx = createExercise(newName, newTarget);

        const updatedExercises = activeWorkout.exercises.map(ex =>
            ex.id === oldExerciseId ? newEx : ex
        );

        setActiveWorkout(prev => ({
            ...prev,
            exercises: updatedExercises
        }));
    };

    const renameExercise = (oldName, newName) => {
        // 1. Update History
        const updatedHistory = history.map(workout => ({
            ...workout,
            exercises: workout.exercises.map(ex =>
                ex.name === oldName ? { ...ex, name: newName } : ex
            )
        }));
        setHistory(updatedHistory);

        // 2. Update Active Workout if applicable
        if (activeWorkout) {
            const updatedActive = {
                ...activeWorkout,
                exercises: activeWorkout.exercises.map(ex =>
                    ex.name === oldName ? { ...ex, name: newName } : ex
                )
            };
            setActiveWorkout(updatedActive);
        }
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
            swapExercise,
            renameExercise
        }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
