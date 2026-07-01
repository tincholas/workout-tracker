import React, { useMemo, useState } from 'react';
import { EXERCISE_TYPES, WORKOUT_TEMPLATES, EXERCISE_DATABASE, MUSCLE_GROUPS } from '../store/models';
import { useWorkout } from '../store/WorkoutContext';
import { X, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function ExercisePickerModal({ onClose, onSelect }) {
    const { history } = useWorkout();
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useTranslation();

    const [newExerciseTarget, setNewExerciseTarget] = useState('');
    const [newExerciseBodyweight, setNewExerciseBodyweight] = useState(false);

    const groupedExercises = useMemo(() => {
        const groups = {};
        MUSCLE_GROUPS.forEach(g => groups[g] = new Set());
        groups['Other'] = new Set();

        const addToGroup = (name, target) => {
            if (!name) return;
            // Normalize target
            let key = 'Other';
            if (target && MUSCLE_GROUPS.includes(target)) {
                key = target;
            }
            groups[key].add(name);
        };

        // Templates
        Object.values(WORKOUT_TEMPLATES).flat().forEach(ex => {
            addToGroup(ex.name, ex.target);
        });

        // Full Database
        if (EXERCISE_DATABASE) {
            EXERCISE_DATABASE.forEach(ex => {
                addToGroup(ex.name, ex.target);
            });
        }

        // History
        if (history) {
            history.forEach(w => w.exercises.forEach(ex => {
                addToGroup(ex.name, ex.target);
            }));
        }

        // Convert Sets to Arrays of Objects
        const result = {};
        Object.keys(groups).forEach(key => {
            const sortedNames = Array.from(groups[key]).sort();
            result[key] = sortedNames.map(name => ({ name, target: key }));
        });
        return result;
    }, [history]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groupedExercises;
        const lowerTerm = searchTerm.toLowerCase();
        const result = {};

        Object.keys(groupedExercises).forEach(key => {
            // Translate the exercise name to check match against translated version or (optional) original
            // Usually search should search the localized name.
            const matches = groupedExercises[key].filter(ex => {
                const translatedName = t(`exercises.${ex.name}`, { defaultValue: ex.name });
                return translatedName.toLowerCase().includes(lowerTerm) || ex.name.toLowerCase().includes(lowerTerm);
            });

            if (matches.length > 0) {
                result[key] = matches;
            }
        });
        return result;
    }, [groupedExercises, searchTerm, t]);

    const exactMatchExists = useMemo(() => {
        const lowerSearch = searchTerm.trim().toLowerCase();
        return Object.values(groupedExercises).flat().some(ex =>
            ex.name.toLowerCase() === lowerSearch
        );
    }, [groupedExercises, searchTerm]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 200,
                display: 'flex', flexDirection: 'column', padding: '1rem'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{t('select_exercise')}</h2>
                <button className="btn" style={{ padding: '0.5rem' }} onClick={onClose}><X size={24} /></button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={20} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                <input
                    className="input"
                    style={{ paddingLeft: '2.5rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)', border: 'none' }}
                    placeholder={t('search')}
                    autoFocus
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <motion.div
                initial={{ y: "20%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "20%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', alignContent: 'start' }}
            >
                {Object.keys(filteredGroups).sort().map(group => (
                    filteredGroups[group].length > 0 && (
                        <div key={group}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{group}</h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {filteredGroups[group].map(ex => (
                                    <button
                                        key={ex.name}
                                        className="card"
                                        style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer', color: 'var(--text-primary)' }}
                                        onClick={() => onSelect(ex)}
                                    >
                                        {t(`exercises.${ex.name}`, { defaultValue: ex.name })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {Object.values(filteredGroups).every(g => g.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>{t('no_matches')}</p>
                )}

                {searchTerm.trim() !== '' && !exactMatchExists && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                        <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t('convert_custom')}</label>
                        <select
                            className="input"
                            style={{ padding: '0.8rem', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                            value={newExerciseTarget}
                            onChange={e => setNewExerciseTarget(e.target.value)}
                        >
                            <option value="" style={{ backgroundColor: 'var(--bg-card)' }}>{t('select_muscle_group')}</option>
                            {MUSCLE_GROUPS.map(g => (
                                <option key={g} value={g} style={{ backgroundColor: 'var(--bg-card)' }}>{g}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                            <input
                                type="checkbox"
                                id="newBodyweightToggle"
                                checked={newExerciseBodyweight}
                                onChange={e => setNewExerciseBodyweight(e.target.checked)}
                                style={{ accentColor: 'var(--primary)', width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                            />
                            <label htmlFor="newBodyweightToggle" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                {t('bodyweight_exercise', { defaultValue: 'Bodyweight Exercise' })}
                            </label>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => onSelect({ name: searchTerm, target: newExerciseTarget || 'Custom', bodyweight: newExerciseBodyweight })}
                        >
                            {t('create_exercise', { name: searchTerm })}
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
