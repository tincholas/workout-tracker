import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import { MUSCLE_GROUPS } from '../store/models';
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

    // Find current target from history
    const currentTarget = React.useMemo(() => {
        if (!history || !exerciseName) return '';
        for (const w of history) {
            const ex = w.exercises.find(e => e.name === exerciseName);
            if (ex && ex.target) return ex.target;
        }
        return '';
    }, [history, exerciseName]);

    const [editTarget, setEditTarget] = React.useState(currentTarget);

    // Update editTarget when currentTarget is found (initial load)
    React.useEffect(() => {
        setEditTarget(currentTarget);
    }, [currentTarget]);

    const chartData = useMemo(() => {
        if (!history || !exerciseName) return null;

        // 1. Filter workouts containing the exercise
        const relevantWorkouts = history
            .filter(w => w.exercises.some(ex => ex.name === exerciseName));

        if (relevantWorkouts.length === 0) return null;

        // 2. Aggregate Max Weight OR Duration by Date
        const dateMap = new Map();
        relevantWorkouts.forEach(w => {
            // Use YYYY-MM-DD for consistent sorting keys
            const d = new Date(w.startTime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const ex = w.exercises.find(e => e.name === exerciseName);

            let val = 0;
            if (ex) {
                if (ex.target === 'Cardio') {
                    // Calculate Total Minutes
                    // stored as accumulatedSeconds
                    const seconds = ex.accumulatedSeconds || 0;
                    val = Number((seconds / 60).toFixed(2)); // Minutes
                } else {
                    // Max Weight
                    val = Math.max(...ex.sets.map(s => Number(s.weight) || 0));
                }
            }

            if (!dateMap.has(key) || val > dateMap.get(key)) {
                // For cardio on same day, maybe sum? 
                // "evolution of how many minutes you have done per workout"
                // Usually analytics show per workout. If multiple workouts on same day, maybe max or sum.
                // Weight is max. Cardio volume usually sum?
                // But let's stick to "Session Best" logic or "Session Total"?
                // If I run twice, I probably want to know my total mileage?
                // Let's keep it max for now to be consistent with weight logic, OR overwrite if later.
                // Actually, if I run 10 mins then 20 mins, max is 20.
                // If I do 100kg then 110kg, max is 110.
                // Let's use MAX for now for consistency, but maybe SUM is better for cardio volume.
                // User said: "evolution of how many minutes you have done per workout" -> Implies per session.

                // If I have multiple cardio sessions in one day, I'll take the longest one??
                // Or maybe I should sum them if they are in the *same* workout? (Already handled by array find).
                // If different workouts on same day:
                // Let's use val > current ? val : current (MAX behavior)
                dateMap.set(key, val);
            }
        });

        const sortedKeys = Array.from(dateMap.keys()).sort();

        const labels = sortedKeys.map(k => {
            const [y, m, d] = k.split('-');
            return `${d}/${m}`;
        });

        const dataPoints = sortedKeys.map(k => dateMap.get(k));

        const isCardio = currentTarget === 'Cardio';

        return {
            labels,
            datasets: [
                {
                    label: isCardio ? 'Duration (Minutes)' : 'Max Weight (kg)',
                    data: dataPoints,
                    borderColor: isCardio ? '#22c55e' : '#ef4444',
                    backgroundColor: isCardio ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                    tension: 0.3,
                    pointRadius: 4,
                },
            ],
        };
    }, [history, exerciseName, currentTarget]);

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
        const changedName = editName && editName !== exerciseName;
        const changedTarget = editTarget && editTarget !== currentTarget;

        if (changedName || changedTarget) {
            if (confirm(`Update "${exerciseName}"? \nName: ${editName}\nTarget: ${editTarget || 'Unchanged'}`)) {
                renameExercise(exerciseName, editName, editTarget);
                // Update URL without reload to reflect new name if changed
                if (changedName) {
                    navigate(`/analytics?exercise=${encodeURIComponent(editName)}`, { replace: true });
                }
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
                <form onSubmit={handleRename} style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name</label>
                    <input
                        className="input"
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                    />

                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Muscle Group</label>
                    <select
                        className="input"
                        style={{ padding: '0.8rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #444' }}
                        value={editTarget}
                        onChange={e => setEditTarget(e.target.value)}
                    >
                        <option value="" style={{ backgroundColor: '#1f2937' }}>Select (Optional)</option>
                        {MUSCLE_GROUPS.map(g => (
                            <option key={g} value={g} style={{ backgroundColor: '#1f2937' }}>{g}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary">Save</button>
                        <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
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
