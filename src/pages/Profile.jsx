import React, { useMemo, useRef } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { getAllData, importData, clearData } from '../store/db';
import {
    Flame, CheckCircle, Calendar, TrendingUp, BarChart2,
    Download, Upload, Trash2, RefreshCw, Globe, Sun, Moon,
    Dumbbell, Monitor, Target, Timer
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtSeconds } from '../utils/formatTime';

const THEME_KEY = 'app_theme';

function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'system';
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'system') {
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', theme);
    }
    localStorage.setItem(THEME_KEY, theme);
}

// Apply saved theme on module load
applyTheme(getTheme());

function StatCard({ icon, value, label, color = 'var(--color-primary)', onClick }) {
    return (
        <div className="card" onClick={onClick} style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: onClick ? 'pointer' : 'default',
            userSelect: onClick ? 'none' : 'auto',
        }}>
            <div style={{ color }}>{icon}</div>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1 }}>{value}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section style={{ marginBottom: '2rem' }}>
            <h3 style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--text-muted)',
                margin: '0 0 0.75rem 0.25rem'
            }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {children}
            </div>
        </section>
    );
}

function SettingRow({ children }) {
    return (
        <div className="card" style={{ padding: '1rem' }}>
            {children}
        </div>
    );
}

export default function Profile() {
    const { preferredUnit, toggleUnit, restTimer, setRestTimer,
        notificationPermission, requestNotificationPermission, history,
        goals, getGoalCurrentValue } = useWorkout();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [theme, setThemeState] = React.useState(getTheme);
    const [workoutPeriod, setWorkoutPeriod] = React.useState(0); // 0=month, 1=year, 2=week
    const [consistencyPeriod, setConsistencyPeriod] = React.useState(0); // 0=7d, 1=30d, 2=90d
    const [avgPeriod, setAvgPeriod] = React.useState(0); // 0=month, 1=year, 2=week
    const [cardioPeriod, setCardioPeriod] = React.useState(0); // 0=month, 1=year, 2=week
    const [avgCardioPeriod, setAvgCardioPeriod] = React.useState(0); // 0=month, 1=year, 2=week

    const changeTheme = (val) => {
        applyTheme(val);
        setThemeState(val);
    };

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        if (!history || history.length === 0) return null;

        const toDay = (d) => new Date(d).toISOString().split('T')[0];
        const now = new Date();
        const daysWithWorkouts = new Set(history.filter(w => w.endTime).map(w => toDay(w.endTime)));

        // Workout streak
        let streak = 0;
        const check = new Date();
        while (daysWithWorkouts.has(toDay(check))) {
            streak++;
            check.setDate(check.getDate() - 1);
        }

        // Consistency (7 / 30 / 90 days)
        const countActive = (days) => {
            let count = 0;
            for (let i = 0; i < days; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                if (daysWithWorkouts.has(toDay(d))) count++;
            }
            return Math.round((count / days) * 100);
        };
        const consistency7 = countActive(7);
        const consistency30 = countActive(30);
        const consistency90 = countActive(90);

        // PR streak (consecutive workouts with hadPR)
        let prStreak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].hadPR) prStreak++;
            else break;
        }

        // Workouts this month / this year
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const thisMonthCount = history.filter(w => {
            const d = new Date(w.endTime);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length;
        const thisYearCount = history.filter(w => new Date(w.endTime).getFullYear() === thisYear).length;

        // Workouts this week (Mon–Sun)
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        const thisWeekCount = history.filter(w => new Date(w.endTime) >= startOfWeek).length;

        // Average workouts per month / year / week
        const monthSet = new Set(history.map(w => {
            const d = new Date(w.endTime);
            return `${d.getFullYear()}-${d.getMonth()}`;
        }));
        const avgPerMonth = monthSet.size > 0
            ? Math.round((history.length / monthSet.size) * 10) / 10
            : 0;

        const yearSet = new Set(history.map(w => new Date(w.endTime).getFullYear().toString()));
        const avgPerYear = yearSet.size > 0
            ? Math.round((history.length / yearSet.size) * 10) / 10
            : 0;

        const weekSet = new Set(history.map(w => {
            const d = new Date(w.endTime);
            const jan1 = new Date(d.getFullYear(), 0, 1);
            const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
            return `${d.getFullYear()}-W${weekNum}`;
        }));
        const avgPerWeek = weekSet.size > 0
            ? Math.round((history.length / weekSet.size) * 10) / 10
            : 0;

        return { streak, consistency7, consistency30, consistency90, prStreak, thisMonthCount, thisYearCount, thisWeekCount, avgPerMonth, avgPerYear, avgPerWeek };
    }, [history]);

    // Goals summary
    const goalStats = useMemo(() => {
        const active = (goals || []).filter(g => g.status === 'active');
        const completed = (goals || []).filter(g => g.status === 'completed');
        if (active.length === 0) return { activeCount: 0, avgPct: 0, completedCount: completed.length };
        const pcts = active.map(g => {
            const current = getGoalCurrentValue(g);
            const range = g.targetValue - g.initialValue;
            if (range === 0) return 100;
            return Math.min(100, Math.max(0, Math.round(((current - g.initialValue) / range) * 100)));
        });
        const avgPct = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
        return { activeCount: active.length, avgPct, completedCount: completed.length };
    }, [goals, getGoalCurrentValue]);

    // Cardio totals (month / year / week)
    const cardioTotals = useMemo(() => {
        if (!history || history.length === 0) return { month: 0, year: 0, week: 0 };
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // Start of week (Mon)
        const startOfWeek = new Date(now);
        const dow = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - (dow === 0 ? 6 : dow - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        let month = 0, year = 0, week = 0, totalCardio = 0;
        const cardioMonths = new Set();
        const cardioYears = new Set();
        const cardioWeeks = new Set();
        history.forEach(w => {
            const d = new Date(w.endTime);
            let cardioSecs = 0;
            (w.exercises || []).forEach(ex => {
                if (ex.target === 'Cardio') cardioSecs += (ex.accumulatedSeconds || 0);
            });
            if (cardioSecs > 0) {
                totalCardio += cardioSecs;
                if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) month += cardioSecs;
                if (d.getFullYear() === thisYear) year += cardioSecs;
                if (d >= startOfWeek) week += cardioSecs;
                cardioMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
                cardioYears.add(d.getFullYear().toString());
                const jan1 = new Date(d.getFullYear(), 0, 1);
                const wn = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
                cardioWeeks.add(`${d.getFullYear()}-W${wn}`);
            }
        });
        const avgCardioMonth = cardioMonths.size > 0 ? Math.round(totalCardio / cardioMonths.size) : 0;
        const avgCardioYear = cardioYears.size > 0 ? Math.round(totalCardio / cardioYears.size) : 0;
        const avgCardioWeek = cardioWeeks.size > 0 ? Math.round(totalCardio / cardioWeeks.size) : 0;
        return { month, year, week, avgCardioMonth, avgCardioYear, avgCardioWeek };
    }, [history]);

    // ── Data Management ──────────────────────────────────────────────────────
    const handleExport = async () => {
        try {
            const dbData = await getAllData();
            const data = { ...dbData, export_date: new Date().toISOString(), app_version: __APP_VERSION__ };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) { alert('Failed to export: ' + err.message); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.workout_history) throw new Error('Invalid backup file');
                if (confirm('This will OVERWRITE your current data. Are you sure?')) {
                    await importData(data);
                    alert('Import successful! Reloading...');
                    window.location.reload();
                }
            } catch (err) { alert('Failed to import: ' + err.message); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleClear = async () => {
        if (confirm('DANGER: This will delete ALL your workout history. This cannot be undone.\n\nAre you sure?')) {
            if (confirm('Really, truly delete everything?')) {
                await clearData();
                window.location.reload();
            }
        }
    };

    return (
        <div style={{
            padding: 'var(--space-lg)',
            paddingBottom: '120px',
            backgroundColor: 'var(--bg-app)',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <h1 style={{ marginBottom: '2rem' }}>{t('profile', { defaultValue: 'Profile' })}</h1>

            {/* ── Stats Overview ── */}
            {stats && (
                <Section title={t('stats_overview', { defaultValue: 'Stats Overview' })}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {/* Row 1: Day Streak + PR Streak */}
                        <StatCard
                            icon={<Flame size={24} />}
                            value={stats.streak}
                            label={t('day_streak', { defaultValue: 'Day Streak' })}
                            color="#f97316"
                        />
                        <StatCard
                            icon={<TrendingUp size={24} />}
                            value={stats.prStreak}
                            label={t('pr_streak')}
                            color="#eab308"
                        />

                        {/* Row 2: Workouts + Avg */}
                        <StatCard
                            icon={<Calendar size={24} />}
                            value={[stats.thisMonthCount, stats.thisYearCount, stats.thisWeekCount][workoutPeriod]}
                            label={[t('workouts_this_month'), t('workouts_this_year'), t('workouts_this_week', { defaultValue: 'Workouts This Week' })][workoutPeriod]}
                            color="#a855f7"
                            onClick={() => setWorkoutPeriod(p => (p + 1) % 3)}
                        />
                        <StatCard
                            icon={<Dumbbell size={24} />}
                            value={[stats.avgPerMonth, stats.avgPerYear, stats.avgPerWeek][avgPeriod]}
                            label={[t('avg_per_month'), t('avg_per_year', { defaultValue: 'Avg / Year' }), t('avg_per_week', { defaultValue: 'Avg / Week' })][avgPeriod]}
                            color="#ec4899"
                            onClick={() => setAvgPeriod(p => (p + 1) % 3)}
                        />

                        {/* Row 3: Cardio + Avg Cardio */}
                        <StatCard
                            icon={<Timer size={24} />}
                            value={fmtSeconds([cardioTotals.month, cardioTotals.year, cardioTotals.week][cardioPeriod])}
                            label={[t('cardio_this_month', { defaultValue: 'Cardio This Month' }), t('cardio_this_year', { defaultValue: 'Cardio This Year' }), t('cardio_this_week', { defaultValue: 'Cardio This Week' })][cardioPeriod]}
                            color="#22c55e"
                            onClick={() => setCardioPeriod(p => (p + 1) % 3)}
                        />
                        <StatCard
                            icon={<Timer size={24} />}
                            value={fmtSeconds([cardioTotals.avgCardioMonth, cardioTotals.avgCardioYear, cardioTotals.avgCardioWeek][avgCardioPeriod])}
                            label={[t('avg_cardio_month', { defaultValue: 'Avg Cardio / Month' }), t('avg_cardio_year', { defaultValue: 'Avg Cardio / Year' }), t('avg_cardio_week', { defaultValue: 'Avg Cardio / Week' })][avgCardioPeriod]}
                            color="#10b981"
                            onClick={() => setAvgCardioPeriod(p => (p + 1) % 3)}
                        />
                    </div>

                    {/* Row 4: Goals + Consistency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0' }}>
                        <div
                            className="card"
                            onClick={() => navigate('/goals')}
                            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                        >
                            <div style={{ color: '#22c55e' }}><Target size={24} /></div>
                            <span style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: 1 }}>
                                {goalStats.activeCount}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.3 }}>
                                {t('goals', { defaultValue: 'Goals' })}
                            </span>
                        </div>
                        <StatCard
                            icon={<CheckCircle size={24} />}
                            value={`${[stats.consistency7, stats.consistency30, stats.consistency90][consistencyPeriod]}%`}
                            label={[t('consistency_7d', { defaultValue: '7-Day Consistency' }), t('consistency_30d', { defaultValue: '30-Day Consistency' }), t('consistency_90d', { defaultValue: '90-Day Consistency' })][consistencyPeriod]}
                            color="var(--color-primary)"
                            onClick={() => setConsistencyPeriod(p => (p + 1) % 3)}
                        />
                    </div>
                </Section>
            )}

            {/* ── Preferences ── */}
            <Section title={t('preferences', { defaultValue: 'Preferences' })}>
                {/* Weight unit */}
                <SettingRow>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <RefreshCw size={18} color="var(--text-muted)" />
                            <span style={{ fontWeight: '600' }}>{t('units', { defaultValue: 'Weight Unit' })}</span>
                        </div>
                        <button onClick={toggleUnit} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
                            {preferredUnit}
                        </button>
                    </div>
                </SettingRow>

                {/* Language */}
                <SettingRow>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <Globe size={18} color="var(--text-muted)" />
                        <span style={{ fontWeight: '600' }}>{t('language', { defaultValue: 'Language' })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[['en', 'English'], ['es', 'Español']].map(([code, label]) => (
                            <button
                                key={code}
                                onClick={() => i18n.changeLanguage(code)}
                                className={`btn ${i18n.resolvedLanguage === code ? 'btn-primary' : ''}`}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </SettingRow>

                {/* Rest timer */}
                <SettingRow>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600' }}>{t('default_rest_timer', { defaultValue: 'Default Rest Timer' })}</span>
                        <input
                            type="checkbox"
                            checked={restTimer.enabled}
                            disabled={restTimer.seconds <= 0}
                            onChange={(e) => setRestTimer({ ...restTimer, enabled: e.target.checked })}
                            style={{ width: '20px', height: '20px', cursor: restTimer.seconds > 0 ? 'pointer' : 'not-allowed' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="text"
                            inputMode="numeric"
                            className="input"
                            value={Math.floor(restTimer.seconds / 60)}
                            onChange={(e) => {
                                const mins = Math.max(0, parseInt(e.target.value.replace(',', '.')) || 0);
                                setRestTimer({ enabled: mins === 0 ? false : restTimer.enabled, seconds: mins * 60 });
                            }}
                            style={{ flex: 1 }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>{t('minutes', { defaultValue: 'min' })}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                        {t('auto_start_timer', { defaultValue: 'Auto-start rest timer after completing a set' })}
                    </p>
                    {notificationPermission !== 'granted' && 'Notification' in window && (
                        <button
                            onClick={requestNotificationPermission}
                            className="btn"
                            style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                        >
                            {t('enable_notifications', { defaultValue: 'Enable Notifications' })}
                        </button>
                    )}
                </SettingRow>
            </Section>

            {/* ── Theme ── */}
            <Section title={t('theme', { defaultValue: 'Theme' })}>
                <SettingRow>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                            { key: 'dark', label: t('dark', { defaultValue: 'Dark' }), icon: <Moon size={16} /> },
                            { key: 'light', label: t('light', { defaultValue: 'Light' }), icon: <Sun size={16} /> },
                            { key: 'system', label: t('system', { defaultValue: 'System' }), icon: <Monitor size={16} /> }
                        ].map(({ key, label, icon }) => (
                            <button
                                key={key}
                                onClick={() => changeTheme(key)}
                                className={`btn ${theme === key ? 'btn-primary' : ''}`}
                                style={{ flex: 1, justifyContent: 'center', gap: '0.4rem', padding: '0.6rem 0.5rem', fontSize: '0.85rem' }}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </div>
                </SettingRow>
            </Section>

            {/* ── Data Management ── */}
            <Section title={t('data', { defaultValue: 'Data Management' })}>
                <button onClick={handleExport} className="btn" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                    <Upload size={20} />
                    <span>{t('export_data', { defaultValue: 'Export Data' })}</span>
                </button>
                <button onClick={() => fileInputRef.current.click()} className="btn" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                    <Download size={20} />
                    <span>{t('import_data', { defaultValue: 'Import Data' })}</span>
                </button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
                <button onClick={handleClear} className="btn" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <Trash2 size={20} />
                    <span>{t('clear_all_info', { defaultValue: 'Delete All Data' })}</span>
                </button>
            </Section>

            {/* About */}
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.8', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <p style={{ margin: 0 }}>{t('version', { defaultValue: 'Version' })} {__APP_VERSION__}</p>
                <p style={{ margin: 0 }}>{t('updated', { defaultValue: 'Updated' })}: {__BUILD_DATE__}</p>
                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>&copy; Martin Nanni {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}
