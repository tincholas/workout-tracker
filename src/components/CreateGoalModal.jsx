import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';
import { useTranslation } from 'react-i18next';
import { EXERCISE_DATABASE } from '../store/models';

const KG_TO_LBS = 2.20462;

function toKg(val, unit) {
    if (unit === 'LBS') return Math.round((val / KG_TO_LBS) * 1000) / 1000;
    return Math.round(val * 1000) / 1000;
}

export default function CreateGoalModal({ onClose }) {
    const { addGoal, history, weightMoodLog, preferredUnit, getGoalCurrentValue } = useWorkout();
    const { t } = useTranslation();

    const [goalType, setGoalType] = useState('bodyweight');
    const [targetMetric, setTargetMetric] = useState('weight'); // 'weight' or 'reps'
    const [exerciseName, setExerciseName] = useState('');
    const [targetDisplay, setTargetDisplay] = useState('');

    const unit = preferredUnit === 'LBS' ? 'lbs' : 'kg';

    // Build merged exercise list: database + anything in history not already there
    const allExercises = useMemo(() => {
        const seen = new Set(EXERCISE_DATABASE.map(e => e.name));
        const fromHistory = [];
        for (const w of history) {
            for (const ex of (w.exercises || [])) {
                if (!seen.has(ex.name)) {
                    seen.add(ex.name);
                    fromHistory.push({ name: ex.name, target: ex.target || 'Other' });
                }
            }
        }
        return [...EXERCISE_DATABASE, ...fromHistory];
    }, [history]);

    // Group by target muscle for optgroups
    const exerciseGroups = useMemo(() => {
        const groups = {};
        for (const ex of allExercises) {
            if (!groups[ex.target]) groups[ex.target] = [];
            groups[ex.target].push(ex.name);
        }
        return groups;
    }, [allExercises]);

    const selectedExercise = allExercises.find(e => e.name === exerciseName);
    const isCardio = selectedExercise?.target === 'Cardio';

    // Auto-fill initial value from current best
    const initialValue = useMemo(() => {
        if (goalType === 'bodyweight') {
            const latest = [...(weightMoodLog || [])].sort((a, b) => b.date.localeCompare(a.date))[0];
            return latest?.weight ?? 0;
        }
        if (!exerciseName) return 0;
        const pseudoGoal = { type: 'exercise', exerciseName, isCardio, targetMetric, initialValue: 0 };
        return getGoalCurrentValue(pseudoGoal);
    }, [goalType, exerciseName, isCardio, targetMetric, weightMoodLog, getGoalCurrentValue]);

    const displayInitial = useMemo(() => {
        if (goalType === 'bodyweight' || !isCardio) {
            if (goalType === 'exercise' && targetMetric === 'reps') {
                return `${initialValue} ${t('reps', { defaultValue: 'reps' })}`;
            }
            const val = preferredUnit === 'LBS'
                ? Math.round(initialValue * KG_TO_LBS * 10) / 10
                : Math.round(initialValue * 10) / 10;
            return `${val} ${unit}`;
        }
        return `${(initialValue / 60).toFixed(1)} min`;
    }, [initialValue, goalType, isCardio, targetMetric, preferredUnit, unit, t]);

    const handleCreate = () => {
        const targetNum = parseFloat(targetDisplay);
        if (isNaN(targetNum) || targetNum <= 0) return;

        let storedTarget;
        let storedInitial;

        if (goalType === 'bodyweight') {
            storedTarget = toKg(targetNum, preferredUnit);
            storedInitial = initialValue;
        } else if (isCardio) {
            storedTarget = targetNum * 60; // minutes → seconds
            storedInitial = initialValue;
        } else if (targetMetric === 'reps') {
            storedTarget = targetNum; // raw reps
            storedInitial = initialValue;
        } else {
            storedTarget = toKg(targetNum, preferredUnit);
            storedInitial = initialValue;
        }

        addGoal({
            type: goalType,
            exerciseName: goalType === 'exercise' ? exerciseName : null,
            isCardio: goalType === 'exercise' ? isCardio : false,
            targetMetric: goalType === 'exercise' && !isCardio ? targetMetric : null,
            initialValue: storedInitial,
            targetValue: storedTarget,
        });

        onClose();
    };

    const canCreate = goalType === 'bodyweight'
        ? parseFloat(targetDisplay) > 0
        : exerciseName && parseFloat(targetDisplay) > 0;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--bg-app)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
                width: '100%', maxWidth: '600px',
                borderRadius: '20px 20px 0 0',
                padding: '1.5rem',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxSizing: 'border-box'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{t('add_goal')}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 0 }}>
                        <X size={22} />
                    </button>
                </div>

                {/* Goal type selector */}
                <label style={labelStyle}>{t('goal_type')}</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {[['bodyweight', t('body_weight')], ['exercise', t('exercise')]].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => { setGoalType(val); setExerciseName(''); setTargetDisplay(''); }}
                            className={`btn ${goalType === val ? 'btn-primary' : ''}`}
                            style={{ flex: 1, justifyContent: 'center', padding: '0.6rem' }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Exercise selector (exercise goals only) */}
                {goalType === 'exercise' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>{t('exercise')}</label>
                        <select
                            className="input"
                            value={exerciseName}
                            onChange={e => { setExerciseName(e.target.value); setTargetDisplay(''); }}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="">{t('select_exercise', { defaultValue: 'Select an exercise…' })}</option>
                            {Object.entries(exerciseGroups).map(([group, names]) => (
                                <optgroup key={group} label={group}>
                                    {names.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}

                {/* Metric selector for strength exercises */}
                {goalType === 'exercise' && exerciseName && !isCardio && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>{t('target_metric', { defaultValue: 'Target Metric' })}</label>
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '10px',
                            padding: '4px'
                        }}>
                            {[['weight', t('weight', { defaultValue: 'Weight' })], ['reps', t('reps', { defaultValue: 'Reps' })]].map(([val, label]) => (
                                <button
                                    key={val}
                                    onClick={() => { setTargetMetric(val); setTargetDisplay(''); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        background: targetMetric === val ? 'var(--color-primary)' : 'transparent',
                                        color: targetMetric === val ? '#fff' : 'var(--text-muted)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current / initial value info */}
                {(goalType === 'bodyweight' || exerciseName) && (
                    <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--bg-app)', borderRadius: '8px', padding: '0.6rem 0.9rem' }}>
                        {t('initial_value')}: <strong style={{ color: 'var(--text-primary)' }}>{displayInitial}</strong>
                    </div>
                )}

                {/* Target input */}
                {(goalType === 'bodyweight' || exerciseName) && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>
                            {t('target_value')} (
                            {goalType === 'exercise' && isCardio ? 'min' :
                                (goalType === 'exercise' && targetMetric === 'reps' ? t('reps', { defaultValue: 'reps' }) : unit)}
                            )
                        </label>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            step={(goalType === 'exercise' && (isCardio || targetMetric === 'reps')) ? '1' : '0.1'}
                            placeholder={
                                goalType === 'exercise' && isCardio ? 'e.g. 20' :
                                    (goalType === 'exercise' && targetMetric === 'reps' ? 'e.g. 15' : `e.g. ${preferredUnit === 'LBS' ? '132' : '60'}`)
                            }
                            value={targetDisplay}
                            onChange={e => setTargetDisplay(e.target.value)}
                        />
                    </div>
                )}

                {/* Create button */}
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', justifyContent: 'center', opacity: canCreate ? 1 : 0.4 }}
                    disabled={!canCreate}
                    onClick={handleCreate}
                >
                    {t('add_goal')}
                </button>
            </div>
        </div>
    );
}

const labelStyle = {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '0.5rem'
};
