import React, { useRef } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { Check } from 'lucide-react';

export default function SetRow({ set, index, onUpdate, onDelete }) {
    const { preferredUnit } = useWorkout();

    // --- Weight Logic ---
    // Ref to store the weight value (ALWAYS IN KG) before clearing it on focus
    const prevWeightRef = useRef(set.weight);

    // Local state for input value to allow typing decimals/empty
    const [tempValue, setTempValue] = React.useState(null);

    // Helper for display
    const getDisplayWeight = () => {
        // If user is typing, show their temporary value
        if (tempValue !== null) return tempValue;

        if (set.weight === '' || set.weight === null) return '';
        if (preferredUnit === 'KG') return set.weight;
        // Convert KG -> LBS (1kg = 2.20462lbs)
        return Math.round(set.weight * 2.20462);
    };

    const handleChange = (field, value) => {
        onUpdate({ [field]: value });
    };

    const handleWeightChange = (e) => {
        setTempValue(e.target.value);
    };

    const handleWeightFocus = () => {
        prevWeightRef.current = set.weight; // Store current KG
        setTempValue(''); // Clear input for "Auto-clear" feature
    };

    const handleWeightBlur = () => {
        // If left empty, restore the previous value (KG)
        if (tempValue === '' || tempValue === null) {
            handleChange('weight', prevWeightRef.current);
            setTempValue(null);
            return;
        }

        const numVal = parseFloat(tempValue);
        let finalWeightKg = numVal;

        if (preferredUnit !== 'KG') {
            // Convert Input LBS -> Storage KG
            // 1 lb = 0.453592 kg
            finalWeightKg = numVal / 2.20462;
        }

        // Round to nearest 0.5 KG
        finalWeightKg = Math.round(finalWeightKg * 2) / 2;

        handleChange('weight', finalWeightKg);
        setTempValue(null);
    };

    // --- Reps Logic ---
    const prevRepsRef = useRef(set.reps);
    const [tempReps, setTempReps] = React.useState(null);

    const getDisplayReps = () => {
        if (tempReps !== null) return tempReps;
        return set.reps;
    };

    const handleRepsChange = (e) => {
        setTempReps(e.target.value);
    };

    const handleRepsFocus = () => {
        prevRepsRef.current = set.reps;
        setTempReps('');
    };

    const handleRepsBlur = () => {
        if (tempReps === '' || tempReps === null) {
            handleChange('reps', prevRepsRef.current);
            setTempReps(null);
            return;
        }
        handleChange('reps', tempReps);
        setTempReps(null);
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
                    placeholder={preferredUnit}
                    value={getDisplayWeight()}
                    onChange={handleWeightChange}
                    onFocus={handleWeightFocus}
                    onBlur={handleWeightBlur}
                />
                <span style={{ position: 'absolute', right: 8, top: 10, fontSize: '0.7em', color: 'var(--text-muted)' }}>{preferredUnit}</span>
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
                    value={getDisplayReps()}
                    onChange={handleRepsChange}
                    onFocus={handleRepsFocus}
                    onBlur={handleRepsBlur}
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
