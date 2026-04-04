import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus, Trash2, Target, CheckCircle2, ChevronDown } from 'lucide-react';
import CreateGoalModal from '../components/CreateGoalModal';
import { fmtSeconds } from '../utils/formatTime';

const KG_TO_LBS = 2.20462;

function formatValue(val, goal, preferredUnit, t) {
    if (!goal) return String(val);
    if (goal.type === 'exercise' && goal.targetMetric === 'reps') {
        return `${val} ${t('reps', { defaultValue: 'reps' })}`;
    }
    if (goal.type === 'bodyweight' || (goal.type === 'exercise' && !goal.isCardio)) {
        const display = preferredUnit === 'LBS'
            ? Math.round(val * KG_TO_LBS * 10) / 10
            : Math.round(val * 10) / 10;
        return `${display} ${preferredUnit === 'LBS' ? 'lbs' : 'kg'}`;
    }
    return fmtSeconds(val);
}

function daysSince(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.floor((now - start) / 86400000));
}

function GoalCard({ goal, onDelete, preferredUnit, currentValue }) {
    const { t } = useTranslation();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const pct = useMemo(() => {
        const range = goal.targetValue - goal.initialValue;
        if (range === 0) return 100;
        const progress = (currentValue - goal.initialValue) / range;
        return Math.min(100, Math.max(0, Math.round(progress * 100)));
    }, [goal, currentValue]);

    const days = daysSince(goal.createdAt);
    const isCompleted = goal.status === 'completed';
    const goalName = goal.type === 'bodyweight' ? t('body_weight') : goal.exerciseName;

    const progressColor = pct >= 100 ? '#22c55e' : pct >= 50 ? 'var(--color-primary)' : '#eab308';

    return (
        <div className="card" style={{ padding: '1rem 1.1rem', position: 'relative' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.6rem', gap: '0.5rem' }}>
                <Target size={16} color={isCompleted ? '#22c55e' : 'var(--color-primary)'} />
                <span style={{ fontWeight: '700', flex: 1, fontSize: '0.95rem' }}>{goalName}</span>

                {!isCompleted && (
                    confirmDelete ? (
                        <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{t('confirm_delete_goal')}</span>
                            <button onClick={() => onDelete(goal.id)} style={dangerBtnSmall}>{t('yes', { defaultValue: 'Yes' })}</button>
                            <button onClick={() => setConfirmDelete(false)} style={mutedBtnSmall}>{t('no', { defaultValue: 'No' })}</button>
                        </span>
                    ) : (
                        <button onClick={() => setConfirmDelete(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', lineHeight: 0 }}>
                            <Trash2 size={15} />
                        </button>
                    )
                )}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                <span>🎯 {formatValue(goal.targetValue, goal, preferredUnit, t)}</span>
                <span>📍 {formatValue(currentValue, goal, preferredUnit, t)}</span>
                {goal.type === 'bodyweight' && (() => {
                    const delta = currentValue - goal.initialValue;
                    const isLoss = delta < 0;
                    const absDelta = preferredUnit === 'LBS'
                        ? Math.round(Math.abs(delta) * KG_TO_LBS * 10) / 10
                        : Math.round(Math.abs(delta) * 10) / 10;
                    const unit = preferredUnit === 'LBS' ? 'lbs' : 'kg';
                    const color = absDelta === 0 ? 'var(--text-muted)' : (isLoss ? '#22c55e' : '#eab308');
                    return (
                        <span style={{ color }}>
                            {isLoss ? '↓' : delta > 0 ? '↑' : '—'} {absDelta} {unit}
                        </span>
                    );
                })()}
                <span>⏱ {days} {t('days_active')}</span>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: '3px',
                        background: progressColor,
                        transition: 'width 0.5s ease'
                    }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: progressColor, minWidth: '36px', textAlign: 'right' }}>
                    {pct}%
                </span>
            </div>
        </div>
    );
}

export default function GoalsScreen() {
    const { goals, deleteGoal, getGoalCurrentValue, preferredUnit } = useWorkout();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
        <div style={{ padding: 'var(--space-lg)', paddingBottom: '120px', minHeight: '100vh', backgroundColor: 'var(--bg-app)', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 0, lineHeight: 0 }}
                >
                    <ChevronLeft size={26} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800' }}>{t('goals')}</h1>
            </div>

            {/* Active goals */}
            <section style={{ marginBottom: '1.5rem' }}>
                <h3 style={sectionLabel}>{t('active_goals')}</h3>

                {activeGoals.length === 0 ? (
                    <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {t('no_goals')}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeGoals.map(g => (
                            <GoalCard
                                key={g.id}
                                goal={g}
                                onDelete={deleteGoal}
                                preferredUnit={preferredUnit}
                                currentValue={getGoalCurrentValue(g)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Add goal button */}
            <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}
                onClick={() => setShowCreate(true)}
            >
                <Plus size={20} /> {t('add_goal')}
            </button>

            {/* Completed goals (collapsible) */}
            {completedGoals.length > 0 && (
                <section>
                    <button
                        onClick={() => setShowCompleted(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '0.75rem', padding: 0 }}
                    >
                        <CheckCircle2 size={15} />
                        <span style={sectionLabel}>{t('completed_goals')} ({completedGoals.length})</span>
                        <ChevronDown size={15} style={{ transform: showCompleted ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {showCompleted && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {completedGoals.map(g => (
                                <GoalCard
                                    key={g.id}
                                    goal={g}
                                    onDelete={deleteGoal}
                                    preferredUnit={preferredUnit}
                                    currentValue={g.targetValue}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} />}
        </div>
    );
}

const sectionLabel = {
    fontSize: '0.72rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--text-muted)',
    margin: '0 0 0.75rem 0.1rem',
    display: 'block'
};

const dangerBtnSmall = {
    padding: '0.2rem 0.5rem', fontSize: '0.78rem', background: 'transparent',
    border: '1px solid var(--color-danger)', color: 'var(--color-danger)',
    borderRadius: '6px', cursor: 'pointer'
};
const mutedBtnSmall = {
    padding: '0.2rem 0.5rem', fontSize: '0.78rem', background: 'transparent',
    border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
    borderRadius: '6px', cursor: 'pointer'
};
