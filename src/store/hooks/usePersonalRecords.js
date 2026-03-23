import { useMemo } from 'react';
import { calculateEffectiveWeight } from '../../utils/volumeCalc';

/**
 * Calculate Personal Records from workout history
 * 
 * @param {Array} history - Array of completed workouts
 * @returns {Object} { personalRecords, exercisePRs }
 * 
 * personalRecords: Set-level PRs { [exName]: { volume, setId, date, isCardio } }
 * exercisePRs: Exercise-level PRs { [exName]: { totalVolume, workoutId, date } }
 */
export const usePersonalRecords = (history) => {
    // Set-level PRs (max volume per single set)
    const personalRecords = useMemo(() => {
        const records = {};

        // Sort chronologically for "first-to-achieve" rule
        const sortedHistory = [...(history || [])].sort(
            (a, b) => new Date(a.endTime) - new Date(b.endTime)
        );

        sortedHistory.forEach(workout => {
            if (!workout.exercises) return;
            workout.exercises.forEach(ex => {
                // Cardio PR Logic (Duration)
                if (ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                    const duration = ex.accumulatedSeconds;
                    const existing = records[ex.name] || { volume: 0, setId: null };

                    if (duration > existing.volume) {
                        records[ex.name] = {
                            volume: duration,
                            setId: ex.id,
                            date: workout.endTime,
                            isCardio: true
                        };
                    }
                }
                // Strength PR Logic (Max Volume per Set)
                else if (ex.sets) {
                    ex.sets.forEach(s => {
                        if (s.completed && s.weight >= 0 && s.reps > 0) {
                            const mult = s.unilateral ? 2 : 1;
                            const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, workout.bodyWeightSnapshot);
                            const vol = effectiveWeight * s.reps * mult;
                            const existing = records[ex.name] || { volume: 0, weight: 0, setId: null };

                            const isNewPR = vol > existing.volume ||
                                (vol === existing.volume && s.weight > (existing.weight || 0));

                            if (isNewPR) {
                                records[ex.name] = {
                                    volume: vol,
                                    weight: s.weight,
                                    setId: s.id,
                                    date: workout.endTime,
                                    isCardio: false
                                };
                            }
                        }
                    });
                }
            });
        });
        return records;
    }, [history]);

    // Exercise-level PRs (total volume across all sets in one workout)
    const exercisePRs = useMemo(() => {
        const records = {};

        const sortedHistory = [...(history || [])].sort(
            (a, b) => new Date(a.endTime) - new Date(b.endTime)
        );

        sortedHistory.forEach(workout => {
            workout.exercises?.forEach(ex => {
                if (ex.target === 'Cardio') return;

                const totalVol = ex.sets?.reduce((sum, s) => {
                    const mult = s.unilateral ? 2 : 1;
                    const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, workout.bodyWeightSnapshot);
                    return sum + (s.completed ? effectiveWeight * s.reps * mult : 0);
                }, 0) || 0;

                if (totalVol === 0) return;

                const existing = records[ex.name] || { totalVolume: 0 };

                if (totalVol > existing.totalVolume) {
                    records[ex.name] = {
                        totalVolume: totalVol,
                        workoutId: workout.id,
                        date: workout.endTime
                    };
                }
            });
        });

        return records;
    }, [history]);

    return { personalRecords, exercisePRs };
};
