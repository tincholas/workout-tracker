import React from 'react';
import SetRow from './SetRow';
import { MoreVertical, Repeat } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';

export default function ExerciseCard({ exercise, onSwap }) {
    const { updateSet } = useWorkout();

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
                <SetRow
                    key={set.id}
                    set={set}
                    index={index}
                    onUpdate={(updates) => handleSetUpdate(set.id, updates)}
                />
            ))}
        </div>
    );
}
