import React, { useMemo } from 'react';
import { EXERCISE_TYPES, WORKOUT_TEMPLATES } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function ExerciseHistory() {
    const { history } = useWorkoutContext();
    const navigate = useNavigate();

    // Get unique exercises from history and templates
    const uniqueExercises = useMemo(() => {
        const exercises = new Set();

        // Add from templates
        Object.values(WORKOUT_TEMPLATES).flat().forEach(ex => exercises.add(ex.name));

        // Add from history
        if (history) {
            history.forEach(workout => {
                if (workout.exercises) {
                    workout.exercises.forEach(ex => exercises.add(ex.name));
                }
            });
        }

        return Array.from(exercises).sort();
    }, [history]);

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <h1 style={{ marginBottom: 'var(--space-md)' }}>Exercise History</h1>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                {uniqueExercises.map(name => (
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
    );
}
