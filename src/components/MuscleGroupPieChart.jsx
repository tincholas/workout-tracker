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
export default function MuscleGroupPieChart({ history }) {
    const { textMuted } = useThemeColors();
    const { t } = useTranslation();

    const getColor = (target) => {
        if (TARGET_COLORS[target]) return TARGET_COLORS[target];
        const hash = target.split('').reduce((acc, c) => c.charCodeAt(0) + acc, 0);
        return `hsl(${hash % 360}, 65%, 55%)`;
    };

    const data = useMemo(() => {
        if (!history || history.length === 0) return null;

        const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000;
        const setsByTarget = {};

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

        const targets = Object.keys(setsByTarget);
        if (targets.length === 0) return null;

        return {
            labels: targets.map(target => t(`muscle_groups.${target}`, { defaultValue: target })),
            datasets: [{
                data: targets.map(target => setsByTarget[target]),
                backgroundColor: targets.map(target => `${getColor(target)}cc`),
                borderColor: targets.map(target => getColor(target)),
                borderWidth: 1.5,
                hoverOffset: 6,
            }],
        };
    }, [history, t]); // eslint-disable-line react-hooks/exhaustive-deps

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                        return ` ${ctx.parsed} sets (${pct}%)`;
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
