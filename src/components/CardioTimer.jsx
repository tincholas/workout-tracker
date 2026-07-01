import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';

export default function CardioTimer({ exercise }) {
    const { updateExercise, notificationPermission, requestNotificationPermission, personalRecords } = useWorkout();
    const [now, setNow] = useState(Date.now());
    const intervalRef = useRef(null);

    const cardioPRBest = personalRecords?.[exercise.name]?.volume || 0;
    const prHintMinutes = React.useMemo(() => {
        if (cardioPRBest <= 0) return null;
        const rawMins = cardioPRBest / 60;
        return Math.round(rawMins * 100) / 100;
    }, [cardioPRBest]);

    // Input Handling
    const [localInput, setLocalInput] = useState(exercise.targetTimeMinutes || '');
    const [prevInput, setPrevInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const notifiedRef = useRef(false); // tracks if we've already fired the target notification

    // Derived State
    const targetMinutes = Number(exercise.targetTimeMinutes) || 0;
    const isRunning = exercise.timerState === 'running';
    const startTime = exercise.timerStart ? new Date(exercise.timerStart).getTime() : null;
    const accumulated = exercise.accumulatedSeconds || 0;

    const currentElapsedSeconds = accumulated + (isRunning && startTime ? (now - startTime) / 1000 : 0);
    const targetSeconds = targetMinutes * 60;
    const remainingSeconds = Math.max(0, targetSeconds - currentElapsedSeconds);
    const isTargetMet = currentElapsedSeconds >= targetSeconds;

    // Sync input when prop changes (unless focused)
    useEffect(() => {
        if (!isFocused) {
            setLocalInput(exercise.targetTimeMinutes || 0); // User requested clearing "0" on click, so default display can be 0
        }
    }, [exercise.targetTimeMinutes, isFocused]);

    // Tick only when running
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setNow(Date.now());
            }, 100);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning]);

    // Reset notification gate when timer drops below target (restart / manual reset)
    useEffect(() => {
        if (!isTargetMet) notifiedRef.current = false;
    }, [isTargetMet]);

    // Fire notification once when target is first reached
    useEffect(() => {
        if (isTargetMet && targetSeconds > 0 && !notifiedRef.current) {
            notifiedRef.current = true;
            if (notificationPermission !== 'granted') {
                requestNotificationPermission();
            } else if ('Notification' in window) {
                new Notification('Target reached! 🎯', {
                    body: `You've completed your ${targetMinutes} min cardio target!`,
                    icon: '/bicep.svg',
                    silent: false,
                });
            }
        }
    }, [isTargetMet, targetSeconds, targetMinutes, notificationPermission, requestNotificationPermission]);

    const handleStart = () => {
        updateExercise(exercise.id, {
            timerState: 'running',
            timerStart: new Date().toISOString(),
        });
    };

    const handleStop = () => {
        const currentNow = Date.now();
        const sessionSeconds = startTime ? (currentNow - startTime) / 1000 : 0;

        updateExercise(exercise.id, {
            timerState: 'paused',
            timerStart: null,
            accumulatedSeconds: accumulated + sessionSeconds
        });
    };

    const formatTime = (totalSeconds) => {
        const absSeconds = Math.abs(totalSeconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = Math.floor(absSeconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFullTime = (totalSeconds) => {
        const absSeconds = Math.abs(totalSeconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = Math.floor(absSeconds % 60);
        const centis = Math.floor((absSeconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centis.toString().padStart(2, '0')}`;
    };

    // Input Handlers
    const handleFocus = () => {
        setPrevInput(localInput);
        setLocalInput(''); // Clear on click
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (localInput === '' || localInput === null) {
            // Restore previous if empty
            setLocalInput(prevInput);
            updateExercise(exercise.id, { targetTimeMinutes: Number(prevInput) });
        } else {
            // Save new value
            updateExercise(exercise.id, { targetTimeMinutes: Number(localInput) });
        }
    };

    const handleChange = (e) => {
        setLocalInput(e.target.value.replace(',', '.'));
    };

    const hintStyle = {
        fontSize: '0.65rem',
        color: '#eab308',
        marginTop: '4px',
        fontWeight: 600,
        letterSpacing: '0.02em',
    };

    // Visuals
    // Primary/Success until target reached
    const displayColor = isTargetMet ? 'var(--color-success)' : 'var(--text-primary)';
    const borderColor = isTargetMet ? 'var(--color-success)' : 'var(--border-subtle)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Time (Minutes)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="input"
                        placeholder="0"
                        value={localInput}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        disabled={exercise.timerState === 'running'}
                        style={{ padding: '0.8rem', fontSize: '1.1rem' }}
                    />
                    {isFocused && prHintMinutes != null && (
                        <div style={hintStyle}>🏆 > {prHintMinutes} min for PR</div>
                    )}
                </div>

                <button
                    className="btn btn-primary"
                    style={{
                        height: '50px', width: '100px',
                        fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        backgroundColor: isRunning ? '#ef4444' : (exercise.timerState === 'paused' ? '#eab308' : 'var(--primary)'),
                        borderColor: 'transparent'
                    }}
                    onClick={isRunning ? handleStop : handleStart}
                >
                    {isRunning ? (
                        <>
                            <Square size={18} fill="currentColor" /> Stop
                        </>
                    ) : (exercise.timerState === 'paused' ? (
                        <>
                            <RotateCcw size={18} /> Restart
                        </>
                    ) : (
                        <>
                            <Play size={18} fill="currentColor" /> Start
                        </>
                    ))}
                </button>
            </div>

            {/* Timer Display */}
            {(exercise.timerState !== 'idle' || isRunning) && (
                <div style={{
                    background: 'var(--bg-input)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${borderColor}`,
                    transition: 'border-color 0.3s ease, color 0.3s ease'
                }}>
                    <div style={{
                        fontSize: '3rem',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        color: displayColor,
                        textShadow: isTargetMet ? '0 0 10px rgba(34, 197, 94, 0.2)' : 'none'
                    }}>
                        {formatFullTime(currentElapsedSeconds)}
                    </div>

                    {!isTargetMet && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {formatTime(remainingSeconds)} Remaining
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
