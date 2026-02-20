import React, { useMemo } from 'react';
import '../utils/chartSetup';
import { Bar } from 'react-chartjs-2';
import { TARGET_COLORS } from '../store/models';

import { useThemeColors } from '../hooks/useThemeColors';

export default function VolumeChart({ history, currentMonth, currentYear, disableAnimation }) {
    const { textMuted, borderSubtle } = useThemeColors();
    const chartData = useMemo(() => {
        if (!history) return null;

        // 1. Get days in current month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // 2. Initialize datasets map (Target -> [Day1, Day2...])
        // We need a dataset for each unique target found in this month's history
        const targetDataMap = {}; // { 'Chest': [0, 4, 0...], 'Back': [0, 0, 5...] }

        // Filter history for this month
        const monthlyWorkouts = history.filter(w => {
            const d = new Date(w.endTime);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        // Populate Data
        monthlyWorkouts.forEach(w => {
            const dayIndex = new Date(w.endTime).getDate() - 1; // 0-indexed

            w.exercises.forEach(ex => {
                const target = ex.target || 'Other';
                if (target === 'Cardio') return; // Exclude Cardio from sets chart

                if (!targetDataMap[target]) {
                    targetDataMap[target] = new Array(daysInMonth).fill(0);
                }

                // Calculate Total Reps (not volume)
                const totalReps = ex.sets.reduce((acc, s) => {
                    if (s.completed) {
                        return acc + (Number(s.reps) || 0);
                    }
                    return acc;
                }, 0);

                targetDataMap[target][dayIndex] += totalReps;
            });
        });

        const getColor = (target) => {
            if (TARGET_COLORS[target]) return TARGET_COLORS[target];

            // Fallback for unknown
            const hash = target.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
            return `hsl(${hash % 360}, 70%, 50%)`;
        };

        const datasets = Object.keys(targetDataMap).map(target => ({
            label: target,
            data: targetDataMap[target],
            backgroundColor: getColor(target),
            borderRadius: 4, // Add border radius for consistency with Cardio chart
        }));

        return {
            labels,
            datasets
        };
    }, [history, currentMonth, currentYear]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: disableAnimation ? 0 : 1000
        },
        plugins: {
            legend: { position: 'bottom', labels: { color: textMuted, boxWidth: 12 } },
            title: { display: false },
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                border: { display: false },
                ticks: { color: textMuted, maxTicksLimit: 10 }
            },
            y: {
                stacked: true,
                grid: { color: borderSubtle },
                border: { display: false },
                ticks: { color: textMuted, precision: 0 }
            },
        },
    };

    if (!chartData || chartData.datasets.length === 0) return null;

    return (
        <div style={{ height: '200px', width: '100%' }}>
            <Bar options={options} data={chartData} />
        </div>
    );
}
