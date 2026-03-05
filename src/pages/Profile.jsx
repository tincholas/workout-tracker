import React, { useMemo, useRef } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { getAllData, importData, clearData } from '../store/db';
import {
    Flame, CheckCircle, Calendar, TrendingUp, BarChart2,
    Download, Upload, Trash2, RefreshCw, Globe, Sun, Moon,
    Dumbbell, Monitor, Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

function StatCard({ icon, value, label, color = 'var(--color-primary)' }) {
    return (
        <div className="card" style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem'
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

        // 7-day consistency
        let active7 = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            if (daysWithWorkouts.has(toDay(d))) active7++;
        }
        const consistency = Math.round((active7 / 7) * 100);

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

        // Average workouts per month (over all recorded months)
        const monthSet = new Set(history.map(w => {
            const d = new Date(w.endTime);
            return `${d.getFullYear()}-${d.getMonth()}`;
        }));
        const avgPerMonth = monthSet.size > 0
            ? Math.round((history.length / monthSet.size) * 10) / 10
            : 0;

        return { streak, consistency, prStreak, thisMonthCount, thisYearCount, avgPerMonth };
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
                        <StatCard
                            icon={<Flame size={24} />}
                            value={stats.streak}
                            label={t('day_streak', { defaultValue: 'Day Streak' })}
                            color="#f97316"
                        />
                        <StatCard
                            icon={<CheckCircle size={24} />}
                            value={`${stats.consistency}%`}
                            label={t('consistency_7d', { defaultValue: '7-Day Consistency' })}
                            color="var(--color-primary)"
                        />
                        <StatCard
                            icon={<TrendingUp size={24} />}
                            value={stats.prStreak}
                            label={t('pr_streak')}
                            color="#eab308"
                        />
                        <StatCard
                            icon={<Calendar size={24} />}
                            value={stats.thisMonthCount}
                            label={t('workouts_this_month')}
                            color="#a855f7"
                        />
                        <StatCard
                            icon={<BarChart2 size={24} />}
                            value={stats.thisYearCount}
                            label={t('workouts_this_year')}
                            color="#22c55e"
                        />
                        <StatCard
                            icon={<Dumbbell size={24} />}
                            value={stats.avgPerMonth}
                            label={t('avg_per_month')}
                            color="#ec4899"
                        />
                    </div>

                    {/* Goals sub-row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0' }}>
                        <div
                            className="card"
                            onClick={() => navigate('/goals')}
                            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                        >
                            <div style={{ color: '#22c55e' }}><Target size={24} /></div>
                            <span style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>
                                {goalStats.activeCount}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.3 }}>
                                {t('active_goals')}
                            </span>
                        </div>
                        <div
                            className="card"
                            onClick={() => navigate('/goals')}
                            style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                        >
                            <div style={{ color: '#eab308' }}><CheckCircle size={24} /></div>
                            <span style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>{goalStats.completedCount}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.3 }}>
                                {t('completed_goals')}
                            </span>
                        </div>
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
                            type="number"
                            className="input"
                            value={Math.floor(restTimer.seconds / 60)}
                            onChange={(e) => {
                                const mins = Math.max(0, parseInt(e.target.value) || 0);
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
