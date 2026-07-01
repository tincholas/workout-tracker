import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../store/WorkoutContext';
import '../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { ArrowLeft } from 'lucide-react';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from 'react-i18next';

const KG_TO_LBS = 2.20462;

export default function BodyWeightHistory() {
    const navigate = useNavigate();
    const { weightMoodLog, preferredUnit, goals } = useWorkout();
    const { textMuted, textPrimary, borderSubtle } = useThemeColors();
    const { t } = useTranslation();

    // Date window state (null = show all)
    const [windowSize, setWindowSize] = React.useState(null);
    const [windowOffset, setWindowOffset] = React.useState(0);
    const touchRef = useRef({});

    // --- Build all raw data points from weightMoodLog ---
    const allRawData = useMemo(() => {
        if (!weightMoodLog || weightMoodLog.length === 0) return null;

        const entries = weightMoodLog
            .filter(e => e.weight != null)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (entries.length === 0) return null;

        const unit = preferredUnit === 'LBS' ? 'lbs' : 'kg';

        const firstEntry = entries[0];
        const lastEntry = entries[entries.length - 1];

        const firstDate = new Date(firstEntry.date + 'T00:00:00');
        const lastDate = new Date(lastEntry.date + 'T00:00:00');

        const entriesMap = {};
        entries.forEach(e => {
            entriesMap[e.date] = preferredUnit === 'LBS'
                ? Math.round(e.weight * KG_TO_LBS * 10) / 10
                : Math.round(e.weight * 10) / 10;
        });

        const points = [];
        let current = new Date(firstDate);
        while (current <= lastDate) {
            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            points.push({
                date: dateStr,
                value: entriesMap[dateStr] ?? null
            });
            current.setDate(current.getDate() + 1);
        }

        return { points, unit };
    }, [weightMoodLog, preferredUnit]);

    const totalDates = allRawData?.points?.length ?? 0;

    // --- Apply window and compute rolling average ---
    const chartData = useMemo(() => {
        if (!allRawData) return null;
        const { points, unit } = allRawData;

        const effectiveSize = windowSize ?? points.length;
        const clampedOffset = Math.max(0, Math.min(windowOffset, points.length - effectiveSize));
        const visible = points.slice(clampedOffset, clampedOffset + effectiveSize);

        const labels = visible.map(p => {
            const [, m, d] = p.date.split('-');
            return `${d}/${m}`;
        });
        const rawData = visible.map(p => p.value);

        // 7-day rolling average over calendar days
        const rollingAvg = visible.map(p => {
            const pDate = new Date(p.date + 'T00:00:00');
            const startLimit = new Date(pDate);
            startLimit.setDate(pDate.getDate() - 6);

            const windowPoints = points.filter(pt => {
                if (pt.value === null) return false;
                const ptDate = new Date(pt.date + 'T00:00:00');
                return ptDate >= startLimit && ptDate <= pDate;
            });

            if (windowPoints.length === 0) return null;
            const sum = windowPoints.reduce((acc, pt) => acc + pt.value, 0);
            return Math.round((sum / windowPoints.length) * 10) / 10;
        });

        // Active bodyweight goal target lines
        const goalDatasets = (goals || [])
            .filter(g => g.status === 'active' && g.type === 'bodyweight')
            .map(g => {
                const targetDisplay = preferredUnit === 'LBS'
                    ? Math.round(g.targetValue * KG_TO_LBS * 10) / 10
                    : Math.round(g.targetValue * 10) / 10;
                return {
                    label: `${t('target_value', { defaultValue: 'Target' })} (${targetDisplay} ${unit})`,
                    data: labels.map(() => targetDisplay),
                    borderColor: '#22c55e',
                    backgroundColor: 'transparent',
                    borderDash: [6, 4],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    tension: 0,
                    fill: false,
                    spanGaps: true,
                };
            });

        return {
            labels,
            unit,
            datasets: [
                {
                    label: `${t('weight')} (${unit})`,
                    data: rawData,
                    borderColor: '#a855f7',
                    backgroundColor: '#a855f733',
                    pointBackgroundColor: '#a855f7',
                    pointRadius: rawData.length > 60 ? 2 : 4,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true,
                    spanGaps: true,
                },
                {
                    label: t('rolling_avg_7d', { defaultValue: '7d avg' }),
                    data: rollingAvg,
                    borderColor: '#f97316',
                    backgroundColor: 'transparent',
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 1.5,
                    borderDash: [4, 3],
                    tension: 0.35,
                    fill: false,
                    spanGaps: false,
                },
                ...goalDatasets,
            ],
        };
    }, [allRawData, windowSize, windowOffset, goals, preferredUnit, t]);

    // --- Gesture handlers ---
    const handleChartTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            touchRef.current = {
                mode: 'pinch',
                initialDist: Math.sqrt(dx * dx + dy * dy),
                initialWindowSize: windowSize ?? totalDates,
                initialOffset: windowOffset,
            };
        } else if (e.touches.length === 1 && windowSize !== null) {
            touchRef.current = {
                mode: 'pan',
                startX: e.touches[0].clientX,
                initialOffset: windowOffset,
            };
        }
    };

    const handleChartTouchMove = (e) => {
        const ref = touchRef.current;
        if (ref.mode === 'pinch' && e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scale = ref.initialDist / dist;
            const newSize = Math.max(2, Math.min(totalDates, Math.round(ref.initialWindowSize * scale)));
            const isFullView = newSize >= totalDates;
            setWindowSize(isFullView ? null : newSize);
            if (!isFullView) {
                setWindowOffset(prev => Math.max(0, Math.min(totalDates - newSize, prev)));
            } else {
                setWindowOffset(0);
            }
        } else if (ref.mode === 'pan' && e.touches.length === 1 && windowSize !== null) {
            const deltaX = e.touches[0].clientX - ref.startX;
            const datesPerPx = windowSize / 250;
            const dateDelta = -Math.round(deltaX * datesPerPx);
            const newOffset = Math.max(0, Math.min(totalDates - windowSize, ref.initialOffset + dateDelta));
            setWindowOffset(newOffset);
        }
    };

    const handleChartTouchEnd = () => { touchRef.current = {}; };

    // --- Y-axis bounds — computed from the FULL dataset so the axis stays
    //     fixed when the user pans or zooms. Goal targets are included so
    //     they remain visible regardless of the current window.
    const yBinding = useMemo(() => {
        if (!allRawData) return {};
        const rawVals = allRawData.points.map(p => p.value).filter(v => v !== null);
        if (rawVals.length === 0) return {};
        // Also include any active bodyweight goal target values
        const goalVals = (goals || [])
            .filter(g => g.status === 'active' && g.type === 'bodyweight')
            .map(g => preferredUnit === 'LBS'
                ? Math.round(g.targetValue * KG_TO_LBS * 10) / 10
                : Math.round(g.targetValue * 10) / 10);
        const allVals = [...rawVals, ...goalVals];
        const minVal = Math.min(...allVals);
        const maxVal = Math.max(...allVals);
        const pad = Math.max((maxVal - minVal) * 0.4, 2);
        return { min: Math.floor(minVal - pad), max: Math.ceil(maxVal + pad) };
    }, [allRawData, goals, preferredUnit]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: textMuted,
                    boxWidth: 12,
                    filter: item => item.datasetIndex !== 0, // hide raw data series; show avg + goal lines
                },
            },
            title: {
                display: true,
                text: t('body_weight', { defaultValue: 'Body Weight' }),
                color: textPrimary,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.parsed.y;
                        if (val === null || val === undefined) return '';
                        return `${ctx.dataset.label}: ${val} ${chartData?.unit ?? ''}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: textMuted, maxTicksLimit: 10 },
            },
            y: {
                grid: { color: borderSubtle },
                border: { display: false },
                ticks: {
                    color: textMuted,
                    callback: (v) => `${v} ${chartData?.unit ?? ''}`,
                },
                ...(yBinding.min !== undefined && { min: yBinding.min }),
                ...(yBinding.max !== undefined && { max: yBinding.max }),
            },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    return (
        <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
            <button
                className="btn"
                style={{ marginBottom: '1rem', padding: '0.5rem' }}
                onClick={() => navigate('/history')}
            >
                <ArrowLeft size={16} /> {t('back')}
            </button>

            <h1 style={{ marginBottom: 'var(--space-lg)' }}>
                {t('body_weight', { defaultValue: 'Body Weight' })}
                <span style={{ fontSize: '0.5em', color: 'var(--text-muted)', marginLeft: '0.5em' }}>
                    {t('progression', { defaultValue: 'Progression' })}
                </span>
            </h1>

            <div
                className="card"
                style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'pan-y' }}
                onTouchStart={handleChartTouchStart}
                onTouchMove={handleChartTouchMove}
                onTouchEnd={handleChartTouchEnd}
            >
                {chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>{t('no_data_recorded')}</p>
                )}
            </div>

            {chartData && (
                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {windowSize
                        ? `${windowSize} of ${totalDates} entries · drag to pan`
                        : 'Pinch to zoom · drag to pan'}
                </p>
            )}
        </div>
    );
}
