import React, { useMemo } from 'react';
import '../utils/chartSetup';
import { Line } from 'react-chartjs-2';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from 'react-i18next';
import { useWorkout } from '../store/WorkoutContext';

const KG_TO_LBS = 2.20462;

export default function WeightChart({ currentMonth, currentYear, disableAnimation }) {
    const { weightMoodLog, preferredUnit, goals } = useWorkout();
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

    // Dashed horizontal target line for each active bodyweight goal
    const goalLines = useMemo(() => {
        if (!goals || !chartData) return [];
        return goals
            .filter(g => g.status === 'active' && g.type === 'bodyweight')
            .map(g => {
                const targetDisplay = preferredUnit === 'LBS'
                    ? Math.round(g.targetValue * KG_TO_LBS * 10) / 10
                    : Math.round(g.targetValue * 10) / 10;
                return {
                    label: `${t('target_value', { defaultValue: 'Target' })} (${targetDisplay} ${chartData.unit})`,
                    data: chartData.labels.map(() => targetDisplay),
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
    }, [goals, chartData, preferredUnit, t]);

    if (!chartData) return null;

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: `${t('weight')} (${chartData.unit})`,
                data: chartData.dataPoints,
                borderColor: chartData.color,
                backgroundColor: chartData.color + '33',
                pointBackgroundColor: chartData.color,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: true,
                spanGaps: true,
            },
            ...goalLines
        ]
    };

    // Determine y-axis min/max with a bit of padding
    const definedValues = chartData.dataPoints.filter(v => v !== null);
    if (definedValues.length === 0) return null;
    const minVal = Math.min(...definedValues);
    const maxVal = Math.max(...definedValues);
    // Include goal target values in the y-axis range
    const goalTargets = goalLines.map(gl => gl.data[0]).filter(v => v != null);
    const allValues = [...definedValues, ...goalTargets];
    const pad = Math.max((Math.max(...allValues) - Math.min(...allValues)) * 0.4, 2);
    const minY = Math.min(...allValues);
    const maxY = Math.max(...allValues);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: disableAnimation ? 0 : 800 },
        plugins: {
            legend: { display: goalLines.length > 0, labels: { color: textMuted, boxWidth: 12, filter: item => item.datasetIndex > 0 } },
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
                min: Math.floor(minY - pad),
                max: Math.ceil(maxY + pad),
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
