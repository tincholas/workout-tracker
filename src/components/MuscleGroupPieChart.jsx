import React, { useMemo } from 'react';
import '../utils/chartSetup';
import { Pie } from 'react-chartjs-2';
import { TARGET_COLORS } from '../store/models';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from 'react-i18next';

/**
 * Pie chart showing completed sets per muscle group over the past 28 days.
 * Cardio exercises are excluded.
 */
export default function MuscleGroupPieChart({ history, currentMonth, currentYear }) {
    const { textMuted } = useThemeColors();
    const { t } = useTranslation();

    const getColor = (target) => {
        if (TARGET_COLORS[target]) return TARGET_COLORS[target];
        const hash = target.split('').reduce((acc, c) => c.charCodeAt(0) + acc, 0);
        return `hsl(${hash % 360}, 65%, 55%)`;
    };

    const data = useMemo(() => {
        if (!history || history.length === 0) return null;

        const now = new Date();
        const checkMonth = currentMonth !== undefined ? currentMonth : now.getMonth();
        const checkYear = currentYear !== undefined ? currentYear : now.getFullYear();
        const isCurrentMonth = checkMonth === now.getMonth() && checkYear === now.getFullYear();

        const setsByTarget = {};
        let weeksDivider = 4;

        if (isCurrentMonth) {
            const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
            history.forEach(workout => {
                if (new Date(workout.endTime).getTime() < cutoff) return;

                (workout.exercises || []).forEach(ex => {
                    if (ex.target === 'Cardio') return;
                    const target = ex.target || 'Other';
                    const completedSets = (ex.sets || []).filter(s => s.completed).length;
                    if (completedSets === 0) return;
                    setsByTarget[target] = (setsByTarget[target] || 0) + completedSets;
                });
            });
        } else {
            const daysInMonth = new Date(checkYear, checkMonth + 1, 0).getDate();
            weeksDivider = daysInMonth / 7;

            history.forEach(workout => {
                const d = new Date(workout.endTime);
                if (d.getMonth() !== checkMonth || d.getFullYear() !== checkYear) return;

                (workout.exercises || []).forEach(ex => {
                    if (ex.target === 'Cardio') return;
                    const target = ex.target || 'Other';
                    const completedSets = (ex.sets || []).filter(s => s.completed).length;
                    if (completedSets === 0) return;
                    setsByTarget[target] = (setsByTarget[target] || 0) + completedSets;
                });
            });
        }

        const targets = Object.keys(setsByTarget);
        if (targets.length === 0) return null;

        return {
            labels: targets.map(target => t(`muscle_groups.${target}`, { defaultValue: target })),
            datasets: [{
                data: targets.map(target => Math.round((setsByTarget[target] / weeksDivider) * 10) / 10),
                backgroundColor: targets.map(target => `${getColor(target)}cc`),
                borderColor: targets.map(target => getColor(target)),
                borderWidth: 1.5,
                hoverOffset: 6,
            }],
        };
    }, [history, currentMonth, currentYear, t]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: textMuted,
                    boxWidth: 12,
                    padding: 12,
                    font: { size: 12 },
                },
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                        return ` ${ctx.parsed} sets/wk (${pct}%)`;
                    },
                },
            },
        },
    };

    if (!data) return null;

    return (
        <div style={{ height: '200px', width: '100%' }}>
            <Pie data={data} options={options} />
        </div>
    );
}
