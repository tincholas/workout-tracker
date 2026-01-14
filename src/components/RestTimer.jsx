import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';

export default function RestTimer({ endTime, totalDuration, onComplete }) {
    const { extendRestTimer } = useWorkout();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            const remaining = Math.ceil((endTime - now) / 1000);

            if (remaining <= 0) {
                setTimeLeft(0);
                if (onComplete) onComplete();
            } else {
                setTimeLeft(remaining);
            }
        };

        tick(); // Immediate
        const interval = setInterval(tick, 200);

        return () => clearInterval(interval);
    }, [endTime, onComplete]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(1, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate percentage
    // Time remaining / Total duration
    // totalDuration is in ms
    const percentage = Math.max(0, Math.min(1, (timeLeft * 1000) / totalDuration));

    // SVG Stats
    const size = 32;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage * circumference);

    if (timeLeft <= 0) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '16px' }}>
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        stroke="rgba(255,255,255,0.1)"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        stroke="var(--color-primary)"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                        style={{ transition: 'stroke-dashoffset 0.2s linear' }}
                    />
                </svg>
            </div>

            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                {formatTime(timeLeft)}
            </span>

            <button
                className="btn btn-sm"
                onClick={() => extendRestTimer(60)}
                style={{
                    padding: '0.25rem',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginLeft: '0.25rem'
                }}
            >
                +1m
            </button>
        </div>
    );
}
