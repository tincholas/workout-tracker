import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createWorkout, createExercise, WORKOUT_TEMPLATES } from './models';

const WorkoutContext = createContext();

const STORAGE_KEYS = {
    HISTORY: 'iron_track_history',
    ACTIVE_WORKOUT: 'iron_track_active',
};

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [history, setHistory] = useState([]);

    // Load data on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
        const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);

        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedActive) setActiveWorkout(JSON.parse(savedActive));
    }, []);

    // Persist Active Workout
    useEffect(() => {
        if (activeWorkout) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(activeWorkout));
        } else {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
        }
    }, [activeWorkout]);

    // Persist History
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }, [history]);

    // Actions
    const startWorkout = (type) => {
        const template = WORKOUT_TEMPLATES[type] || [];
        const workout = createWorkout(type, type);

        // Populate with template exercises
        workout.exercises = template.map(t => createExercise(t.name, t.target));

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

    return (
        <WorkoutContext.Provider value={{
            activeWorkout,
            history,
            startWorkout,
            updateSet,
            completeWorkout,
            cancelWorkout,
            addExercise,
            swapExercise
        }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
