import React from 'react';
import SetRow from './SetRow';
import { MoreVertical, Repeat, Plus, Minus } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';

export default function ExerciseCard({ exercise, onSwap }) {
    const { updateSet, addSet, removeSet } = useWorkout();

    const handleSetUpdate = (setId, updates) => {
        updateSet(exercise.id, setId, updates);
    };

    return (
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)'
            }}>
                <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{exercise.name}</h3>
                <button className="btn" style={{ padding: '0.25rem', background: 'transparent', border: 'none' }} onClick={() => onSwap(exercise.id)}>
                    <Repeat size={20} color="var(--text-muted)" />
                </button>
            </div>

            <div style={{ marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                <span style={{ width: '24px' }}></span>
                <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', textAlign: 'center' }}>WEIGHT</span>
                <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', textAlign: 'center' }}>REPS</span>
                <span style={{ width: '36px' }}></span>
            </div>

            {exercise.sets.map((set, index) => (
                <React.Fragment key={set.id}>
                    <SetRow
                        set={set}
                        index={index}
                        onUpdate={(updates) => handleSetUpdate(set.id, updates)}
                    />
                    {/* Optional: Add a delete set button visible on long press or similar? For now, let's just use the main controls at the bottom */}
                </React.Fragment>
            ))}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button
                    className="btn"
                    style={{ padding: '0.5rem', height: '32px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
                    onClick={() => {
                        if (exercise.sets.length > 0) {
                            removeSet(exercise.id, exercise.sets[exercise.sets.length - 1].id)
                        }
                    }}
                    disabled={exercise.sets.length === 0}
                >
                    <Minus size={16} /> Set
                </button>
                <button
                    className="btn"
                    style={{ padding: '0.5rem', height: '32px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
                    onClick={() => addSet(exercise.id)}
                >
                    <Plus size={16} /> Set
                </button>
            </div>
        </div>
    );
}
