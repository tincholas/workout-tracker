import React from 'react';
import { EXERCISE_TYPES } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';

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
                {Object.values(EXERCISE_TYPES).map(type => (
                    <button
                        key={type}
                        className="card"
                        style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid #333' }}
                        onClick={() => handleStart(type)}
                    >
                        <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{type}</h3>
                    </button>
                ))}
            </div>
        </div>
    );
}
