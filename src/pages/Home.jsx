import React from 'react';
import { EXERCISE_TYPES, SPLIT_COLORS } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Anchor, Move, Footprints } from 'lucide-react';

const SPLIT_ICONS = {
    [EXERCISE_TYPES.CHEST_TRICEPS]: Dumbbell,
    [EXERCISE_TYPES.BACK_BICEPS]: Anchor,
    [EXERCISE_TYPES.SHOULDERS]: Move,
    [EXERCISE_TYPES.LEGS]: Footprints
};

export default function Home() {
    const { startWorkout, activeWorkout } = useWorkoutContext();
    const navigate = useNavigate();

    const handleStart = (type) => {
        startWorkout(type);
        navigate('/session');
    };

    if (activeWorkout) {
        return (
            <div style={{ padding: 'var(--space-md)' }}>
                <div className="card">
                    <h2>⚠️ Workout in Progress</h2>
                    <p>You have an active session.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/session')}>Resume Workout</button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <h1 style={{ marginBottom: 'var(--space-lg)' }}>Start Workout</h1>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                {Object.values(EXERCISE_TYPES).filter(t => t !== 'Custom').map(type => {
                    const Icon = SPLIT_ICONS[type] || Dumbbell;
                    return (
                        <button
                            key={type}
                            className="card"
                            style={{
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderLeft: `4px solid ${SPLIT_COLORS[type]}`,
                                padding: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onClick={() => handleStart(type)}
                        >
                            <div style={{
                                background: `${SPLIT_COLORS[type]}20`,
                                padding: '0.75rem',
                                borderRadius: '50%',
                                color: SPLIT_COLORS[type]
                            }}>
                                <Icon size={24} />
                            </div>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{type}</h3>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
