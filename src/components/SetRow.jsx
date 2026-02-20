import React, { useRef, useState, useEffect } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { Check, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SetRow({ set, index, onUpdate, onDelete, isPR }) {
    const { preferredUnit } = useWorkout();

    // --- Weight Logic ---
    // Ref to store the weight value (ALWAYS IN KG) before clearing it on focus
    const prevWeightRef = useRef(set.weight);

    // Local state for input value to allow typing decimals/empty
    const [tempValue, setTempValue] = React.useState(null);

    // PR Animation State
    const [showCelebration, setShowCelebration] = useState(false);

    // Trigger animation when isPR becomes true AND text implies newly completed
    useEffect(() => {
        if (isPR && set.completed) {
            // Only animate if it wasn't just rendered as completed (simple check: mounting)
            // Ideally we'd compare previous props, but for now, we'll trigger on effect
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isPR, set.completed]);

    const handleToggleComplete = () => {
        const newState = !set.completed;
        handleChange('completed', newState);
    };

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
            gridTemplateColumns: '2rem 1fr 1fr 36px',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '0.5rem',
            backgroundColor: set.completed ? (isPR ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 'transparent',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: isPR && set.completed ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {showCelebration && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', animation: 'pop-1 0.8s forwards' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%', animation: 'pop-2 0.8s forwards' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: '#eab308', borderRadius: '50%', animation: 'pop-3 0.8s forwards' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', animation: 'pop-4 0.8s forwards' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '6px', height: '6px', background: '#a855f7', borderRadius: '50%', animation: 'pop-5 0.8s forwards' }} />
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>{index + 1}</span>
                {isPR && set.completed && <Trophy size={12} color="#eab308" className="pr-celebration" style={{ marginTop: 2 }} />}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <motion.input
                    type="number"
                    whileFocus={{ scale: 1.05, borderColor: 'var(--color-primary)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    inputMode="decimal"
                    className="input"
                    style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: set.completed ? (isPR ? '#eab308' : 'var(--color-success)') : 'var(--text-primary)'
                    }}
                    placeholder={preferredUnit}
                    value={getDisplayWeight()}
                    onChange={handleWeightChange}
                    onFocus={handleWeightFocus}
                    onBlur={handleWeightBlur}
                />
                <span style={{ position: 'absolute', right: 8, top: 10, fontSize: '0.7em', color: 'var(--text-muted)' }}>{preferredUnit}</span>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <motion.input
                    type="number"
                    whileFocus={{ scale: 1.05, borderColor: 'var(--color-primary)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    inputMode="decimal"
                    className="input"
                    style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: set.completed ? (isPR ? '#eab308' : 'var(--color-success)') : 'var(--text-primary)'
                    }}
                    placeholder="reps"
                    value={getDisplayReps()}
                    onChange={handleRepsChange}
                    onFocus={handleRepsFocus}
                    onBlur={handleRepsBlur}
                />
                <span style={{ position: 'absolute', right: 8, top: 10, fontSize: '0.7em', color: 'var(--text-muted)' }}>REPS</span>
            </div>

            <motion.button
                layout
                whileTap={{ scale: 0.8 }}
                animate={{
                    scale: set.completed ? [1, 1.2, 1] : 1,
                    backgroundColor: set.completed ? (isPR ? '#eab308' : 'var(--color-success)') : 'rgba(255,255,255,0.1)'
                }}
                transition={{ duration: 0.2 }}
                className="btn"
                style={{
                    padding: '0.5rem',
                    color: set.completed ? '#000' : 'var(--text-primary)',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    zIndex: 1
                }}
                onClick={handleToggleComplete}
            >
                <Check size={18} />
            </motion.button>
        </div>
    );
}
