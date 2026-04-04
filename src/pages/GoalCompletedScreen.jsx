import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Target, Share2, Home, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../utils/analytics';
import { fmtSeconds } from '../utils/formatTime';

const KG_TO_LBS = 2.20462;

function formatValue(val, goal, preferredUnit) {
    if (goal.type === 'bodyweight' || (goal.type === 'exercise' && !goal.isCardio)) {
        const display = preferredUnit === 'LBS'
            ? Math.round(val * KG_TO_LBS * 10) / 10
            : Math.round(val * 10) / 10;
        const unit = preferredUnit === 'LBS' ? 'lbs' : 'kg';
        return `${display} ${unit}`;
    }
    // Cardio: stored as seconds
    return fmtSeconds(val);
}

function daysSince(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.floor((now - start) / 86400000));
}

export default function GoalCompletedScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { goal, preferredUnit } = location.state || {};

    useEffect(() => {
        if (!goal) { navigate('/'); return; }

        // Confetti burst
        const duration = 3000;
        const end = Date.now() + duration;
        const frame = () => {
            confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    }, [goal, navigate]);

    if (!goal) return null;

    const days = daysSince(goal.createdAt);
    const targetFmt = formatValue(goal.targetValue, goal, preferredUnit);
    const initialFmt = formatValue(goal.initialValue, goal, preferredUnit);
    const goalName = goal.type === 'bodyweight'
        ? t('body_weight')
        : goal.exerciseName;

    const handleShare = async () => {
        const text = `🎯 ${t('goal_completed')}\n${goalName}: ${initialFmt} → ${targetFmt}\n${t('days_active')}: ${days}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: t('goal_completed'), text });
                trackEvent('goal_shared', { method: 'native' });
            } catch { }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                trackEvent('goal_shared', { method: 'clipboard' });
            } catch { }
        }
    };

    return (
        <div className="page-container" style={{
            padding: 'var(--space-lg)',
            paddingBottom: '120px',
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
                transition={{ type: 'spring', duration: 0.8 }}
            >
                <Target size={80} color="#22c55e" style={{ marginBottom: '1rem' }} />
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}
            >
                {t('goal_completed')}
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}
            >
                {t('goal_completed_message')}
            </motion.p>

            {/* Goal info cards */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}
            >
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <TrendingUp size={22} color="#22c55e" />
                    <span style={{ fontSize: '1rem', fontWeight: '700' }}>{targetFmt}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('target_value')}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🏁</span>
                    <span style={{ fontSize: '1rem', fontWeight: '700' }}>{initialFmt}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('initial_value')}</span>
                </div>
                <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={22} color="var(--color-primary)" />
                    <span style={{ fontSize: '1rem', fontWeight: '700' }}>{days}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('days_active')}</span>
                </div>
            </motion.div>

            {/* Goal name banner */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="card"
                style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))',
                    border: '1px solid rgba(34,197,94,0.3)',
                    fontWeight: '700',
                    fontSize: '1.1rem'
                }}
            >
                {goalName}
            </motion.div>

            <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ delay: 0.7 }}
                    className="btn"
                    style={{ width: '100%', padding: '1rem', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}
                    onClick={handleShare}
                >
                    <Share2 size={20} /> {t('share_goal')}
                </motion.button>
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ delay: 0.8 }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => navigate('/')}
                >
                    <Home size={20} /> {t('return_home')}
                </motion.button>
            </div>
        </div>
    );
}
