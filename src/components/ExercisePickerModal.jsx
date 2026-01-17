import React, { useMemo, useState } from 'react';
import { EXERCISE_TYPES, WORKOUT_TEMPLATES, EXERCISE_DATABASE, MUSCLE_GROUPS } from '../store/models';
import { useWorkout } from '../store/WorkoutContext';
import { X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExercisePickerModal({ onClose, onSelect }) {
    const { history } = useWorkout();
    const [searchTerm, setSearchTerm] = useState('');

    const [newExerciseTarget, setNewExerciseTarget] = useState('');

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
            const matches = groupedExercises[key].filter(ex => ex.name.toLowerCase().includes(lowerTerm));
            if (matches.length > 0) {
                result[key] = matches;
            }
        });
        return result;
    }, [groupedExercises, searchTerm]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
                display: 'flex', flexDirection: 'column', padding: '1rem'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Select Exercise</h2>
                <button className="btn" style={{ padding: '0.5rem' }} onClick={onClose}><X size={24} /></button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={20} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                <input
                    className="input"
                    style={{ paddingLeft: '2.5rem', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none' }}
                    placeholder="Search..."
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
                                        style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
                                        onClick={() => onSelect(ex)}
                                    >
                                        {ex.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {Object.values(filteredGroups).every(g => g.length === 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No matches found.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ color: '#fff', fontSize: '0.9rem' }}>Convert to Custom Exercise:</label>
                            <select
                                className="input"
                                style={{ padding: '0.8rem', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #444' }}
                                value={newExerciseTarget}
                                onChange={e => setNewExerciseTarget(e.target.value)}
                            >
                                <option value="" style={{ backgroundColor: '#1f2937' }}>Select Muscle Group (Optional)</option>
                                {MUSCLE_GROUPS.map(g => (
                                    <option key={g} value={g} style={{ backgroundColor: '#1f2937' }}>{g}</option>
                                ))}
                            </select>
                            <button
                                className="btn btn-primary"
                                onClick={() => onSelect({ name: searchTerm, target: newExerciseTarget || 'Custom' })}
                            >
                                Create "{searchTerm}"
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
