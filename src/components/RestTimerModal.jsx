import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function RestTimerModal({ initialSeconds, onClose }) {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [totalTime, setTotalTime] = useState(initialSeconds); // Keep track of total to calculate percentage

    useEffect(() => {
        if (timeLeft <= 0) {
            onClose();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onClose]);

    const addMinute = () => {
        setTimeLeft(prev => prev + 60);
        setTotalTime(prev => prev + 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate percentage for circular progress
    // We want it to decrease clockwise or counter-clockwise
    // If we want it to "empty", percentage = timeLeft / totalTime
    const percentage = Math.max(0, Math.min(1, timeLeft / totalTime));

    // SVG Circle stats
    const size = 200;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage * circumference);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <button
                onClick={onClose}
                className="btn"
                style={{ position: 'absolute', top: '2rem', right: '2rem', padding: '1rem', borderRadius: '50%', width: '50px', height: '50px' }}
            >
                <X size={24} />
            </button>

            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Background Circle */}
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle
                        stroke="rgba(255,255,255,0.1)"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    {/* Progress Circle */}
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
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>

                <div style={{ position: 'absolute', fontSize: '3rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <button
                className="btn btn-secondary"
                onClick={addMinute}
                style={{ marginTop: '3rem', padding: '1rem 2rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Plus size={24} /> Add 1m
            </button>

            <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>Resting...</p>
        </div>
    );
}
