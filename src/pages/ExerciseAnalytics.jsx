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

        // 1. Filter workouts containing the exercise
        const relevantWorkouts = history
            .filter(w => w.exercises.some(ex => ex.name === exerciseName));

        if (relevantWorkouts.length === 0) return null;

        // 2. Aggregate Max Weight by Date
        const maxWeightByDate = {};

        relevantWorkouts.forEach(w => {
            const dateStr = new Date(w.startTime).toLocaleDateString();
            const ex = w.exercises.find(e => e.name === exerciseName);

            if (ex) {
                // Find max weight in this session (ignore incomplete sets if you prefer, but usually all sets count for strength history)
                const sessionMax = Math.max(...ex.sets.map(s => Number(s.weight) || 0));

                if (!maxWeightByDate[dateStr] || sessionMax > maxWeightByDate[dateStr]) {
                    maxWeightByDate[dateStr] = sessionMax;
                }
            }
        });

        // 3. Sort Dates
        const sortedDates = Object.keys(maxWeightByDate).sort((a, b) => {
            // parse localized date string back to timestamp for sorting is tricky depending on locale
            // Better to use ISO string keys for sorting, but for display we want locale.
            // Let's rely on the fact that relevantWorkouts usually comes chronologically or we can sort by timestamps first.
            // Actually, let's just sort the unique dates we found.
            // A simple way is to convert the date string back to a Date object.
            const dateA = new Date(a.split('/').reverse().join('-')); // Hacky for DD/MM/YYYY. 
            // Better approach: Store timestamp in keys or just sort the filtered workouts first (which we did).
            return new Date(a) - new Date(b);
        });

        // Re-sorting implementation to be safer:
        // Use a Map or Object where keys are YYYY-MM-DD for sorting, and then format for display.
        const dateMap = new Map();
        relevantWorkouts.forEach(w => {
            // Use YYYY-MM-DD for consistent sorting keys
            const d = new Date(w.startTime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const ex = w.exercises.find(e => e.name === exerciseName);
            const sessionMax = ex ? Math.max(...ex.sets.map(s => Number(s.weight) || 0)) : 0;

            if (!dateMap.has(key) || sessionMax > dateMap.get(key)) {
                dateMap.set(key, sessionMax);
            }
        });

        const sortedKeys = Array.from(dateMap.keys()).sort();

        const labels = sortedKeys.map(k => {
            const [y, m, d] = k.split('-');
            return `${d}/${m}`;
        });

        const dataPoints = sortedKeys.map(k => dateMap.get(k));

        return {
            labels,
            datasets: [
                {
                    label: 'Max Weight (kg)',
                    data: dataPoints,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    tension: 0.3,
                    pointRadius: 4,
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
