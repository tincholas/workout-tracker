import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ArrowLeft } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function ExerciseAnalytics() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const exerciseName = searchParams.get('exercise');
    const { history, renameExercise } = useWorkout();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(exerciseName || '');

    const chartData = useMemo(() => {
        if (!history || !exerciseName) return null;

        // Filter workouts containing the exercise
        const relevantWorkouts = history
            .filter(w => w.exercises.some(ex => ex.name === exerciseName))
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (relevantWorkouts.length === 0) return null;

        const labels = relevantWorkouts.map(w => {
            const date = new Date(w.startTime);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });

        const maxWeights = relevantWorkouts.map(w => {
            const ex = w.exercises.find(e => e.name === exerciseName);
            if (!ex) return 0;
            // Find max weight in successful sets
            const completedSets = ex.sets.filter(s => s.completed);
            if (completedSets.length === 0) return 0;
            return Math.max(...completedSets.map(s => s.weight));
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Max Weight (kg)',
                    data: maxWeights,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.3,
                },
            ],
        };
    }, [history, exerciseName]);

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#a3a3a3' } },
            title: { display: true, text: 'Strength Progression', color: '#fff' },
        },
        scales: {
            y: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#a3a3a3' },
                beginAtZero: true
            },
            x: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#a3a3a3' }
            }
        }
    };

    const handleRename = (e) => {
        e.preventDefault();
        if (editName && editName !== exerciseName) {
            if (confirm(`Rename "${exerciseName}" to "${editName}" globally?`)) {
                renameExercise(exerciseName, editName);
                // Update URL without reload to reflect new name
                navigate(`/analytics?exercise=${encodeURIComponent(editName)}`, { replace: true });
            }
        }
        setIsEditing(false);
    };

    if (!exerciseName) return <div style={{ padding: '1rem' }}>No exercise selected</div>;

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <button
                className="btn"
                style={{ marginBottom: '1rem', padding: '0.5rem' }}
                onClick={() => navigate('/history')}
            >
                <ArrowLeft size={16} /> Back
            </button>

            {isEditing ? (
                <form onSubmit={handleRename} style={{ marginBottom: 'var(--space-lg)' }}>
                    <input
                        className="input"
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => setIsEditing(false)}
                    />
                </form>
            ) : (
                <h1
                    style={{ marginBottom: 'var(--space-lg)', cursor: 'text', borderBottom: '1px dashed #333', display: 'inline-block' }}
                    onClick={() => { setEditName(exerciseName); setIsEditing(true); }}
                >
                    {exerciseName} <span style={{ fontSize: '0.4em', color: 'var(--text-muted)', verticalAlign: 'middle' }}>(Edit)</span>
                </h1>
            )}

            <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No data recorded for this exercise yet.</p>
                )}
            </div>
        </div>
    );
}
