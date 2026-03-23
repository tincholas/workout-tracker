import React, { useState, useRef, useEffect } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { Plus, Minus, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SupersetRow from './SupersetRow';
import { useNavigate } from 'react-router-dom';

export default function SupersetCard({ exercise1, exercise2 }) {
    const { breakSuperset, addSet, removeSet, updateSet, removeExercise } = useWorkout();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const { t } = useTranslation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const maxSets = Math.max(exercise1.sets.length, exercise2.sets.length);

    const handleAddSet = () => {
        addSet(exercise1.id);
        addSet(exercise2.id);
    };

    const handleRemoveSet = () => {
        // Find the last set id for each exercise to pass to removeSet
        if (exercise1.sets.length > 0) removeSet(exercise1.id, exercise1.sets[exercise1.sets.length - 1].id);
        if (exercise2.sets.length > 0) removeSet(exercise2.id, exercise2.sets[exercise2.sets.length - 1].id);
    };

    const handleRemoveSuperset = () => {
        removeExercise(exercise1.id);
        removeExercise(exercise2.id);
        setShowMenu(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card"
            style={{ padding: '1rem', marginBottom: '1rem', overflow: 'hidden', boxShadow: '0 0 12px rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <h3 
                        style={{ margin: 0, fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => navigate(`/analytics?exercise=${encodeURIComponent(exercise1.name)}&back=/session`)}
                    >
                        {t(`exercises.${exercise1.name}`, { defaultValue: exercise1.name })}
                    </h3>
                    <h3 
                        style={{ margin: 0, fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => navigate(`/analytics?exercise=${encodeURIComponent(exercise2.name)}&back=/session`)}
                    >
                        {t(`exercises.${exercise2.name}`, { defaultValue: exercise2.name })}
                    </h3>
                </div>

                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button className="btn btn-sm" onClick={() => setShowMenu(!showMenu)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem' }}>
                        <MoreVertical size={20} />
                    </button>
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.5rem', minWidth: '160px', zIndex: 50, boxShadow: 'var(--shadow-convex)', border: '1px solid var(--border-subtle)' }}
                            >
                                <button
                                    onClick={() => { breakSuperset(exercise2.id); setShowMenu(false); }}
                                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #333' }}
                                >
                                    🔗 {t('break_superset', { defaultValue: 'Break Superset' })}
                                </button>
                                <button
                                    onClick={handleRemoveSuperset}
                                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', textAlign: 'left', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} /> {t('remove')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Render Rows */}
            <div>
                {Array.from({ length: maxSets }).map((_, i) => (
                    <SupersetRow
                        key={i}
                        index={i}
                        set1={exercise1.sets[i]}
                        set2={exercise2.sets[i]}
                        exercise1={exercise1}
                        exercise2={exercise2}
                        onUpdate1={(updates) => updateSet(exercise1.id, exercise1.sets[i].id, updates)}
                        onUpdate2={(updates) => updateSet(exercise2.id, exercise2.sets[i].id, updates)}
                        isPR1={false}
                        isPR2={false}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-sm" onClick={handleAddSet} style={{ flex: 1, padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem', borderStyle: 'dashed' }}>
                    <Plus size={16} /> {t('add_set')}
                </button>
                {maxSets > 1 && (
                    <button className="btn btn-sm" onClick={handleRemoveSet} style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <Minus size={16} />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

