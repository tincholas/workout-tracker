import React, { useMemo } from 'react';
import '../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from 'react-i18next';
import { useWorkout } from '../store/WorkoutContext';

const KG_TO_LBS = 2.20462;

export default function WeightChart({ currentMonth, currentYear, disableAnimation }) {
    const { weightMoodLog, preferredUnit } = useWorkout();
    const { textMuted, borderSubtle } = useThemeColors();
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        if (!weightMoodLog || weightMoodLog.length === 0) return null;

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Filter entries to this month
        const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const entries = weightMoodLog
            .filter(e => e.date.startsWith(monthPrefix))
            .sort((a, b) => a.date.localeCompare(b.date));

        if (entries.length === 0) return null;

        // Build sparse point array — null for days with no entry
        const dataPoints = new Array(daysInMonth).fill(null);
        entries.forEach(e => {
            const day = parseInt(e.date.slice(8), 10); // YYYY-MM-DD, day part
            const kgVal = e.weight;
            const display = preferredUnit === 'LBS'
                ? Math.round(kgVal * KG_TO_LBS * 10) / 10
                : Math.round(kgVal * 10) / 10;
            dataPoints[day - 1] = display;
        });

        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const unit = preferredUnit === 'LBS' ? 'lbs' : 'kg';

        // Gradient colour for the line
        const color = '#a855f7'; // purple — matches the theme's primary on light, distinct on dark

        return { labels, dataPoints, unit, color };
    }, [weightMoodLog, currentMonth, currentYear, preferredUnit]);

    const { textMuted: _tm, borderSubtle: _bs, ..._ } = { textMuted, borderSubtle };

    if (!chartData) return null;

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: `${t('weight')} (${chartData.unit})`,
                data: chartData.dataPoints,
                borderColor: chartData.color,
                backgroundColor: chartData.color + '33', // 20% opacity fill
                pointBackgroundColor: chartData.color,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: true,
                spanGaps: true, // connect across days with no data
            }
        ]
    };

    // Determine y-axis min/max with a bit of padding
    const definedValues = chartData.dataPoints.filter(v => v !== null);
    if (definedValues.length === 0) return null;
    const minVal = Math.min(...definedValues);
    const maxVal = Math.max(...definedValues);
    const pad = Math.max((maxVal - minVal) * 0.4, 2);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: disableAnimation ? 0 : 800 },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.parsed.y} ${chartData.unit}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: textMuted, maxTicksLimit: 10 }
            },
            y: {
                grid: { color: borderSubtle },
                border: { display: false },
                min: Math.floor(minVal - pad),
                max: Math.ceil(maxVal + pad),
                ticks: {
                    color: textMuted,
                    callback: (v) => `${v} ${chartData.unit}`
                }
            }
        }
    };

    return (
        <div style={{ height: '200px', width: '100%' }}>
            <Line options={options} data={data} />
        </div>
    );
}
