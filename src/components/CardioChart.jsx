import React, { useMemo } from 'react';
import '../utils/chartSetup';
import { Bar } from 'react-chartjs-2';

import { useThemeColors } from '../hooks/useThemeColors';

export default function CardioChart({ history, currentMonth, currentYear, disableAnimation }) {
    const { textMuted, borderSubtle } = useThemeColors();
    const chartData = useMemo(() => {
        if (!history) return null;

        // 1. Get days in current month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // 2. Data array for days
        const data = new Array(daysInMonth).fill(0);

        // Filter history for this month
        const monthlyWorkouts = history.filter(w => {
            const d = new Date(w.endTime);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        // Populate Data
        monthlyWorkouts.forEach(w => {
            const dayIndex = new Date(w.endTime).getDate() - 1; // 0-indexed

            w.exercises.forEach(ex => {
                if (ex.target === 'Cardio') {
                    // Add duration in minutes
                    const minutes = (ex.accumulatedSeconds || 0) / 60;
                    data[dayIndex] += minutes;
                }
            });
        });

        // Round to 1 decimal place
        const finalData = data.map(v => Number(v.toFixed(1)));

        // If no data, return null
        if (finalData.every(v => v === 0)) return null;

        return {
            labels,
            datasets: [{
                label: 'Cardio Minutes',
                data: finalData,
                backgroundColor: '#22c55e',
                borderRadius: 4,
            }]
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
                grid: { display: false },
                border: { display: false },
                ticks: { color: textMuted, maxTicksLimit: 10 }
            },
            y: {
                grid: { color: borderSubtle },
                border: { display: false },
                ticks: { color: textMuted } // precision ignored for minutes
            },
        },
    };

    if (!chartData) return null;

    return (
        <div style={{ height: '200px', width: '100%' }}>
            <Bar options={options} data={chartData} />
        </div>
    );
}
