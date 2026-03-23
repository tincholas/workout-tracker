import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createWorkout, EXERCISE_TYPES, WORKOUT_TEMPLATES, createExercise, EXERCISE_DATABASE, DEFAULT_WORKOUT_TYPES, createSet } from './models';
import { initDB, getData, setData } from './db';
import { usePersonalRecords } from './hooks/usePersonalRecords';
import { useRestTimer } from './hooks/useRestTimer';
import { calculateEffectiveWeight } from '../utils/volumeCalc';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    // State
    const [history, setHistory] = useState([]);
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [extraTypes, setExtraTypes] = useState([]);
    const [preferredUnit, setPreferredUnit] = useState('KG');
    const [restTimer, setRestTimer] = useState({ enabled: false, seconds: 60 });
    const [isInitialized, setIsInitialized] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [weightMoodLog, setWeightMoodLog] = useState([]);
    const [goals, setGoals] = useState([]);

    // Notification permission check
    useEffect(() => {
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const requestNotificationPermission = () => {
        if (!("Notification" in window)) return;
        Notification.requestPermission().then((permission) => {
            setNotificationPermission(permission);
        });
    };

    // Rest Timer - from hook
    const { activeRestTimer, startRestTimer, cancelRestTimer, extendRestTimer } = useRestTimer(requestNotificationPermission);

    // Personal Records - from hook
    const { personalRecords, exercisePRs } = usePersonalRecords(history);

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
                const savedWeightMoodLog = await getData('weight_mood_log');
                const savedGoals = await getData('goals');

                // Resolve initialTypes:
                // - Fresh install (null/empty)      → seed with all 4 defaults
                // - Pre-update existing install      → none of the saved types have a built-in ID,
                //                                     so prepend defaults in front of the custom ones
                // - Post-update existing install     → at least one built-in ID present; trust saved state
                //                                     (respects any defaults the user may have deleted)
                const hasBuiltIn = savedTypes && savedTypes.some(t =>
                    DEFAULT_WORKOUT_TYPES.some(d => d.id === t.id)
                );
                let initialTypes;
                let typesNeedPersist = false;
                if (!savedTypes || savedTypes.length === 0) {
                    // Fresh install
                    initialTypes = DEFAULT_WORKOUT_TYPES;
                } else if (!hasBuiltIn) {
                    // Pre-update install: merge defaults in front of custom types
                    initialTypes = [...DEFAULT_WORKOUT_TYPES, ...savedTypes];
                    typesNeedPersist = true; // Save merged list so migration runs only once
                } else {
                    // Already migrated
                    initialTypes = savedTypes;
                }
                setExtraTypes(initialTypes);
                if (typesNeedPersist) {
                    setData('workout_custom_types', initialTypes);
                }

                if (savedActive) setActiveWorkout(savedActive);
                if (savedUnit) setPreferredUnit(savedUnit);
                if (savedTimer) setRestTimer(savedTimer);
                if (savedWeightMoodLog) setWeightMoodLog(savedWeightMoodLog);
                if (savedGoals) setGoals(savedGoals);

                // --- History migration pipeline ---
                let currentHistory = savedHistory || [];

                // Migration 1: Deduplicate Exercise Names
                const MIGRATION_MAP = {
                    'Leg Extensions': 'Leg Extension',
                    'Preacher Curls': 'Preacher Curl',
                    'Lat Raise': 'Lateral Raises',
                    'Pulldown': 'Lat Pulldown',
                    'Seated Row': 'Seated Cable Row',
                    'Shoulder Press': 'Overhead Press (OHP)',
                    'Butterfly': 'Chest Fly (Machine/Dumbbell)',
                    'Reverse Flies': 'Reverse Pec Deck / Rear Delt Fly',
                    'cable Tricep Extension': 'Tricep Pushdown (Cable)',
                    'Cable Tricep Extension': 'Tricep Pushdown (Cable)',
                    'Pulley Bicep Curl Dropset': 'Cable Bicep Curl',
                    'Kickbacks': 'Glute Kickback'
                };

                let hasNameChanges = false;
                currentHistory = currentHistory.map(w => {
                    if (!w.exercises) return w;
                    const newExercises = w.exercises.map(ex => {
                        if (MIGRATION_MAP[ex.name]) {
                            hasNameChanges = true;
                            return { ...ex, name: MIGRATION_MAP[ex.name] };
                        }
                        return ex;
                    });
                    return { ...w, exercises: newExercises };
                });
                if (hasNameChanges) console.log('Migrated Exercise Names in History');

                // Migration 2: Backfill hadPR for legacy workouts
                const needsHadPRMigration = currentHistory.some(w => w.hadPR === undefined);
                if (needsHadPRMigration) {
                    const sorted = [...currentHistory].sort((a, b) =>
                        new Date(a.endTime) - new Date(b.endTime));

                    const setPRs = {};
                    const exerciseTotalPRs = {};

                    currentHistory = sorted.map(workout => {
                        if (workout.hadPR !== undefined) {
                            for (const ex of workout.exercises || []) {
                                if (ex.target !== 'Cardio' && ex.sets) {
                                    for (const s of ex.sets) {
                                        if (s.completed && s.weight > 0 && s.reps > 0) {
                                            const vol = s.weight * s.reps;
                                            if (vol > (setPRs[ex.name] || 0)) setPRs[ex.name] = vol;
                                        }
                                    }
                                    const totalVol = ex.sets.reduce((sum, s) =>
                                        sum + (s.completed ? s.weight * s.reps : 0), 0);
                                    if (totalVol > (exerciseTotalPRs[ex.name] || 0)) exerciseTotalPRs[ex.name] = totalVol;
                                }
                                if (ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                                    if (ex.accumulatedSeconds > (setPRs[ex.name] || 0)) setPRs[ex.name] = ex.accumulatedSeconds;
                                }
                            }
                            return workout;
                        }

                        let hadPR = false;
                        for (const ex of workout.exercises || []) {
                            if (ex.target !== 'Cardio' && ex.sets) {
                                const currentSetMax = setPRs[ex.name] || 0;
                                for (const s of ex.sets) {
                                    if (s.completed && s.weight > 0 && s.reps > 0) {
                                        const vol = s.weight * s.reps;
                                        if (vol > currentSetMax) { hadPR = true; setPRs[ex.name] = vol; }
                                    }
                                }
                                const totalVol = ex.sets.reduce((sum, s) =>
                                    sum + (s.completed ? s.weight * s.reps : 0), 0);
                                if (totalVol > (exerciseTotalPRs[ex.name] || 0)) {
                                    hadPR = true;
                                    exerciseTotalPRs[ex.name] = totalVol;
                                }
                            }
                            if (ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                                if (ex.accumulatedSeconds > (setPRs[ex.name] || 0)) {
                                    hadPR = true;
                                    setPRs[ex.name] = ex.accumulatedSeconds;
                                }
                            }
                        }
                        return { ...workout, hadPR };
                    });
                    console.log('Migrated hadPR for legacy workouts');
                }

                // Migration 3: Backfill splitId for records that don't have one yet.
                // Build a lookup from workout name -> splitId using the current types list.
                const needsSplitIdMigration = currentHistory.some(w => !w.splitId);
                if (needsSplitIdMigration) {
                    const nameToId = {};
                    initialTypes.forEach(t => { nameToId[t.name] = t.id; });
                    // Also include DEFAULT_WORKOUT_TYPES so names from before any deletion still match
                    DEFAULT_WORKOUT_TYPES.forEach(t => {
                        if (!nameToId[t.name]) nameToId[t.name] = t.id;
                    });

                    currentHistory = currentHistory.map(w => {
                        if (w.splitId) return w;
                        const id = nameToId[w.name];
                        return id ? { ...w, splitId: id } : w;
                    });
                    console.log('Backfilled splitId on legacy history records');
                }

                // Migration 4: Backfill bodyWeightSnapshot for legacy workouts
                const needsBwMigration = currentHistory.some(w => w.bodyWeightSnapshot === undefined);
                if (needsBwMigration) {
                    currentHistory = currentHistory.map(w => {
                        if (w.bodyWeightSnapshot !== undefined) return w;
                        
                        const workoutDate = new Date(w.endTime);
                        let closestWeight = 80;
                        
                        if (savedWeightMoodLog && savedWeightMoodLog.length > 0) {
                            // Find most recent log prior to or on the workout date
                            const sortedLogs = [...savedWeightMoodLog].sort((a,b) => new Date(a.date) - new Date(b.date));
                            for (const log of sortedLogs) {
                                if (new Date(log.date) <= workoutDate && log.weight > 0) {
                                    closestWeight = log.weight;
                                }
                            }
                        }
                        return { ...w, bodyWeightSnapshot: closestWeight };
                    });
                    console.log('Backfilled bodyWeightSnapshot on legacy history records');
                }

                setHistory(currentHistory);

                // Persist all migrations back to DB in one shot
                if (hasNameChanges || needsHadPRMigration || needsSplitIdMigration) {
                    setData('workout_history', currentHistory);
                }

            } catch (err) {
                console.error('Failed to load data from DB:', err);
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
        setData('weight_mood_log', weightMoodLog);
        setData('goals', goals);
    }, [history, activeWorkout, extraTypes, preferredUnit, restTimer, weightMoodLog, goals, isInitialized]);


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

    // Weight/mood log helpers
    const toDateStr = (date) => {
        const d = date instanceof Date ? date : new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const trackWeightMood = (weight, mood) => {
        const date = toDateStr(new Date());
        setWeightMoodLog(prev => {
            const filtered = prev.filter(e => e.date !== date);
            return [...filtered, { date, weight, mood }];
        });
    };

    const getWeightMoodForDate = (dateStr) => {
        return weightMoodLog.find(e => e.date === dateStr) || null;
    };

    const getLastWeightMoodEntry = () => {
        if (weightMoodLog.length === 0) return null;
        return [...weightMoodLog].sort((a, b) => b.date.localeCompare(a.date))[0];
    };

    // ── Goals ────────────────────────────────────────────────────────────────

    const addGoal = (goalData) => {
        const goal = {
            id: uuidv4(),
            ...goalData,
            createdAt: toDateStr(new Date()),
            completedAt: null,
            status: 'active'
        };
        setGoals(prev => [...prev, goal]);
        return goal;
    };

    const deleteGoal = (id) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    // Compute the live current value for a goal from history / weightMoodLog
    const getGoalCurrentValue = (goal, historySnapshot, weightLogSnapshot) => {
        const h = historySnapshot ?? history;
        const wl = weightLogSnapshot ?? weightMoodLog;
        if (goal.type === 'bodyweight') {
            if (!wl || wl.length === 0) return goal.initialValue;
            const latest = [...wl].sort((a, b) => b.date.localeCompare(a.date))[0];
            return latest?.weight ?? goal.initialValue;
        }
        // Exercise goal
        let best = goal.initialValue;
        for (const w of h) {
            for (const ex of (w.exercises || [])) {
                if (ex.name !== goal.exerciseName) continue;
                if (goal.isCardio) {
                    if ((ex.accumulatedSeconds || 0) > best) best = ex.accumulatedSeconds;
                } else if (goal.targetMetric === 'reps') {
                    for (const s of (ex.sets || [])) {
                        if (s.completed && s.reps > best) best = s.reps;
                    }
                } else {
                    for (const s of (ex.sets || [])) {
                        if (s.completed && s.weight > best) best = s.weight;
                    }
                }
            }
        }
        return best;
    };

    // Returns array of newly-completed goal objects (mutates goals state)
    const checkGoalCompletions = (newHistoryEntry, newWeightEntry) => {
        const today = toDateStr(new Date());
        const newlyCompleted = [];

        // Compute eagerly against the current goals snapshot so the return value
        // is populated synchronously — setGoals updaters run lazily at render time.
        const updatedGoals = goals.map(g => {
            if (g.status !== 'active') return g;

            let currentValue;
            if (g.type === 'bodyweight' && newWeightEntry) {
                currentValue = newWeightEntry.weight;
            } else if (g.type === 'exercise' && newHistoryEntry) {
                currentValue = g.initialValue;
                const ex = newHistoryEntry.exercises?.find(e => e.name === g.exerciseName);
                if (ex) {
                    if (g.isCardio) {
                        currentValue = ex.accumulatedSeconds || 0;
                    } else if (g.targetMetric === 'reps') {
                        const best = Math.max(...(ex.sets || []).filter(s => s.completed).map(s => s.reps || 0), 0);
                        if (best > 0) currentValue = best;
                    } else {
                        const best = Math.max(...(ex.sets || []).filter(s => s.completed).map(s => s.weight || 0), 0);
                        if (best > 0) currentValue = best;
                    }
                }
            } else {
                return g; // Not triggered by this event
            }

            const isComplete = g.targetValue > g.initialValue
                ? currentValue >= g.targetValue
                : currentValue <= g.targetValue;

            if (isComplete) {
                const completed = { ...g, status: 'completed', completedAt: today };
                newlyCompleted.push(completed);
                return completed;
            }
            return g;
        });

        setGoals(updatedGoals);
        return newlyCompleted;
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

    const editCustomType = (id, name, color, icon) => {
        setExtraTypes(extraTypes.map(t => {
            if (t.id !== id) return t;
            // Preserve i18nKey if the name hasn't changed from what i18nKey resolves to.
            // i.e. only strip it when the user intentionally renames the split.
            const original = DEFAULT_WORKOUT_TYPES.find(d => d.id === id);
            const originalName = original?.name ?? t.name;
            const keepKey = t.i18nKey && name === originalName;
            // eslint-disable-next-line no-unused-vars
            return { ...t, name, color, icon, i18nKey: keepKey ? t.i18nKey : undefined };
        }));
    };

    const moveType = (id, direction) => {
        const idx = extraTypes.findIndex(t => t.id === id);
        if (idx === -1) return;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= extraTypes.length) return;
        const updated = [...extraTypes];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        setExtraTypes(updated);
    };

    const startWorkout = (workoutDef) => {
        const { id: splitId, name, template } = workoutDef;
        let workout = createWorkout(name, name);
        workout.splitId = splitId;
        
        let currentBw = 80;
        if (weightMoodLog && weightMoodLog.length > 0) {
            const sorted = [...weightMoodLog].sort((a,b) => new Date(b.date) - new Date(a.date));
            const latestValid = sorted.find(l => l.weight > 0);
            if (latestValid) currentBw = latestValid.weight;
        }
        workout.bodyWeightSnapshot = currentBw;

        // 1. Try to find the last completed session for this split (by stable ID)
        const lastSession = history
            .filter(w => w.splitId === splitId && w.endTime)
            .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0]
            // Fallback: match by name for legacy records that have no splitId yet
            || history
                .filter(w => !w.splitId && w.name === name && w.endTime)
                .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

        if (lastSession) {
            // Copy exercises from history
            workout.exercises = lastSession.exercises.map(ex => ({
                ...createExercise(ex.name, ex.target),
                targetTimeMinutes: ex.targetTimeMinutes || 0,
                unilateral: ex.unilateral ?? false,
                sets: ex.sets.map(s => ({
                    ...s,
                    id: uuidv4(),
                    completed: false,
                    leftDone: false,
                    rightDone: false,
                }))
            }));
        } else if (template && template.length > 0) {
            // 2. Use the split's own template (covers built-ins on first use)
            workout.exercises = template.map(t => createExercise(t.name, t.target));
        } else {
            // 3. New custom workout with no template starts empty
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
                    timerState: 'finished',
                    timerStart: null,
                    accumulatedSeconds: (ex.accumulatedSeconds || 0) + elapsed
                };
            }
            return ex;
        });

        // Calculate if this workout had any PRs
        let hadPR = false;

        for (const ex of finalizedExercises) {
            // Check set-level PRs (single best set volume)
            if (ex.target !== 'Cardio' && ex.sets) {
                const historicalBest = personalRecords[ex.name]?.volume || 0;
                const historicalBestWeight = personalRecords[ex.name]?.weight || 0;
                for (const s of ex.sets) {
                    if (s.completed && s.weight >= 0 && s.reps > 0) {
                        const mult = s.unilateral ? 2 : 1;
                        const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, activeWorkout.bodyWeightSnapshot);
                        const vol = effectiveWeight * s.reps * mult;
                        const isNewPR = vol > historicalBest ||
                            (vol === historicalBest && s.weight > historicalBestWeight);
                        if (isNewPR) {
                            hadPR = true;
                            break;
                        }
                    }
                }
            }

            // Check exercise-level PRs (total volume)
            if (!hadPR && ex.target !== 'Cardio' && ex.sets) {
                const totalVol = ex.sets.reduce((sum, s) => {
                    const mult = s.unilateral ? 2 : 1;
                    const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, activeWorkout.bodyWeightSnapshot);
                    return sum + (s.completed ? effectiveWeight * s.reps * mult : 0);
                }, 0);
                const historicalTotalBest = exercisePRs[ex.name]?.totalVolume || 0;
                if (totalVol > historicalTotalBest) {
                    hadPR = true;
                }
            }

            // Check cardio PRs (duration)
            if (!hadPR && ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                const historicalCardio = personalRecords[ex.name]?.volume || 0;
                if (ex.accumulatedSeconds > historicalCardio) {
                    hadPR = true;
                }
            }

            if (hadPR) break;
        }

        const completed = {
            ...activeWorkout,
            exercises: finalizedExercises,
            endTime: endTime.toISOString(),
            hadPR
        };
        // splitId is already on activeWorkout from startWorkout; it carries through here.

        const newHistory = [...history, completed];
        setHistory(newHistory);
        setActiveWorkout(null);
        // Check exercise goal completions with the finished workout
        checkGoalCompletions(completed, null);
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

        // Find the most recent history entry for this exercise
        const lastEntry = [...history].reverse()
            .flatMap(w => w.exercises)
            .find(e => e.name === name);
        const unilateral = lastEntry?.unilateral ?? false;

        // Build the new exercise, pre-filling sets with last session's weight/reps
        const baseExercise = createExercise(name, target);
        if (target === 'Cardio') {
            baseExercise.targetTimeMinutes = lastEntry?.targetTimeMinutes ?? 10;
        }
        if (lastEntry?.sets?.length > 0) {
            const lastSets = lastEntry.sets.filter(s => s.completed);
            if (lastSets.length > 0) {
                baseExercise.sets = lastSets.map(s => ({
                    id: uuidv4(),
                    weight: s.weight,
                    reps: s.reps,
                    completed: false,
                    leftDone: false,
                    rightDone: false,
                    unilateral: s.unilateral ?? false,
                }));
            }
        }

        const newExercise = { ...baseExercise, unilateral };

        setActiveWorkout({
            ...activeWorkout,
            exercises: [...activeWorkout.exercises, newExercise]
        });
    };

    const removeExercise = (exerciseId) => {
        setActiveWorkout(current => {
            if (!current) return current;
            const updatedExercises = current.exercises.filter(ex => ex.id !== exerciseId);
            return { ...current, exercises: updatedExercises };
        });
    };

    const makeSuperset = (exerciseId) => {
        if (!activeWorkout) return;

        const exercises = [...activeWorkout.exercises];
        const index = exercises.findIndex(ex => ex.id === exerciseId);
        if (index <= 0) return; // Cannot superset the first element

        const currentEx = { ...exercises[index] };
        const prevEx = { ...exercises[index - 1] };

        currentEx.supersetWithAbove = true;

        // Equalize sets lengths to Math.max of both
        const maxSets = Math.max(currentEx.sets.length, prevEx.sets.length);

        currentEx.sets = [...currentEx.sets];
        while (currentEx.sets.length < maxSets) {
            currentEx.sets.push(createSet());
        }

        prevEx.sets = [...prevEx.sets];
        while (prevEx.sets.length < maxSets) {
            prevEx.sets.push(createSet());
        }

        exercises[index - 1] = prevEx;
        exercises[index] = currentEx;

        setActiveWorkout({ ...activeWorkout, exercises });
    };

    const breakSuperset = (exerciseId) => {
        if (!activeWorkout) return;
        const exercises = activeWorkout.exercises.map(ex => {
            if (ex.id === exerciseId) {
                return { ...ex, supersetWithAbove: false };
            }
            return ex;
        });
        setActiveWorkout({ ...activeWorkout, exercises });
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
    const renameExercise = (oldName, newName, newTarget = null, newBodyweight = null) => {
        // 1. Update History
        const updatedHistory = history.map(workout => ({
            ...workout,
            exercises: workout.exercises.map(ex => {
                if (ex.name === oldName) {
                    return {
                        ...ex,
                        name: newName,
                        target: newTarget || ex.target, // Update target if provided, else keep old
                        bodyweight: newBodyweight !== null ? newBodyweight : !!ex.bodyweight
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
                            target: newTarget || ex.target,
                            bodyweight: newBodyweight !== null ? newBodyweight : !!ex.bodyweight
                        };
                    }
                    return ex;
                })
            };
            setActiveWorkout(updatedActive);
        }
    };

    const addSet = (exerciseId) => {
        setActiveWorkout(current => {
            if (!current) return current;
            const updatedExercises = current.exercises.map(ex => {
                if (ex.id !== exerciseId) return ex;

                // Clone the last set's weight/reps if available, otherwise default
                const lastSet = ex.sets[ex.sets.length - 1];
                const newSet = {
                    id: uuidv4(),
                    weight: lastSet ? lastSet.weight : 0,
                    reps: lastSet ? lastSet.reps : 12,
                    completed: false,
                    leftDone: false,
                    rightDone: false,
                    unilateral: ex.unilateral ?? false,  // inherit exercise's current flag
                };

                return { ...ex, sets: [...ex.sets, newSet] };
            });
            return { ...current, exercises: updatedExercises };
        });
    };

    const removeSet = (exerciseId, setId = null) => {
        setActiveWorkout(current => {
            if (!current) return current;
            const updatedExercises = current.exercises.map(ex => {
                if (ex.id !== exerciseId) return ex;
                if (ex.sets.length <= 1) return ex; // Don't remove the last set

                // If a specific setId is provided (from the superset remove target), filter it out
                const newSets = setId ? ex.sets.filter(s => s.id !== setId) : ex.sets.slice(0, -1);
                
                // Safety net: if removing by ID somehow clears all sets, fallback to leaving the first one
                if (newSets.length === 0) return ex;

                return { ...ex, sets: newSets };
            });
            return { ...current, exercises: updatedExercises };
        });
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
            makeSuperset,
            breakSuperset,
            reorderExercise,
            renameExercise,
            toggleUnit,
            preferredUnit,
            extraTypes,
            createCustomType,
            deleteCustomType,
            editCustomType,
            moveType,
            updateExercise,
            restTimer,
            setRestTimer,
            activeRestTimer,
            startRestTimer,
            cancelRestTimer,
            extendRestTimer,
            personalRecords,
            exercisePRs,
            notificationPermission,
            requestNotificationPermission,
            weightMoodLog,
            trackWeightMood,
            getWeightMoodForDate,
            getLastWeightMoodEntry,
            goals,
            addGoal,
            deleteGoal,
            getGoalCurrentValue,
            checkGoalCompletions
        }}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => useContext(WorkoutContext);
