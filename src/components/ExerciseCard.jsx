import React from 'react';
import SetRow from './SetRow';
import CardioTimer from './CardioTimer';
import RestTimer from './RestTimer';
import { useWorkout } from '../store/WorkoutContext';
import { RefreshCw, Plus, Minus, Trash2 } from 'lucide-react';

export default function ExerciseCard({ exercise, onSwap }) {
    const { addSet, removeSet, removeExercise, updateSet, preferredUnit, toggleUnit, restTimer, startRestTimer, activeRestTimer, cancelRestTimer } = useWorkout();

    const handleSetUpdate = (setId, updates) => {
        updateSet(exercise.id, setId, updates);

        // Trigger Rest Timer if enabled and set is completed
        if (updates.completed === true && restTimer.enabled && restTimer.seconds > 0) {
            startRestTimer(exercise.id, restTimer.seconds);
        }
    };

    const isResting = activeRestTimer && activeRestTimer.exerciseId === exercise.id;

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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => onSwap(exercise.id)} style={{ padding: '0.4rem' }}>
                        <RefreshCw size={16} />
                    </button>
                    <button className="btn btn-danger" onClick={() => removeExercise(exercise.id)} style={{ padding: '0.4rem', color: '#ef4444', borderColor: '#ef4444' }}>
                        <Trash2 size={16} />
                    </button>
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
