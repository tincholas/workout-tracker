import React, { useMemo } from 'react';
import { EXERCISE_TYPES, WORKOUT_TEMPLATES } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function ExerciseHistory() {
    const { history } = useWorkoutContext();
    const navigate = useNavigate();

    // Get unique exercises grouped by Target
    const exercisesByTarget = useMemo(() => {
        const map = {};

        // Helper to add
        const add = (name, target) => {
            if (!map[target]) map[target] = new Set();
            map[target].add(name);
        };

        // Only show exercises that have history
        if (history) {
            history.forEach(workout => {
                if (workout.exercises) {
                    workout.exercises.forEach(ex => {
                        // Only add if there is at least one completed set or some weight recorded
                        // Actually, user said "had some activity tracked", so appearance in history is sufficient.
                        add(ex.name, ex.target || 'Custom');
                    });
                }
            });
        }

        return map;
    }, [history]);

    const targets = Object.keys(exercisesByTarget).sort();

    return (
        <div style={{
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-app)',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ marginBottom: 'var(--space-md)' }}>Exercise History</h1>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {targets.map(target => (
                    <div key={target}>
                        <h3
                            style={{
                                marginLeft: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--color-primary)',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                display: 'inline-block'
                            }}
                            onClick={() => navigate(`/analytics?target=${encodeURIComponent(target)}`)}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                            {target}
                        </h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {Array.from(exercisesByTarget[target]).sort().map(name => (
                                <div
                                    key={name}
                                    className="card"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        padding: '1rem'
                                    }}
                                    onClick={() => navigate(`/analytics?exercise=${encodeURIComponent(name)}`)}
                                >
                                    <span>{name}</span>
                                    <ChevronRight size={16} color="var(--text-muted)" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
