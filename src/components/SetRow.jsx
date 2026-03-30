import React, { useRef, useState, useEffect } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { Check, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SetRow({ set, index, onUpdate, onDelete, isPR, isUnilateral, exerciseIsUnilateral, isBodyweight, hideIndex = false, prVolume = 0, bodyWeightSnapshot }) {
    const { preferredUnit } = useWorkout();
    const KG_TO_LBS = 2.20462;
    // For completed sets use the stored set flag; for uncompleted sets follow the exercise
    const showUnilateral = set.completed ? !!(set.unilateral) : !!isUnilateral;

    // --- Weight Logic ---
    const prevWeightRef = useRef(set.weight);
    const [tempValue, setTempValue] = React.useState(null);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        if (isPR && set.completed) {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isPR, set.completed]);

    // Stamp unilateral:false on single-check toggle so volume calc is correct
    const handleToggleComplete = () => {
        onUpdate({ completed: !set.completed, unilateral: false });
    };

    const getDisplayWeight = () => {
        if (tempValue !== null) return tempValue;
        if (set.weight === '' || set.weight === null) return '';
        if (preferredUnit === 'KG') return set.weight;
        return Math.round(set.weight * 2.20462);
    };

    const handleChange = (field, value) => {
        onUpdate({ [field]: value });
    };

    const handleWeightChange = (e) => { setTempValue(e.target.value); };

    const handleWeightFocus = () => {
        prevWeightRef.current = set.weight;
        setTempValue('');
        setWeightFocused(true);
    };

    const handleWeightBlur = () => {
        setWeightFocused(false);
        if (tempValue === '' || tempValue === null) {
            handleChange('weight', prevWeightRef.current);
            setTempValue(null);
            return;
        }
        const numVal = parseFloat(tempValue);
        let finalWeightKg = numVal;
        if (preferredUnit !== 'KG') finalWeightKg = numVal / 2.20462;
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

    const handleRepsChange = (e) => { setTempReps(e.target.value); };
    const handleRepsFocus = () => { prevRepsRef.current = set.reps; setTempReps(''); setRepsFocused(true); };
    const handleRepsBlur = () => {
        setRepsFocused(false);
        if (tempReps === '' || tempReps === null) {
            handleChange('reps', prevRepsRef.current);
            setTempReps(null);
            return;
        }
        handleChange('reps', parseInt(tempReps, 10) || 0);
        setTempReps(null);
    };

    // Stamp unilateral:true on L/R completion so volume calc is correct
    const handleSide = (side) => {
        const newLeft = side === 'left' ? !(set.leftDone ?? false) : (set.leftDone ?? false);
        const newRight = side === 'right' ? !(set.rightDone ?? false) : (set.rightDone ?? false);
        onUpdate({ leftDone: newLeft, rightDone: newRight, completed: newLeft && newRight, unilateral: true });
    };

    const oneSideDone = (set.leftDone || set.rightDone) && !set.completed;
    const wideCol = showUnilateral || exerciseIsUnilateral;
    const gridCols = wideCol ? '1fr 1fr 76px' : '1fr 1fr 36px';
    const finalGridCols = hideIndex ? gridCols : `2rem ${gridCols}`;

    // --- PR Hint Logic ---
    const [weightFocused, setWeightFocused] = useState(false);
    const [repsFocused, setRepsFocused] = useState(false);

    const { prHintReps, prHintWeight } = React.useMemo(() => {
        if (prVolume <= 0) return {};
        const mult = (set.completed ? (set.unilateral ? 2 : 1) : (isUnilateral ? 2 : 1));

        // Calculate effective weight for the current set
        const currentWeightKg = Number(set.weight) || 0;
        const effectiveWeight = isBodyweight
            ? (() => {
                const bw = (bodyWeightSnapshot && bodyWeightSnapshot > 0) ? bodyWeightSnapshot : 80;
                const rounded = Math.round(bw / 20) * 20;
                return (rounded / 2) + currentWeightKg;
            })()
            : currentWeightKg;

        // Reps hint: minimum reps at current weight to beat PR
        let hintReps = null;
        if (effectiveWeight > 0) {
            hintReps = Math.floor(prVolume / (effectiveWeight * mult)) + 1;
        }

        // Weight hint: minimum weight at current reps to beat PR
        const currentReps = Number(set.reps) || 0;
        let hintWeight = null;
        if (currentReps > 0) {
            const rawThreshold = prVolume / (currentReps * mult);
            // Round up to nearest 0.5kg
            let candidate = Math.ceil(rawThreshold * 2) / 2;
            // Ensure strictly greater
            if (candidate * currentReps * mult <= prVolume) candidate += 0.5;

            if (isBodyweight) {
                // Subtract effective bodyweight component to show extra weight needed
                const bw = (bodyWeightSnapshot && bodyWeightSnapshot > 0) ? bodyWeightSnapshot : 80;
                const rounded = Math.round(bw / 20) * 20;
                let extraNeeded = candidate - (rounded / 2);
                extraNeeded = Math.ceil(extraNeeded * 2) / 2;
                hintWeight = Math.max(0, extraNeeded);
            } else {
                hintWeight = candidate;
            }

            // Convert for display if using LBS
            if (preferredUnit !== 'KG') {
                hintWeight = Math.ceil(hintWeight * KG_TO_LBS * 2) / 2;
            }
        }

        return { prHintReps: hintReps, prHintWeight: hintWeight };
    }, [prVolume, set.weight, set.reps, set.completed, set.unilateral, isUnilateral, isBodyweight, bodyWeightSnapshot, preferredUnit]);

    const hintStyle = {
        fontSize: '0.65rem',
        color: '#eab308',
        textAlign: 'center',
        marginTop: '2px',
        fontWeight: 600,
        letterSpacing: '0.02em',
    };

    const rowBg = set.completed
        ? (isPR ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.1)')
        : oneSideDone ? 'rgba(16, 185, 129, 0.05)' : 'transparent';

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: finalGridCols,
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: hideIndex ? '0' : '0.5rem',
            backgroundColor: hideIndex ? 'transparent' : rowBg,
            padding: hideIndex ? '0' : '0.5rem',
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

            {!hideIndex && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{index + 1}</span>
                    {isPR && set.completed && <Trophy size={12} color="#eab308" className="pr-celebration" style={{ marginTop: 2 }} />}
                </div>
            )}

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
                    placeholder={isBodyweight ? `+ ${preferredUnit}` : preferredUnit}
                    value={getDisplayWeight()}
                    onChange={handleWeightChange}
                    onFocus={handleWeightFocus}
                    onBlur={handleWeightBlur}
                />
                <span style={{ position: 'absolute', right: 8, top: 10, fontSize: '0.7em', color: 'var(--text-muted)' }}>
                    {isBodyweight ? `+ ${preferredUnit}` : preferredUnit}
                </span>
                {weightFocused && prHintWeight != null && (
                    <div style={hintStyle}>🏆 {prHintWeight} for PR</div>
                )}
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
                {repsFocused && prHintReps != null && (
                    <div style={hintStyle}>🏆 {prHintReps} for PR</div>
                )}
            </div>

            {showUnilateral ? (
                <div style={{ display: 'flex', gap: '4px', zIndex: 1 }}>
                    {[['L', 'left', set.leftDone ?? false], ['R', 'right', set.rightDone ?? false]].map(([label, side, done]) => (
                        <motion.button
                            key={side}
                            whileTap={{ scale: 0.8 }}
                            animate={{
                                backgroundColor: done
                                    ? (set.completed && isPR ? '#eab308' : 'var(--color-success)')
                                    : 'rgba(255,255,255,0.1)'
                            }}
                            transition={{ duration: 0.2 }}
                            className="btn"
                            style={{
                                padding: 0,
                                width: '36px',
                                height: '36px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: done ? '#000' : 'var(--text-muted)',
                                border: 'none',
                                flexShrink: 0
                            }}
                            onClick={() => handleSide(side)}
                        >
                            {label}
                        </motion.button>
                    ))}
                </div>
            ) : (
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
                        // Stretch to full 76px when inside a unilateral exercise for alignment
                        width: exerciseIsUnilateral ? '76px' : '36px',
                        height: '36px',
                        zIndex: 1
                    }}
                    onClick={handleToggleComplete}
                >
                    <Check size={18} />
                </motion.button>
            )}
        </div>
    );
}
