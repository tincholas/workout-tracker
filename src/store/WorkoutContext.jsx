import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createWorkout, EXERCISE_TYPES, WORKOUT_TEMPLATES, createExercise, EXERCISE_DATABASE } from './models';
import { initDB, getData, setData } from './db';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    // ... rest of the file ...
    // State
    const [history, setHistory] = useState([]);
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [extraTypes, setExtraTypes] = useState([]);
    const [preferredUnit, setPreferredUnit] = useState('KG'); // 'KG' or 'LBS'
    const [restTimer, setRestTimer] = useState({ enabled: false, seconds: 60 });
    const [activeRestTimer, setActiveRestTimer] = useState(null); // { exerciseId, endTime, totalDuration }
    const [isInitialized, setIsInitialized] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState('default');

    // ... imports etc ...

    useEffect(() => {
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const startRestTimer = (exerciseId, durationSeconds) => {
        requestNotificationPermission();
        const now = Date.now();
        setActiveRestTimer({
            exerciseId,
            endTime: now + (durationSeconds * 1000),
            totalDuration: durationSeconds * 1000
        });
    };

    const cancelRestTimer = () => {
        setActiveRestTimer(null);
    };

    const extendRestTimer = (seconds) => {
        if (!activeRestTimer) return;
        setActiveRestTimer(prev => ({
            ...prev,
            endTime: prev.endTime + (seconds * 1000),
            totalDuration: prev.totalDuration + (seconds * 1000)
        }));
    };

    // Calculate Personal Records (Max Volume per Exercise)
    // Returns: { "Exercise Name": { volume: 100, setId: "abc-123", date: "..." } }
    const personalRecords = React.useMemo(() => {
        const records = {}; // { exName: { volume: 0, setId: null } }

        // We must sort history chronologically to ensure "First-to-achieve" rule works correctly
        const sortedHistory = [...(history || [])].sort((a, b) => new Date(a.endTime) - new Date(b.endTime));

        sortedHistory.forEach(workout => {
            if (!workout.exercises) return;
            workout.exercises.forEach(ex => {
                // Cardio PR Logic (Duration)
                if (ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                    const duration = ex.accumulatedSeconds;
                    const existing = records[ex.name] || { volume: 0, setId: null };

                    if (duration > existing.volume) {
                        records[ex.name] = {
                            volume: duration, // Storing seconds as "volume" for consistency
                            setId: ex.id, // Use exercise ID as reference
                            date: workout.endTime,
                            isCardio: true
                        };
                    }
                }
                // Strength PR Logic (Max Volume per Set)
                else if (ex.sets) {
                    ex.sets.forEach(s => {
                        if (s.completed && s.weight > 0 && s.reps > 0) {
                            const vol = s.weight * s.reps;
                            const existing = records[ex.name] || { volume: 0, setId: null };

                            // Strict strict inequality: Only update if strictly higher.
                            // This preserves the "First Set" as the record holder in case of ties.
                            if (vol > existing.volume) {
                                records[ex.name] = {
                                    volume: vol,
                                    setId: s.id,
                                    date: workout.endTime,
                                    isCardio: false
                                };
                            }
                        }
                    });
                }
            });
        });
        return records;
    }, [history]);

    // Initialize DB and Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Initialize (and migrate if needed)
                await initDB();

                // Load all data
                const savedHistory = await getData('workout_history');
                const savedActive = await getData('workout_active');
                const savedTypes = await getData('workout_custom_types');
                const savedUnit = await getData('workout_unit_preference');
                const savedTimer = await getData('workout_rest_timer');

                if (savedHistory) setHistory(savedHistory);
                if (savedActive) setActiveWorkout(savedActive);
                if (savedTypes) setExtraTypes(savedTypes);
                if (savedUnit) setPreferredUnit(savedUnit);
                if (savedTimer) setRestTimer(savedTimer);

                // Migration: Deduplicate Exercises
                if (savedHistory) {
                    const MIGRATION_MAP = {
                        'Leg Extensions': 'Leg Extension',
                        'Preacher Curls': 'Preacher Curl',
                        'Lat Raise': 'Lateral Raises',
                        'Pulldown': 'Lat Pulldown',
                        'Seated Row': 'Seated Cable Row',
                        'Shoulder Press': 'Overhead Press (OHP)',
                        'Butterfly': 'Chest Fly (Machine/Dumbbell)',
                        'Reverse Flies': 'Reverse Pec Deck / Rear Delt Fly',
                        'cable Tricep Extension': 'Tricep Pushdown (Cable)', // casing might vary
                        'Cable Tricep Extension': 'Tricep Pushdown (Cable)',
                        'Pulley Bicep Curl Dropset': 'Cable Bicep Curl',
                        'Kickbacks': 'Glute Kickback'
                    };

                    let hasChanges = false;
                    const migratedHistory = savedHistory.map(w => {
                        if (!w.exercises) return w;
                        const newExercises = w.exercises.map(ex => {
                            if (MIGRATION_MAP[ex.name]) {
                                hasChanges = true;
                                return { ...ex, name: MIGRATION_MAP[ex.name] };
                            }
                            return ex;
                        });
                        return { ...w, exercises: newExercises };
                    });

                    if (hasChanges) {
                        setHistory(migratedHistory);
                        console.log("Migrated Exercise Names in History");
                    }
                }
            } catch (err) {
                console.error("Failed to load data from DB:", err);
            } finally {
                setIsInitialized(true);
            }
        };

        loadData();
    }, []);

    // Save to DB on change
    useEffect(() => {
        if (!isInitialized) return;

        // Use a debounced or direct save. Given user frequency, direct save is fine,
        // but idb is async. We don't await here (fire and forget).
        setData('workout_history', history);
        setData('workout_active', activeWorkout);
        setData('workout_custom_types', extraTypes);
        setData('workout_unit_preference', preferredUnit);
        setData('workout_rest_timer', restTimer);
    }, [history, activeWorkout, extraTypes, preferredUnit, restTimer, isInitialized]);

    // Keep Ref updated for Interval to avoid stale closures
    const activeRestTimerRef = useRef(activeRestTimer);
    useEffect(() => {
        activeRestTimerRef.current = activeRestTimer;
    }, [activeRestTimer]);

    // Timer Notification Logic
    useEffect(() => {
        let interval = null;
        if (activeRestTimer) {
            interval = setInterval(() => {
                const now = Date.now();
                // Use Ref to ensure we check against the LATEST endTime, even if interval wasn't reset perfectly
                const timer = activeRestTimerRef.current;

                if (timer && now >= timer.endTime) {
                    // Send Notification
                    if ("Notification" in window && Notification.permission === "granted") {
                        // Try Service Worker first
                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.showNotification("Cool Down Finished", {
                                    body: "Time for your next set!",
                                    icon: '/bicep.svg',
                                    vibrate: [200, 100, 200]
                                });
                            }).catch(() => new Notification("Cool Down Finished", { body: "Time for your next set!", icon: '/bicep.svg' }));
                        } else {
                            new Notification("Cool Down Finished", { body: "Time for your next set!", icon: '/bicep.svg' });
                        }
                    }
                    setActiveRestTimer(null);
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeRestTimer]);

    if (!isInitialized) {
        // Return a loading state or null
        // Since we want to key-off 'isInitialized' to avoid flashing empty data
        return <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#333'
        }}>Loading...</div>;
    }

    // Actions
    const toggleUnit = () => {
        setPreferredUnit(prev => prev === 'KG' ? 'LBS' : 'KG');
    };

    const requestNotificationPermission = () => {
        if (!("Notification" in window)) return;

        Notification.requestPermission().then((permission) => {
            setNotificationPermission(permission);
        });
    };

    const createCustomType = (name, color, icon) => {
        const newType = {
            id: crypto.randomUUID(),
            name,
            color,
            icon, // Store the icon name string
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
        // Pre-fill exercises logic

        // 1. Try to find the last completed session of this specific workout name
        // This works for both Standard (name matches type) and Custom (unique names)
        const lastSession = history
            .filter(w => w.name === name && w.endTime)
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

        if (lastSession) {
            // Copy exercises from history
            workout.exercises = lastSession.exercises.map(ex => ({
                ...createExercise(ex.name, ex.target),
                targetTimeMinutes: ex.targetTimeMinutes || 0, // Preserve previous target time
                sets: ex.sets.map(s => ({
                    ...s,
                    id: uuidv4(),
                    completed: false,
                    // Preserve weight/reps from history
                }))
            }));
        } else if (WORKOUT_TEMPLATES[type] && !customName) {
            // 2. Fallback to Standard Template if no history and not custom
            const template = WORKOUT_TEMPLATES[type];
            workout.exercises = template.map(t => createExercise(t.name, t.target));
        } else {
            // 3. New Custom Workout (first time) starts empty
            workout.exercises = [];
        }

        setActiveWorkout(workout);
    };

    const completeWorkout = () => {
        if (!activeWorkout) return;

        const endTime = new Date();

        // Finalize any running timers
        const finalizedExercises = activeWorkout.exercises.map(ex => {
            if (ex.target === 'Cardio' && ex.timerState === 'running' && ex.timerStart) {
                const start = new Date(ex.timerStart).getTime();
                const now = endTime.getTime();
                const elapsed = (now - start) / 1000;
                return {
                    ...ex,
                    timerState: 'finished', // or paused/idle
                    timerStart: null,
                    accumulatedSeconds: (ex.accumulatedSeconds || 0) + elapsed
                };
            }
            return ex;
        });

        const completed = {
            ...activeWorkout,
            exercises: finalizedExercises,
            endTime: endTime.toISOString()
        };

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

    const swapExercise = (oldExerciseId, exerciseOrName) => {
        if (!activeWorkout) return;

        let name, target;
        if (typeof exerciseOrName === 'string') {
            name = exerciseOrName;
            target = findTarget(name);
        } else {
            name = exerciseOrName.name;
            target = exerciseOrName.target || findTarget(name);
        }

        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id === oldExerciseId) {
                return createExercise(name, target);
            }
            return ex;
        });

        setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
    };

    const reorderExercise = (exerciseId, direction) => {
        if (!activeWorkout) return;
        const exercises = [...activeWorkout.exercises];
        const index = exercises.findIndex(ex => ex.id === exerciseId);

        if (index === -1) return;
        if (direction === 'UP' && index === 0) return;
        if (direction === 'DOWN' && index === exercises.length - 1) return;

        const targetIndex = direction === 'UP' ? index - 1 : index + 1;

        // Swap
        [exercises[index], exercises[targetIndex]] = [exercises[targetIndex], exercises[index]];

        setActiveWorkout({
            ...activeWorkout,
            exercises
        });
    };

    // Global Rename function
    const renameExercise = (oldName, newName, newTarget = null) => {
        // 1. Update History
        const updatedHistory = history.map(workout => ({
            ...workout,
            exercises: workout.exercises.map(ex => {
                if (ex.name === oldName) {
                    return {
                        ...ex,
                        name: newName,
                        target: newTarget || ex.target // Update target if provided, else keep old
                    };
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
                        return {
                            ...ex,
                            name: newName,
                            target: newTarget || ex.target
                        };
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

    const updateExercise = (exerciseId, updates) => {
        if (!activeWorkout) return;
        const updatedExercises = activeWorkout.exercises.map(ex => {
            if (ex.id === exerciseId) {
                return { ...ex, ...updates };
            }
            return ex;
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
            reorderExercise,
            renameExercise,
            toggleUnit,
            preferredUnit,
            extraTypes,
            createCustomType,
            deleteCustomType,
            deleteCustomType,
            updateExercise,
            restTimer,
            setRestTimer,
            activeRestTimer,
            startRestTimer,
            cancelRestTimer,
            extendRestTimer,
            personalRecords,
            notificationPermission,
            requestNotificationPermission
        }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
