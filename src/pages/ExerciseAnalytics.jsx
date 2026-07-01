import React, { useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import { MUSCLE_GROUPS, EXERCISE_DATABASE } from '../store/models';
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

    // Date window state (null windowSize = show all)
    const [windowSize, setWindowSize] = React.useState(null);
    const [windowOffset, setWindowOffset] = React.useState(0);
    const touchRef = useRef({});

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

    const currentBodyweight = React.useMemo(() => {
        if (!history || !exerciseName) return false;
        // Check DB first for defaults
        const dbEx = EXERCISE_DATABASE.find(e => e.name === exerciseName);
        if (dbEx && dbEx.bodyweight !== undefined) return dbEx.bodyweight;
        // Then check history
        for (const w of history) {
            const ex = w.exercises.find(e => e.name === exerciseName);
            if (ex && ex.bodyweight !== undefined) return ex.bodyweight;
        }
        return false;
    }, [history, exerciseName]);

    const [editTarget, setEditTarget] = React.useState(currentTarget);
    const [editBodyweight, setEditBodyweight] = React.useState(currentBodyweight);

    // Update editTarget when currentTarget is found (initial load)
    React.useEffect(() => {
        setEditTarget(currentTarget);
        setEditBodyweight(currentBodyweight);
    }, [currentTarget, currentBodyweight]);

    // --- Step 1: Collect ALL raw dates + values (no windowing yet) ---
    const allRawData = useMemo(() => {
        if (!history) return null;
        if (!exerciseName && !targetGroup) return null;

        const allDates = new Set();
        const dateValuesMap = {};
        const dateSetsMap = {};

        const processExercise = (ex, dateKey) => {
            let val = 0;
            const completedSets = [];
            if (ex.target === 'Cardio') {
                val = Number(((ex.accumulatedSeconds || 0) / 60).toFixed(2));
            } else {
                val = ex.sets.reduce((acc, s) => {
                    if (!s.completed) return acc;
                    completedSets.push(s);
                    const setVol = (Number(s.weight) || 0) * (Number(s.reps) || 0);
                    return acc + (s.unilateral ? setVol * 2 : setVol);
                }, 0);
            }
            if (!dateValuesMap[dateKey]) dateValuesMap[dateKey] = {};
            dateValuesMap[dateKey][ex.name] = (dateValuesMap[dateKey][ex.name] || 0) + val;

            if (!dateSetsMap[dateKey]) dateSetsMap[dateKey] = {};
            dateSetsMap[dateKey][ex.name] = completedSets;
        };

        const relevantWorkouts = history.filter(w =>
            targetGroup
                ? w.exercises.some(ex => ex.target === targetGroup)
                : w.exercises.some(ex => ex.name === exerciseName)
        );

        if (relevantWorkouts.length === 0) return null;

        relevantWorkouts.forEach(w => {
            const d = new Date(w.startTime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            allDates.add(key);
            w.exercises.forEach(ex => {
                if (targetGroup ? ex.target === targetGroup : ex.name === exerciseName)
                    processExercise(ex, key);
            });
        });

        return { sortedKeys: Array.from(allDates).sort(), dateValuesMap, dateSetsMap };
    }, [history, exerciseName, targetGroup]);

    // Total dates available (for pinch scaling)
    const totalDates = allRawData?.sortedKeys?.length ?? 0;

    // --- Step 2: Slice raw keys based on window offset/size ---
    const visibleKeys = useMemo(() => {
        if (!allRawData) return [];
        const { sortedKeys } = allRawData;
        const effectiveSize = windowSize ?? sortedKeys.length;
        const clampedOffset = Math.max(0, Math.min(windowOffset, sortedKeys.length - effectiveSize));
        return sortedKeys.slice(clampedOffset, clampedOffset + effectiveSize);
    }, [allRawData, windowSize, windowOffset]);

    // --- Step 3: Build chart object ---
    const chartData = useMemo(() => {
        if (!allRawData) return null;
        const { dateValuesMap } = allRawData;

        const labels = visibleKeys.map(k => { const [, m, d] = k.split('-'); return `${d}/${m}`; });
        let datasets = [];

        if (targetGroup) {
            const uniqueNames = new Set();
            Object.values(dateValuesMap).forEach(dayMap => Object.keys(dayMap).forEach(n => uniqueNames.add(n)));

            Array.from(uniqueNames).forEach((name, index) => {
                const color = `hsl(${(index * 137.508) % 360}, 70%, 50%)`;
                datasets.push({
                    label: name,
                    data: visibleKeys.map(k => dateValuesMap[k]?.[name] || null),
                    borderColor: color, backgroundColor: color,
                    tension: 0.3, pointRadius: 4, spanGaps: true
                });
            });
        } else {
            const isCardio = currentTarget === 'Cardio';
            datasets.push({
                label: isCardio ? t('duration_mins') : t('total_volume', { defaultValue: 'Total Volume' }),
                data: visibleKeys.map(k => dateValuesMap[k]?.[exerciseName] || 0),
                borderColor: isCardio ? TARGET_COLORS.Cardio : TARGET_COLORS.Chest,
                backgroundColor: isCardio ? `${TARGET_COLORS.Cardio}80` : `${TARGET_COLORS.Chest}80`,
                tension: 0.3, pointRadius: 4,
            });
        }

        return { labels, datasets };
    }, [allRawData, visibleKeys, targetGroup, exerciseName, currentTarget, t]);

    // --- Gesture handlers for the chart ---
    const handleChartTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchRef.current = {
                mode: 'pinch',
                initialDist: Math.sqrt(dx * dx + dy * dy),
                initialWindowSize: windowSize ?? totalDates,
                initialOffset: windowOffset,
            };
        } else if (e.touches.length === 1 && windowSize !== null) {
            touchRef.current = {
                mode: 'pan',
                startX: e.touches[0].clientX,
                initialOffset: windowOffset,
            };
        }
    };

    const handleChartTouchMove = (e) => {
        const t = touchRef.current;
        if (t.mode === 'pinch' && e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // pinch in (dist shrinks) → scale > 1 → fewer dates
            const scale = t.initialDist / dist;
            const newSize = Math.max(2, Math.min(totalDates, Math.round(t.initialWindowSize * scale)));
            const isFullView = newSize >= totalDates;
            setWindowSize(isFullView ? null : newSize);
            if (!isFullView) {
                setWindowOffset(prev => Math.max(0, Math.min(totalDates - newSize, prev)));
            } else {
                setWindowOffset(0);
            }
        } else if (t.mode === 'pan' && e.touches.length === 1 && windowSize !== null) {
            const deltaX = e.touches[0].clientX - t.startX;
            // negative deltaX (drag left) = move window forward in time
            const datesPerPx = windowSize / 250;
            const dateDelta = -Math.round(deltaX * datesPerPx);
            const newOffset = Math.max(0, Math.min(totalDates - windowSize, t.initialOffset + dateDelta));
            setWindowOffset(newOffset);
        }
    };

    const handleChartTouchEnd = () => { touchRef.current = {}; };


    // Compute PRs for single-exercise view
    const prs = useMemo(() => {
        if (!exerciseName || !history) return null;
        let maxWeight = 0;
        let maxWeightReps = 0;
        let maxSetVolume = 0;
        let bestSetWeight = 0;  // weight of the best set
        let bestSetReps = 0;    // reps of the best set
        let best1RMWeight = 0;  // weight used for 1RM estimate
        let best1RMReps = 0;    // reps used for 1RM estimate
        let maxWorkoutVolume = 0;

        history.forEach(w => {
            let sessionVolume = 0;
            w.exercises.forEach(ex => {
                if (ex.name !== exerciseName) return;
                ex.sets.forEach(s => {
                    if (!s.completed) return;
                    const w = Number(s.weight) || 0;
                    const r = Number(s.reps) || 0;
                    if (w > maxWeight) {
                        maxWeight = w;
                        maxWeightReps = r;
                    } else if (w === maxWeight && r > maxWeightReps) {
                        maxWeightReps = r;
                    }
                    const setVol = w * r;
                    if (setVol > maxSetVolume) {
                        maxSetVolume = setVol;
                        bestSetWeight = w;
                        bestSetReps = r;
                    }
                    // Best Epley 1RM: weight * (1 + reps/30) — only valid for r >= 1
                    if (r >= 1) {
                        const est = w * (1 + r / 30);
                        const currentBest = best1RMWeight * (1 + best1RMReps / 30);
                        if (est > currentBest) { best1RMWeight = w; best1RMReps = r; }
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
        const display1RMWeight = preferredUnit === 'KG'
            ? best1RMWeight
            : Math.round(best1RMWeight * 2.20462);
        const est1RM = best1RMWeight > 0
            ? Math.round(display1RMWeight * (1 + best1RMReps / 30))
            : null;

        return {
            maxWeight: displayWeight,
            maxWeightReps,
            bestSet: `${bestSetReps} × ${displayBestSetWeight} ${preferredUnit}`,
            maxWorkoutVolume: Math.round(maxWorkoutVolume),
            est1RM,
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
                callbacks: {
                    label: function(context) {
                        const dateKey = visibleKeys[context.dataIndex];
                        if (!dateKey || !allRawData) return '';

                        const exerciseNameForPoint = targetGroup ? context.dataset.label : exerciseName;
                        const sets = allRawData.dateSetsMap[dateKey]?.[exerciseNameForPoint] || [];

                        if (sets.length === 0) {
                            const val = context.parsed.y;
                            if (val === null || val === undefined) return '';
                            const isCardio = targetGroup ? false : currentTarget === 'Cardio';
                            if (isCardio) return `${context.dataset.label}: ${val} min`;
                            return `${context.dataset.label}: ${val} ${preferredUnit}`;
                        }

                        // Group identical sets
                        const groups = [];
                        sets.forEach(s => {
                            const displayW = preferredUnit === 'KG' ? s.weight : Math.round(s.weight * 2.20462);
                            const setStr = `${displayW}${preferredUnit.toLowerCase()} x ${s.reps}`;
                            if (groups.length > 0 && groups[groups.length - 1].setStr === setStr) {
                                groups[groups.length - 1].count++;
                            } else {
                                groups.push({ setStr, count: 1 });
                            }
                        });
                        const formatted = groups.map(g => g.count > 1 ? `${g.count} sets of ${g.setStr}` : g.setStr).join(', ');

                        return `${context.dataset.label}: ${formatted}`;
                    }
                }
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
        const changedBodyweight = editBodyweight !== currentBodyweight;

        if (changedName || changedTarget || changedBodyweight) {
            if (confirm(t('confirm_update', { name: exerciseName, newName: editName, newTarget: editTarget || 'Unchanged' }))) {
                renameExercise(exerciseName, editName, editTarget, editBodyweight);
                // Update URL without reload to reflect new name if changed
                if (changedName) {
                    navigate(`/analytics?exercise=${encodeURIComponent(editName)}`, { replace: true });
                }
            }
        }
        setIsEditing(false);
    };

    if (!exerciseName && !targetGroup) return <div style={{ padding: '1rem' }}>{t('no_data_selected')}</div>;

    const backRoute = searchParams.get('back') || '/history';

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            <button
                className="btn"
                style={{ marginBottom: '1rem', padding: '0.5rem' }}
                onClick={() => navigate(backRoute)}
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

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="bodyweightToggle"
                                    checked={editBodyweight}
                                    onChange={e => setEditBodyweight(e.target.checked)}
                                    style={{ accentColor: 'var(--primary)', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                />
                                <label htmlFor="bodyweightToggle" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                    {t('bodyweight_exercise', { defaultValue: 'Bodyweight Exercise' })}
                                </label>
                            </div>

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                        { 
                            label: t('pr_max_weight', { defaultValue: 'Max Weight' }), 
                            value: `${prs.maxWeight} ${prs.unit}`,
                            subValue: prs.maxWeightReps ? `for ${prs.maxWeightReps} rep${prs.maxWeightReps > 1 ? 's' : ''}` : null
                        },
                        { label: t('pr_max_set_volume', { defaultValue: 'Best Set' }), value: prs.bestSet },
                        { label: t('pr_max_workout_volume', { defaultValue: 'Best Session' }), value: `${prs.maxWorkoutVolume} KG` },
                        ...(prs.est1RM != null ? [{ label: t('est_1rm', { defaultValue: 'Est. 1RM' }), value: `~${prs.est1RM} ${prs.unit}`, muted: true }] : []),
                    ].map(({ label, value, subValue, muted }) => (
                        <div key={label} className="card" style={{ padding: '0.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: muted ? 'var(--text-muted)' : '#f59e0b' }}>{value}</div>
                            {subValue && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{subValue}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div
                className="card"
                style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'pan-y' }}
                onTouchStart={handleChartTouchStart}
                onTouchMove={handleChartTouchMove}
                onTouchEnd={handleChartTouchEnd}
            >
                {chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>{t('no_data_recorded')}</p>
                )}
            </div>
            {chartData && (
                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {windowSize ? `${windowSize} of ${totalDates} sessions · drag to pan` : 'Pinch to zoom · drag to pan'}
                </p>
            )}
        </div>
    );
}
