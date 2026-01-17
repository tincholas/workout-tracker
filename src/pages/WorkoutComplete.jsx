import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import confetti from 'canvas-confetti';
import { Trophy, Calendar, CheckCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkoutComplete() {
    const { history, personalRecords } = useWorkout();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ consistency: 0, streak: 0, prs: [] });

    useEffect(() => {
        if (!history || history.length === 0) {
            navigate('/');
            return;
        }

        // 1. Trigger Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // 2. Calculate Stats
        const lastWorkout = history[history.length - 1];

        // A. Identify PRs in this workout
        // If a set in this workout is currently holding the record, it's a new PR
        const newPrs = [];
        lastWorkout.exercises.forEach(ex => {
            const pr = personalRecords[ex.name];
            if (pr && ex.sets.some(s => s.id === pr.setId)) {

                // Find the specific set that broke the record
                const prSet = ex.sets.find(s => s.id === pr.setId);
                newPrs.push({
                    exercise: ex.name,
                    weight: prSet.weight,
                    reps: prSet.reps
                });
            }
        });

        // B. Streak & Consistency
        // Helper to normalize date to YYYY-MM-DD
        const toDay = (dateStr) => new Date(dateStr).toISOString().split('T')[0];

        const today = toDay(new Date());
        const daysWithWorkouts = new Set(history.map(w => toDay(w.endTime)));

        // Streak: Count backwards from today (or yesterday if today is done)
        let streak = 0;
        let checkDate = new Date();
        // If we just finished a workout, daysWithWorkouts has 'today'.
        while (daysWithWorkouts.has(toDay(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Consistency: Last 7 days
        let daysActive = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            if (daysWithWorkouts.has(toDay(d))) {
                daysActive++;
            }
        }
        const consistency = Math.round((daysActive / 7) * 100);

        setStats({ consistency, streak, prs: newPrs });

        return () => clearInterval(interval);
    }, [history, navigate, personalRecords]);

    return (
        <div className="page-container" style={{
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center'
        }}>
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
            >
                <Trophy size={80} color="#eab308" style={{ marginBottom: '1rem' }} />
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}
            >
                Workout Complete!
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem' }}
            >
                Great job crushing your goals.
            </motion.p>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="card"
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    <CheckCircle size={32} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.streak}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Day Streak</span>
                </motion.div>

                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="card"
                    style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    <Calendar size={32} color="#a855f7" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.consistency}%</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>7-Day Consistency</span>
                </motion.div>
            </div>

            {stats.prs.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{ width: '100%', marginBottom: '2rem' }}
                >
                    <h3 style={{ marginBottom: '1rem' }}>🏆 New Personal Records</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {stats.prs.map((pr, i) => (
                            <div key={i} className="card" style={{
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                background: 'rgba(234, 179, 8, 0.1)'
                            }}>
                                <span style={{ fontWeight: 'bold' }}>{pr.exercise}</span>
                                <span>{pr.weight} x {pr.reps}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 1 }}
                className="btn btn-primary"
                style={{ width: '100%', maxWidth: '300px', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => navigate('/')}
            >
                <Home size={20} /> Return Home
            </motion.button>
        </div>
    );
}
