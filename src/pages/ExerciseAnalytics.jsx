import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import { MUSCLE_GROUPS } from '../store/models';
import '../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { ArrowLeft } from 'lucide-react';
import { TARGET_COLORS } from '../store/models';

export default function ExerciseAnalytics() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const exerciseName = searchParams.get('exercise');
    const targetGroup = searchParams.get('target');
    const { history, renameExercise } = useWorkout();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(exerciseName || '');

    // Find current target from history (only used for single exercise mode)
    const currentTarget = React.useMemo(() => {
        if (targetGroup) return targetGroup; // If viewing a group, that is the target
        if (!history || !exerciseName) return '';
        for (const w of history) {
            const ex = w.exercises.find(e => e.name === exerciseName);
            if (ex && ex.target) return ex.target;
        }
        return '';
    }, [history, exerciseName, targetGroup]);

    const [editTarget, setEditTarget] = React.useState(currentTarget);

    // Update editTarget when currentTarget is found (initial load)
    React.useEffect(() => {
        setEditTarget(currentTarget);
    }, [currentTarget]);

    const chartData = useMemo(() => {
        if (!history) return null;
        if (!exerciseName && !targetGroup) return null;

        let datasets = [];
        let allDates = new Set();
        const dateValuesMap = {}; // { 'YYYY-MM-DD': { 'Bench Press': 100, 'Push Ups': 20 } }

        // Helper to process an exercise
        const processExercise = (ex, dateKey) => {
            let val = 0;
            if (ex.target === 'Cardio') {
                const seconds = ex.accumulatedSeconds || 0;
                val = Number((seconds / 60).toFixed(2));
            } else {
                val = Math.max(...ex.sets.map(s => Number(s.weight) || 0));
            }

            // If multiple same exercises in one day, take max
            if (!dateValuesMap[dateKey]) dateValuesMap[dateKey] = {};

            const currentVal = dateValuesMap[dateKey][ex.name] || 0;
            dateValuesMap[dateKey][ex.name] = Math.max(currentVal, val);
        };

        // Filter Relevant Workouts
        const relevantWorkouts = history.filter(w => {
            if (targetGroup) {
                return w.exercises.some(ex => ex.target === targetGroup);
            } else {
                return w.exercises.some(ex => ex.name === exerciseName);
            }
        });

        if (relevantWorkouts.length === 0) return null;

        relevantWorkouts.forEach(w => {
            const d = new Date(w.startTime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            allDates.add(key);

            w.exercises.forEach(ex => {
                if (targetGroup) {
                    if (ex.target === targetGroup) {
                        processExercise(ex, key);
                    }
                } else {
                    if (ex.name === exerciseName) {
                        processExercise(ex, key);
                    }
                }
            });
        });

        const sortedKeys = Array.from(allDates).sort();
        const labels = sortedKeys.map(k => {
            const [y, m, d] = k.split('-');
            return `${d}/${m}`;
        });

        // Generate Datasets
        if (targetGroup) {
            // Find all unique exercise names in this group
            const uniqueNames = new Set();
            Object.values(dateValuesMap).forEach(dayMap => {
                Object.keys(dayMap).forEach(name => uniqueNames.add(name));
            });

            Array.from(uniqueNames).forEach((name, index) => {
                const dataPoints = sortedKeys.map(k => dateValuesMap[k]?.[name] || null); // Use null for gaps

                // Color Generation
                const hue = (index * 137.508) % 360; // Golden angle approximation for distinct colors
                const color = `hsl(${hue}, 70%, 50%)`;

                datasets.push({
                    label: name,
                    data: dataPoints,
                    borderColor: color,
                    backgroundColor: color,
                    tension: 0.3,
                    pointRadius: 4,
                    spanGaps: true
                });
            });

        } else {
            // Single Exercise
            const dataPoints = sortedKeys.map(k => dateValuesMap[k]?.[exerciseName] || 0);
            const isCardio = currentTarget === 'Cardio';

            datasets.push({
                label: isCardio ? 'Duration (Minutes)' : 'Max Weight (kg)',
                data: dataPoints,
                borderColor: isCardio ? TARGET_COLORS.Cardio : TARGET_COLORS.Chest, // Default to Red (Chest) for strength
                backgroundColor: isCardio ? `${TARGET_COLORS.Cardio}80` : `${TARGET_COLORS.Chest}80`, // Add opacity
                tension: 0.3,
                pointRadius: 4,
            });
        }

        return {
            labels,
            datasets: datasets
        };
    }, [history, exerciseName, targetGroup, currentTarget]);

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#a3a3a3', boxWidth: 12 } },
            title: {
                display: true,
                text: targetGroup ? `${targetGroup} Progression` : 'Strength Progression',
                color: '#fff'
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
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
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
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

    if (!exerciseName && !targetGroup) return <div style={{ padding: '1rem' }}>No data selected</div>;

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <button
                className="btn"
                style={{ marginBottom: '1rem', padding: '0.5rem' }}
                onClick={() => navigate('/history')}
            >
                <ArrowLeft size={16} /> Back
            </button>

            {!targetGroup && (
                isEditing ? (
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
                )
            )}

            {targetGroup && (
                <h1 style={{ marginBottom: 'var(--space-lg)' }}>
                    {targetGroup} <span style={{ fontSize: '0.5em', color: 'var(--text-muted)' }}>Group Analysis</span>
                </h1>
            )}

            <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No data recorded for this selection yet.</p>
                )}
            </div>
        </div>
    );
}
