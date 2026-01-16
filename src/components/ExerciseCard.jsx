import React, { useState, useRef, useEffect } from 'react';
import SetRow from './SetRow';
import CardioTimer from './CardioTimer';
import RestTimer from './RestTimer';
import { useWorkout } from '../store/WorkoutContext';
import { RefreshCw, Plus, Minus, Trash2, MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';

export default function ExerciseCard({ exercise, onSwap }) {
    const { addSet, removeSet, removeExercise, updateSet, preferredUnit, toggleUnit, restTimer, startRestTimer, activeRestTimer, cancelRestTimer, reorderExercise } = useWorkout();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

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

        // Trigger Rest Timer if enabled and set is completed
        if (updates.completed === true && restTimer.enabled && restTimer.seconds > 0) {
            startRestTimer(exercise.id, restTimer.seconds);
        }
    };

    const isResting = activeRestTimer && activeRestTimer.exerciseId === exercise.id;

    // --- PR Logic (Single Best Set) ---
    const { personalRecords } = useWorkout();

    const activePRSetId = React.useMemo(() => {
        // Start with historical best
        let maxVol = personalRecords[exercise.name]?.volume || 0;
        let bestSetId = null;

        // Iterate strictly in order (index 0 to N)
        // If a set BEATS the current max, it takes the crown.
        exercise.sets.forEach(s => {
            if (s.completed && s.weight > 0 && s.reps > 0) {
                const vol = s.weight * s.reps;
                // Strict inequality: Must beat history AND any previous PR set in this session.
                if (vol > maxVol) {
                    maxVol = vol;
                    bestSetId = s.id;
                }
            }
        });

        // If bestSetId is still null, it means no set beat the history.
        return bestSetId;
    }, [exercise.sets, exercise.name, personalRecords]);

    return (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{exercise.name}</h3>
                    {isResting && (
                        <RestTimer
                            endTime={activeRestTimer.endTime}
                            totalDuration={activeRestTimer.totalDuration}
                            onComplete={cancelRestTimer}
                        />
                    )}
                </div>

                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        className="btn"
                        onClick={() => setShowMenu(!showMenu)}
                        style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-muted)' }}
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMenu && (
                        <div style={{
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
                        }}>
                            <button
                                onClick={() => { reorderExercise(exercise.id, 'UP'); setShowMenu(false); }}
                                style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                            >
                                <ArrowUp size={16} /> Move Up
                            </button>
                            <button
                                onClick={() => { reorderExercise(exercise.id, 'DOWN'); setShowMenu(false); }}
                                style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                            >
                                <ArrowDown size={16} /> Move Down
                            </button>
                            <button
                                onClick={() => { onSwap(exercise.id); setShowMenu(false); }}
                                style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                            >
                                <RefreshCw size={16} /> Replace
                            </button>
                            <button
                                onClick={() => { removeExercise(exercise.id); setShowMenu(false); }}
                                style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} /> Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {exercise.target === 'Cardio' ? (
                <CardioTimer exercise={exercise} />
            ) : (
                <>
                    <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SET</span>
                        <span
                            onClick={toggleUnit}
                            style={{ fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {preferredUnit}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>REPS</span>
                        <span style={{ width: '24px' }}></span>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                        {exercise.sets.map((set, index) => (
                            <SetRow
                                key={set.id}
                                set={set}
                                index={index}
                                onUpdate={(updates) => handleSetUpdate(set.id, updates)}
                                exerciseName={exercise.name}
                                isPR={set.id === activePRSetId}
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => addSet(exercise.id)}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={16} /> Set
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => removeSet(exercise.id)}
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            disabled={exercise.sets.length <= 1}
                        >
                            <Minus size={16} /> Set
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
