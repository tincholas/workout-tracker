import React from 'react';
import SetRow from './SetRow';
import { usePersonalRecords } from '../store/hooks/usePersonalRecords';

export default function SupersetRow({ index, set1, set2, isPR1, isPR2, exercise1, exercise2, onUpdate1, onUpdate2 }) {
    // Both sets share a background if both completed, or partial if one is.
    const bg = (set1.completed && set2.completed) 
        ? 'rgba(16, 185, 129, 0.1)' 
        : (set1.completed || set2.completed) ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-elevated)';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: bg,
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem',
            marginBottom: '0.5rem',
            border: '1px solid var(--border-subtle)',
        }}>
            {/* Vertically centered set number */}
            <div style={{
                width: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
            }}>
                {index + 1}
            </div>
            
            {/* Stacked SetRows */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <SetRow
                    set={set1}
                    index={index}
                    hideIndex={true}
                    onUpdate={onUpdate1}
                    isBodyweight={exercise1.bodyweight}
                    isUnilateral={set1.unilateral}
                    exerciseIsUnilateral={exercise1.unilateral}
                    isPR={isPR1}
                />
                <div style={{ height: '1px', background: 'var(--border-subtle)', opacity: 0.5, margin: '0 0.5rem' }} />
                <SetRow
                    set={set2}
                    index={index}
                    hideIndex={true}
                    onUpdate={onUpdate2}
                    isBodyweight={exercise2.bodyweight}
                    isUnilateral={set2.unilateral}
                    exerciseIsUnilateral={exercise2.unilateral}
                    isPR={isPR2}
                />
            </div>
        </div>
    );
}

