import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SPLIT_COLORS } from '../store/models';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function VolumeChart({ history, currentMonth, currentYear }) {
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

                // Calculate Volume (Weight * Reps)
                const volume = ex.sets.reduce((acc, s) => {
                    if (s.completed) {
                        return acc + ((Number(s.weight) || 0) * (Number(s.reps) || 0));
                    }
                    return acc;
                }, 0);

                targetDataMap[target][dayIndex] += volume;
            });
        });

        // Color Mapping Helper
        const MUSCLE_COLOR_MAP = {
            'Chest': '#ef4444', // Red
            'Triceps': '#f87171', // Light Red
            'Back': '#3b82f6', // Blue
            'Biceps': '#60a5fa', // Light Blue
            'Shoulders': '#eab308', // Yellow
            'Legs': '#22c55e', // Green
            'Core': '#a855f7', // Purple
            'Other': '#64748b', // Slate
            'Custom': '#64748b', // Slate
        };

        const getColor = (target) => {
            if (MUSCLE_COLOR_MAP[target]) return MUSCLE_COLOR_MAP[target];

            // Fallback for unknown
            const hash = target.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
            return `hsl(${hash % 360}, 70%, 50%)`;
        };

        const datasets = Object.keys(targetDataMap).map(target => ({
            label: target,
            data: targetDataMap[target],
            backgroundColor: getColor(target),
            borderColor: '#000',
            borderWidth: 1,
        }));

        return {
            labels,
            datasets
        };
    }, [history, currentMonth, currentYear]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#a3a3a3', boxWidth: 12 } },
            title: { display: false },
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#a3a3a3', maxTicksLimit: 10 }
            },
            y: {
                stacked: true,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#a3a3a3', precision: 0 }
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
