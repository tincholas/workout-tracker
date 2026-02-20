import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import { MUSCLE_GROUPS } from '../store/models';
import '../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { ArrowLeft } from 'lucide-react';
import { TARGET_COLORS } from '../store/models';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from 'react-i18next';

export default function ExerciseAnalytics() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const exerciseName = searchParams.get('exercise');
    const targetGroup = searchParams.get('target');
    const { history, renameExercise, preferredUnit } = useWorkout();
    const { textMuted, textPrimary, borderSubtle } = useThemeColors();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(exerciseName || '');
    const { t } = useTranslation();

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
                // Calculate total volume (weight * reps for all completed sets)
                val = ex.sets.reduce((acc, s) => {
                    if (s.completed) {
                        return acc + ((Number(s.weight) || 0) * (Number(s.reps) || 0));
                    }
                    return acc;
                }, 0);
            }

            // If multiple same exercises in one day, sum the volume
            if (!dateValuesMap[dateKey]) dateValuesMap[dateKey] = {};

            const currentVal = dateValuesMap[dateKey][ex.name] || 0;
            dateValuesMap[dateKey][ex.name] = currentVal + val;
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
                label: isCardio ? t('duration_mins') : t('total_volume', { defaultValue: 'Total Volume' }),
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
    }, [history, exerciseName, targetGroup, currentTarget, t]);

    // Compute PRs for single-exercise view
    const prs = useMemo(() => {
        if (!exerciseName || !history) return null;
        let maxWeight = 0;
        let maxSetVolume = 0;
        let bestSetWeight = 0;  // weight of the best set
        let bestSetReps = 0;    // reps of the best set
        let maxWorkoutVolume = 0;

        history.forEach(w => {
            let sessionVolume = 0;
            w.exercises.forEach(ex => {
                if (ex.name !== exerciseName) return;
                ex.sets.forEach(s => {
                    if (!s.completed) return;
                    const w = Number(s.weight) || 0;
                    const r = Number(s.reps) || 0;
                    if (w > maxWeight) maxWeight = w;
                    const setVol = w * r;
                    if (setVol > maxSetVolume) {
                        maxSetVolume = setVol;
                        bestSetWeight = w;
                        bestSetReps = r;
                    }
                    sessionVolume += setVol;
                });
            });
            if (sessionVolume > maxWorkoutVolume) maxWorkoutVolume = sessionVolume;
        });

        if (maxWeight === 0) return null;

        const displayWeight = preferredUnit === 'KG'
            ? maxWeight
            : Math.round(maxWeight * 2.20462);
        const displayBestSetWeight = preferredUnit === 'KG'
            ? bestSetWeight
            : Math.round(bestSetWeight * 2.20462);

        return {
            maxWeight: displayWeight,
            bestSet: `${bestSetReps} × ${displayBestSetWeight} ${preferredUnit}`,
            maxWorkoutVolume: Math.round(maxWorkoutVolume),
            unit: preferredUnit
        };
    }, [history, exerciseName, preferredUnit]);

    // Calculate Min/Max for Y-Axis scaling
    const yBinding = useMemo(() => {
        if (!chartData?.datasets?.length) return {};

        const allValues = chartData.datasets
            .flatMap(d => d.data)
            .filter(v => typeof v === 'number' && !isNaN(v));

        if (allValues.length === 0) return {};

        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);

        return {
            min: Math.max(0, minVal * 0.8), // Start 20% lower (clamped to 0)
            max: maxVal * 1.2               // End 20% higher
        };
    }, [chartData]);

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: textMuted, boxWidth: 12 } },
            title: {
                display: true,
                text: targetGroup ? `${targetGroup} ${t('progression')}` : t('strength_progression'),
                color: textPrimary
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                grid: { color: borderSubtle },
                border: { display: false },
                ticks: { color: textMuted },
                // Apply dynamic scaling if data is present
                ...(yBinding.min !== undefined && { min: yBinding.min }),
                ...(yBinding.max !== undefined && { max: yBinding.max }),
                beginAtZero: false // Disable forced zero start to respect min
            },
            x: {
                grid: { color: borderSubtle },
                border: { display: false },
                ticks: { color: textMuted }
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
            if (confirm(t('confirm_update', { name: exerciseName, newName: editName, newTarget: editTarget || 'Unchanged' }))) {
                renameExercise(exerciseName, editName, editTarget);
                // Update URL without reload to reflect new name if changed
                if (changedName) {
                    navigate(`/analytics?exercise=${encodeURIComponent(editName)}`, { replace: true });
                }
            }
        }
        setIsEditing(false);
    };

    if (!exerciseName && !targetGroup) return <div style={{ padding: '1rem' }}>{t('no_data_selected')}</div>;

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <button
                className="btn"
                style={{ marginBottom: '1rem', padding: '0.5rem' }}
                onClick={() => navigate('/history')}
            >
                <ArrowLeft size={16} /> {t('back')}
            </button>

            {!targetGroup && (
                <div>
                    {isEditing ? (
                        <form onSubmit={handleRename} style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('exercises.name')}</label>
                            <input
                                className="input"
                                autoFocus
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                            />

                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('muscle_group')}</label>
                            <select
                                className="input"
                                style={{ padding: '0.8rem', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                                value={editTarget}
                                onChange={e => setEditTarget(e.target.value)}
                            >
                                <option value="" style={{ backgroundColor: 'var(--bg-card)' }}>{t('select_optional')}</option>
                                {MUSCLE_GROUPS.map(g => (
                                    <option key={g} value={g} style={{ backgroundColor: 'var(--bg-card)' }}>{g}</option>
                                ))}
                            </select>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary">{t('save')}</button>
                                <button type="button" className="btn" onClick={() => setIsEditing(false)}>{t('cancel')}</button>
                            </div>
                        </form>
                    ) : (
                        <h1
                            style={{ marginBottom: 'var(--space-lg)', cursor: 'text', borderBottom: '1px dashed #333', display: 'inline-block' }}
                            onClick={() => { setEditName(exerciseName); setIsEditing(true); }}
                        >
                            {t(`exercises.${exerciseName}`, { defaultValue: exerciseName })} <span style={{ fontSize: '0.4em', color: 'var(--text-muted)', verticalAlign: 'middle' }}>({t('edit')})</span>
                        </h1>
                    )}
                </div>
            )}

            {targetGroup && (
                <h1 style={{ marginBottom: 'var(--space-lg)' }}>
                    {targetGroup} <span style={{ fontSize: '0.5em', color: 'var(--text-muted)' }}>{t('group_analysis')}</span>
                </h1>
            )}

            {/* PR Stats — single exercise only */}
            {prs && !targetGroup && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                        { label: t('pr_max_weight', { defaultValue: 'Max Weight' }), value: `${prs.maxWeight} ${prs.unit}` },
                        { label: t('pr_max_set_volume', { defaultValue: 'Best Set' }), value: prs.bestSet },
                        { label: t('pr_max_workout_volume', { defaultValue: 'Best Session' }), value: `${prs.maxWorkoutVolume} KG` },
                    ].map(({ label, value }) => (
                        <div key={label} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f59e0b' }}>{value}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>{t('no_data_recorded')}</p>
                )}
            </div>
        </div>
    );
}
