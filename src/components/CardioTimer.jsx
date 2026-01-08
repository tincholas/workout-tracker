import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';

export default function CardioTimer({ exercise }) {
    const { updateExercise } = useWorkout();
    const [now, setNow] = useState(Date.now());
    const intervalRef = useRef(null);

    // Input Handling
    const [localInput, setLocalInput] = useState(exercise.targetTimeMinutes || '');
    const [prevInput, setPrevInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);

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
        setLocalInput(e.target.value);
    };

    // Visuals
    // White until target reached, then Green.
    const displayColor = isTargetMet ? '#22c55e' : '#ffffff';
    const borderColor = isTargetMet ? '#22c55e' : '#ffffff';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Time (Minutes)</label>
                    <input
                        type="number"
                        className="input"
                        placeholder="0"
                        value={localInput}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        disabled={exercise.timerState === 'running'}
                        style={{ padding: '0.8rem', fontSize: '1.1rem' }}
                    />
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
                    background: 'rgba(0,0,0,0.3)',
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
