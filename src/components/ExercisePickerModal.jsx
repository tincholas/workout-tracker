import React, { useMemo, useState } from 'react';
import { EXERCISE_TYPES, WORKOUT_TEMPLATES } from '../store/models';
import { useWorkout } from '../store/WorkoutContext';
import { X, Search } from 'lucide-react';

export default function ExercisePickerModal({ onClose, onSelect }) {
    const { history } = useWorkout();
    const [searchTerm, setSearchTerm] = useState('');

    const allExercises = useMemo(() => {
        const exercises = new Set();
        // Templates
        Object.values(WORKOUT_TEMPLATES).flat().forEach(ex => exercises.add(ex.name));
        // History
        if (history) {
            history.forEach(w => w.exercises.forEach(ex => exercises.add(ex.name)));
        }
        return Array.from(exercises).sort();
    }, [history]);

    const filtered = allExercises.filter(e => e.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
            display: 'flex', flexDirection: 'column', padding: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Select Exercise</h2>
                <button className="btn" style={{ padding: '0.5rem' }} onClick={onClose}><X size={24} /></button>
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={20} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-muted)' }} />
                <input
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Search..."
                    autoFocus
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gap: '0.5rem', alignContent: 'start' }}>
                {filtered.map(name => (
                    <button
                        key={name}
                        className="card"
                        style={{ textAlign: 'left', padding: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => onSelect(name)}
                    >
                        {name}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <button
                        className="btn btn-primary"
                        onClick={() => onSelect(searchTerm)}
                    >
                        Create "{searchTerm}"
                    </button>
                )}
            </div>
        </div>
    );
}
