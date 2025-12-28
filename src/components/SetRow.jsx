import React from 'react';
import { Check } from 'lucide-react';

export default function SetRow({ set, index, onUpdate, onDelete }) {
    const handleChange = (field, value) => {
        onUpdate({ [field]: value });
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr 1fr auto',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '0.5rem',
            backgroundColor: set.completed ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)'
        }}>
            <span style={{
                color: 'var(--text-muted)',
                width: '24px',
                textAlign: 'center',
                fontWeight: 'bold'
            }}>{index + 1}</span>

            <div style={{ position: 'relative' }}>
                <input
                    type="number"
                    className="input"
                    style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: set.completed ? 'var(--color-success)' : 'var(--text-primary)'
                    }}
                    placeholder="kg"
                    value={set.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                />
                <span style={{ position: 'absolute', right: 8, top: 10, fontSize: '0.7em', color: 'var(--text-muted)' }}>KG</span>
            </div>

            <div style={{ position: 'relative' }}>
                <input
                    type="number"
                    className="input"
                    style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: set.completed ? 'var(--color-success)' : 'var(--text-primary)'
                    }}
                    placeholder="reps"
                    value={set.reps}
                    onChange={(e) => handleChange('reps', e.target.value)}
                />
                <span style={{ position: 'absolute', right: 8, top: 10, fontSize: '0.7em', color: 'var(--text-muted)' }}>REPS</span>
            </div>

            <button
                className="btn"
                style={{
                    padding: '0.5rem',
                    backgroundColor: set.completed ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                    color: set.completed ? '#000' : 'var(--text-primary)',
                    border: 'none',
                    width: '36px',
                    height: '36px'
                }}
                onClick={() => handleChange('completed', !set.completed)}
            >
                <Check size={18} />
            </button>
        </div>
    );
}
