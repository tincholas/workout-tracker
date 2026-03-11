import React, { useMemo, useState } from 'react';
import { EXERCISE_TYPES, WORKOUT_TEMPLATES } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ExerciseHistory({ embedded = false }) {
    const { history } = useWorkoutContext();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [search, setSearch] = useState('');

    // Get unique exercises grouped by Target
    const exercisesByTarget = useMemo(() => {
        const map = {};

        // Helper to add
        const add = (name, target) => {
            if (!map[target]) map[target] = new Set();
            map[target].add(name);
        };

        // Only show exercises that have history
        if (history) {
            history.forEach(workout => {
                if (workout.exercises) {
                    workout.exercises.forEach(ex => {
                        // Only add if there is at least one completed set or some weight recorded
                        // Actually, user said "had some activity tracked", so appearance in history is sufficient.
                        add(ex.name, ex.target || 'Custom');
                    });
                }
            });
        }

        return map;
    }, [history]);

    const query = search.trim().toLowerCase();

    // Filtered view: only keep exercises matching the search query
    const filteredByTarget = useMemo(() => {
        if (!query) return exercisesByTarget;
        const result = {};
        for (const [target, names] of Object.entries(exercisesByTarget)) {
            const matched = Array.from(names).filter(n =>
                t(`exercises.${n}`, { defaultValue: n }).toLowerCase().includes(query)
            );
            if (matched.length > 0) result[target] = new Set(matched);
        }
        return result;
    }, [exercisesByTarget, query, t]);

    const targets = Object.keys(filteredByTarget).sort();

    const content = (
        <div style={{
            padding: 'var(--space-md)',
            paddingBottom: '8rem',
            boxSizing: 'border-box',
            ...(embedded ? {} : { backgroundColor: 'var(--bg-app)', minHeight: '100vh' })
        }}>
            {!embedded && <h1 style={{ marginBottom: 'var(--space-md)' }}>{t('exercise_history')}</h1>}

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <Search
                    size={16}
                    style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                    }}
                />
                <input
                    className="input"
                    type="text"
                    placeholder={t('search_exercises', { defaultValue: 'Search exercises…' })}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: '2.25rem', width: '100%', boxSizing: 'border-box' }}
                />
            </div>

            {/* Body Weight shortcut */}
            <div
                className="card"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderLeft: '3px solid #a855f7',
                }}
                onClick={() => navigate('/body-weight')}
            >
                <span style={{ fontWeight: 600 }}>{t('body_weight', { defaultValue: 'Body Weight' })}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {targets.map(target => (
                    <div key={target}>
                        <h3
                            style={{
                                marginLeft: '0.5rem',
                                marginBottom: '0.5rem',
                                color: 'var(--color-primary)',
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                display: 'inline-block'
                            }}
                            onClick={() => navigate(`/analytics?target=${encodeURIComponent(target)}`)}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                            {t(`muscle_groups.${target}`, { defaultValue: target })}
                        </h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {Array.from(filteredByTarget[target]).sort().map(name => (
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
                                    <span>{t(`exercises.${name}`, { defaultValue: name })}</span>
                                    <ChevronRight size={16} color="var(--text-muted)" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return content;
}
