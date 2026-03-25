import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';

export default function RestTimer({ endTime, totalDuration, onComplete }) {
    const { extendRestTimer } = useWorkout();
    const [timeLeft, setTimeLeft] = useState(0);
    const [expanded, setExpanded] = useState(false);

    // Touch tracking for swipe-to-dismiss
    const touchStartRef = useRef(null);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const remaining = Math.ceil((endTime - now) / 1000);
            if (remaining <= 0) {
                setTimeLeft(0);
                setExpanded(false);
                if (onComplete) onComplete();
            } else {
                setTimeLeft(remaining);
            }
        };

        tick();
        const interval = setInterval(tick, 200);
        return () => clearInterval(interval);
    }, [endTime, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const percentage = Math.max(0, Math.min(1, (timeLeft * 1000) / totalDuration));

    // ── Compact SVG stats ──────────────────────────────────────────
    const compactSize = 32;
    const compactStroke = 3;
    const compactRadius = (compactSize - compactStroke) / 2;
    const compactCircumference = compactRadius * 2 * Math.PI;
    const compactOffset = compactCircumference - percentage * compactCircumference;

    // ── Expanded SVG stats ─────────────────────────────────────────
    const expandedSize = Math.min(window.innerWidth * 0.70, window.innerHeight * 0.55);
    const expandedStroke = expandedSize * 0.055;
    const expandedRadius = (expandedSize - expandedStroke) / 2;
    const expandedCircumference = expandedRadius * 2 * Math.PI;
    const expandedOffset = expandedCircumference - percentage * expandedCircumference;

    // Swipe to dismiss
    const onTouchStart = (e) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e) => {
        if (!touchStartRef.current) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 30) setExpanded(false);
        touchStartRef.current = null;
    };

    if (timeLeft <= 0) return null;

    // The expanded overlay is portalled to document.body so it escapes
    // ExerciseCard's `overflow: hidden` + Framer Motion transform context.
    const overlay = (
        <AnimatePresence>
            {expanded && (
                <motion.div
                    key="rest-timer-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    onClick={() => setExpanded(false)}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    style={{
                        position: 'fixed',
                        inset: '-10vh',
                        zIndex: 200,
                        background: 'rgba(0,0,0,0.78)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2.5rem',
                    }}
                >
                    {/* Large ring with MM:SS inside */}
                    <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        style={{
                            position: 'relative',
                            width: expandedSize,
                            height: expandedSize,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <svg
                            width={expandedSize}
                            height={expandedSize}
                            style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
                        >
                            <circle
                                stroke="rgba(255,255,255,0.15)"
                                fill="transparent"
                                strokeWidth={expandedStroke}
                                r={expandedRadius}
                                cx={expandedSize / 2}
                                cy={expandedSize / 2}
                            />
                            <circle
                                stroke="var(--color-primary)"
                                fill="transparent"
                                strokeWidth={expandedStroke}
                                strokeDasharray={expandedCircumference}
                                strokeDashoffset={expandedOffset}
                                strokeLinecap="round"
                                r={expandedRadius}
                                cx={expandedSize / 2}
                                cy={expandedSize / 2}
                                style={{ transition: 'stroke-dashoffset 0.2s linear' }}
                            />
                        </svg>

                        {/* Time text centred inside the ring */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', userSelect: 'none' }}>
                            <span style={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color: 'var(--color-primary)',
                                fontSize: `${expandedSize * 0.18}px`,
                                lineHeight: 1,
                                letterSpacing: '-0.02em',
                            }}>
                                {formatTime(timeLeft)}
                            </span>
                            <span style={{
                                fontFamily: 'monospace',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: `${expandedSize * 0.06}px`,
                                marginTop: '0.4rem',
                                letterSpacing: '0.05em',
                            }}>
                                / {formatTime(Math.floor(totalDuration / 1000))}
                            </span>
                        </div>
                    </motion.div>

                    {/* +1m button below the ring */}
                    <motion.button
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        onClick={(e) => { e.stopPropagation(); extendRestTimer(60); }}
                        style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(255,255,255,0.35)',
                            background: 'rgba(255,255,255,0.15)',
                            color: '#ffffff',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer',
                            boxShadow: 'none',
                        }}
                    >
                        <Plus size={18} /> 1 min
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* ── Compact pill ───────────────────────────────────────── */}
            <div
                onClick={() => setExpanded(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    // Keep it in the layout even when overlay is up, but invisible
                    opacity: expanded ? 0 : 1,
                    pointerEvents: expanded ? 'none' : 'auto',
                    transition: 'opacity 0.15s',
                }}
            >
                <div style={{ position: 'relative', width: compactSize, height: compactSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={compactSize} height={compactSize} style={{ transform: 'rotate(-90deg)' }}>
                        <circle stroke="var(--shadow-dark)" fill="transparent" strokeWidth={compactStroke} r={compactRadius} cx={compactSize / 2} cy={compactSize / 2} />
                        <circle
                            stroke="var(--color-primary)"
                            fill="transparent"
                            strokeWidth={compactStroke}
                            strokeDasharray={compactCircumference}
                            strokeDashoffset={compactOffset}
                            strokeLinecap="round"
                            r={compactRadius}
                            cx={compactSize / 2}
                            cy={compactSize / 2}
                            style={{ transition: 'stroke-dashoffset 0.2s linear' }}
                        />
                    </svg>
                </div>

                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                    {formatTime(timeLeft)}
                </span>

                <button
                    className="btn btn-sm"
                    onClick={(e) => { e.stopPropagation(); extendRestTimer(60); }}
                    style={{ padding: '0.25rem', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}
                >
                    +1m
                </button>
            </div>

            {/* Portal the expanded overlay to body so it clears any ancestor transforms */}
            {ReactDOM.createPortal(overlay, document.body)}
        </>
    );
}
