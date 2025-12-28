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

        // Templates
        Object.values(WORKOUT_TEMPLATES).flat().forEach(ex => add(ex.name, ex.target));

        // History
        if (history) {
            history.forEach(workout => {
                if (workout.exercises) {
                    workout.exercises.forEach(ex => add(ex.name, ex.target || 'Custom'));
                }
            });
        }

        return map;
    }, [history]);

    const targets = Object.keys(exercisesByTarget).sort();

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <h1 style={{ marginBottom: 'var(--space-md)' }}>Exercise History</h1>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {targets.map(target => (
                    <div key={target}>
                        <h3 style={{ marginLeft: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px' }}>{target}</h3>
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
