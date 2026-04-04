import React, { useState, useRef, useEffect } from 'react';
import SetRow from './SetRow';
import CardioTimer from './CardioTimer';
import RestTimer from './RestTimer';
import { useWorkout } from '../store/WorkoutContext';
import { RefreshCw, Plus, Minus, Trash2, MoreVertical, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { calculateEffectiveWeight } from '../utils/volumeCalc';
import { useNavigate } from 'react-router-dom';

export default function ExerciseCard({ exercise, ...props }) {
    const { addSet, removeSet, removeExercise, updateSet, updateExercise, preferredUnit, toggleUnit, restTimer, startRestTimer, activeRestTimer, cancelRestTimer, reorderExercise, activeWorkout } = useWorkout();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSetUpdate = (setId, updates) => {
        updateSet(exercise.id, setId, updates);

        // Trigger rest timer when a set is completed OR when either side of a unilateral set is done
        const sideCompleted = updates.leftDone === true || updates.rightDone === true;
        if ((updates.completed === true || sideCompleted) && restTimer.enabled && restTimer.seconds > 0) {
            startRestTimer(exercise.id, restTimer.seconds);
        }
    };

    const isResting = activeRestTimer && activeRestTimer.exerciseId === exercise.id;

    // --- PR Logic (Single Best Set) ---
    const { personalRecords, exercisePRs } = useWorkout();

    const { activePRSetId, effectivePRVolume } = React.useMemo(() => {
        // Start with historical best
        let maxVol = personalRecords[exercise.name]?.volume || 0;
        let maxWeight = personalRecords[exercise.name]?.weight || 0;
        let bestSetId = null;

        exercise.sets.forEach(s => {
            if (s.completed && s.weight >= 0 && s.reps > 0) {
                const mult = s.unilateral ? 2 : 1;
                const effectiveWeight = calculateEffectiveWeight(s.weight, exercise.bodyweight, activeWorkout?.bodyWeightSnapshot);
                const vol = effectiveWeight * s.reps * mult;
                const isNewPR = vol > maxVol || (vol === maxVol && s.weight > maxWeight);
                if (isNewPR) {
                    maxVol = vol;
                    maxWeight = s.weight;
                    bestSetId = s.id;
                }
            }
        });

        return { activePRSetId: bestSetId, effectivePRVolume: maxVol };
    }, [exercise.sets, exercise.name, personalRecords, exercise.bodyweight, activeWorkout?.bodyWeightSnapshot]);

    // --- Exercise-Level PR Logic ---
    // Read sets directly from activeWorkout so we always have the freshest values.
    const liveSets = activeWorkout?.exercises?.find(e => e.id === exercise.id)?.sets ?? exercise.sets;

    // --- Cardio live elapsed (tick every second while running) ---
    const isCardio = exercise.target === 'Cardio';
    const isTimerRunning = isCardio && exercise.timerState === 'running';
    const [now, setNow] = React.useState(Date.now());

    React.useEffect(() => {
        if (!isTimerRunning) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [isTimerRunning]);

    const cardioElapsed = React.useMemo(() => {
        if (!isCardio) return 0;
        const accumulated = exercise.accumulatedSeconds || 0;
        if (isTimerRunning && exercise.timerStart) {
            return accumulated + (now - new Date(exercise.timerStart).getTime()) / 1000;
        }
        return accumulated;
    }, [isCardio, exercise.accumulatedSeconds, isTimerRunning, exercise.timerStart, now]);

    const cardioPRBest = isCardio ? (personalRecords[exercise.name]?.volume || 0) : 0;

    // ACTUAL PR: completed sets already beat the record → yellow border
    const isActualPR = React.useMemo(() => {
        if (isCardio) {
            return cardioPRBest > 0 && cardioElapsed > cardioPRBest;
        }
        const best = exercisePRs[exercise.name]?.totalVolume || 0;
        if (best === 0) return false;
        const completedVolume = liveSets.reduce((sum, s) => {
            const mult = s.unilateral ? 2 : 1;
            const effectiveWeight = calculateEffectiveWeight(s.weight, exercise.bodyweight, activeWorkout?.bodyWeightSnapshot);
            return sum + (s.completed ? effectiveWeight * (Number(s.reps) || 0) * mult : 0);
        }, 0);
        return completedVolume > best;
    }, [isCardio, cardioPRBest, cardioElapsed, liveSets, exercise.name, exercisePRs, exercise.bodyweight, activeWorkout?.bodyWeightSnapshot]);

    // POTENTIAL PR: all entered values would beat the record → yellow glow
    const isPotentialPR = React.useMemo(() => {
        if (isCardio) {
            const targetSeconds = (Number(exercise.targetTimeMinutes) || 0) * 60;
            return cardioPRBest > 0 && targetSeconds > cardioPRBest;
        }
        const best = exercisePRs[exercise.name]?.totalVolume || 0;
        if (best === 0) return false;
        const potentialVolume = liveSets.reduce((sum, s) => {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            const effectiveWeight = calculateEffectiveWeight(w, exercise.bodyweight, activeWorkout?.bodyWeightSnapshot);
            if (effectiveWeight <= 0 || r <= 0) return sum;
            // Completed sets: use their stamped flag; uncompleted: use current exercise mode
            const mult = s.completed ? (s.unilateral ? 2 : 1) : (exercise.unilateral ? 2 : 1);
            return sum + effectiveWeight * r * mult;
        }, 0);
        return potentialVolume > best;
    }, [isCardio, exercise.targetTimeMinutes, cardioPRBest, liveSets, exercise.name, exercise.unilateral, exercisePRs, exercise.bodyweight, activeWorkout?.bodyWeightSnapshot]);

    return (
        <motion.div
            layout
            initial={props.variants ? undefined : { opacity: 0, y: 20 }}
            animate={props.variants ? undefined : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card"
            style={{
                padding: '1rem',
                marginBottom: '1rem',
                overflow: 'hidden',
                border: isActualPR ? '2px solid #f59e0b' : '2px solid transparent',
                boxShadow: isPotentialPR
                    ? '0 0 12px rgba(245, 158, 11, 0.3)'
                    : 'var(--shadow-convex)',
            }}
            {...props}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3
                        style={{ margin: 0, fontSize: '1.1rem', cursor: 'pointer' }}
                        onClick={() => navigate(`/analytics?exercise=${encodeURIComponent(exercise.name)}&back=/session`)}
                    >
                        {t(`exercises.${exercise.name}`, { defaultValue: exercise.name })}
                    </h3>
                    <AnimatePresence>
                        {isActualPR && (
                            <motion.div
                                key="pr-trophy"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                title="Personal Record!"
                            >
                                <Trophy size={18} color="#f59e0b" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {isResting && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <RestTimer
                                    endTime={activeRestTimer.endTime}
                                    totalDuration={activeRestTimer.totalDuration}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        className="btn"
                        onClick={() => setShowMenu(!showMenu)}
                        style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-muted)' }}
                    >
                        <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, originTR: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    zIndex: 10,
                                    minWidth: '160px',
                                    overflow: 'hidden'
                                }}
                            >
                                <button
                                    onClick={() => { reorderExercise(exercise.id, 'UP'); setShowMenu(false); }}
                                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                                >
                                    <ArrowUp size={16} /> {t('move_up')}
                                </button>
                                <button
                                    onClick={() => { reorderExercise(exercise.id, 'DOWN'); setShowMenu(false); }}
                                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                                >
                                    <ArrowDown size={16} /> {t('move_down')}
                                </button>
                                {!isCardio && (
                                    <button
                                        onClick={() => {
                                            const newVal = !exercise.unilateral;
                                            // Scale weight on uncompleted sets and reset side flags
                                            const updatedSets = exercise.sets.map(s => {
                                                if (s.completed) return s;
                                                const rawWeight = newVal
                                                    ? (s.weight || 0) / 2          // bilateral → unilateral: halve
                                                    : (s.weight || 0) * 2;         // unilateral → bilateral: double
                                                const scaledWeight = Math.round(rawWeight * 2) / 2; // round to 0.5 kg
                                                return { ...s, unilateral: newVal, leftDone: false, rightDone: false, weight: scaledWeight };
                                            });
                                            updateExercise(exercise.id, { unilateral: newVal, sets: updatedSets });
                                            setShowMenu(false);
                                        }}
                                        style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                                    >
                                        🔁 {exercise.unilateral ? t('make_bilateral', { defaultValue: 'Make Bilateral' }) : t('make_unilateral', { defaultValue: 'Make Unilateral' })}
                                    </button>
                                )}

                                <button
                                    onClick={() => { removeExercise(exercise.id); setShowMenu(false); }}
                                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} /> {t('remove')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {exercise.target === 'Cardio' ? (
                <CardioTimer exercise={exercise} />
            ) : (
                <>
                    <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: exercise.unilateral ? '2rem 1fr 1fr 76px' : '2rem 1fr 1fr 36px', gap: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('set')}</span>
                        <span
                            onClick={toggleUnit}
                            style={{ fontSize: '0.8rem', color: exercise.bodyweight ? 'var(--text-muted)' : 'var(--primary)', textAlign: 'center', cursor: exercise.bodyweight ? 'default' : 'pointer', fontWeight: 'bold' }}
                        >
                            {exercise.bodyweight ? "Extra Wt" : preferredUnit}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('reps')}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {exercise.unilateral ? 'L / R' : ''}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AnimatePresence initial={false}>
                            {exercise.sets.map((set, index) => (
                                <motion.div
                                    key={set.id}
                                    data-set-id={set.id}
                                    data-set-completed={set.completed ? 'true' : 'false'}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    transition={{ opacity: { duration: 0.2 }, height: { duration: 0.3 } }}
                                >
                                    <SetRow
                                        set={set}
                                        index={index}
                                        onUpdate={(updates) => handleSetUpdate(set.id, updates)}
                                        exerciseName={exercise.name}
                                        isPR={set.id === activePRSetId}
                                        isUnilateral={!!exercise.unilateral}
                                        exerciseIsUnilateral={!!exercise.unilateral}
                                        isBodyweight={!!exercise.bodyweight}
                                        prVolume={effectivePRVolume}
                                        bodyWeightSnapshot={activeWorkout?.bodyWeightSnapshot}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => addSet(exercise.id)}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={16} /> {t('add_set')}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => removeSet(exercise.id)}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            disabled={exercise.sets.length <= 1}
                        >
                            <Minus size={16} /> {t('remove_set')}
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
