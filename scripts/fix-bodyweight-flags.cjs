/**
 * Fix corrupted bodyweight flags in the workout backup JSON.
 * 
 * "Decline Sit-ups" and "Lying Leg Raise" are bodyweight exercises.
 * Due to the startWorkout bug, some history entries had bodyweight: false.
 * This script corrects them all to bodyweight: true.
 * 
 * It also recalculates the hadPR flag for affected workouts since the
 * volume calculations change when bodyweight is correctly applied.
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'src', 'workout-tracker-backup-2026-07-06.json');
const OUTPUT = path.join(__dirname, '..', 'src', 'workout-tracker-backup-2026-07-06.json'); // overwrite in place

const BODYWEIGHT_EXERCISES = ['Decline Sit-ups', 'Lying Leg Raise'];

function calculateEffectiveWeight(enteredWeight, isBodyweightExercise, userWeightSnapshot) {
    if (!isBodyweightExercise) return Number(enteredWeight || 0);
    const bw = (userWeightSnapshot && userWeightSnapshot > 0) ? userWeightSnapshot : 80;
    const roundedBodyweight = Math.round(bw / 20) * 20;
    return (roundedBodyweight / 2) + Number(enteredWeight || 0);
}

const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
const history = data.workout_history;

let fixedExercises = 0;
let recalculatedWorkouts = 0;

// Step 1: Fix all bodyweight flags
history.forEach(workout => {
    workout.exercises.forEach(ex => {
        if (BODYWEIGHT_EXERCISES.includes(ex.name) && ex.bodyweight !== true) {
            console.log(`  FIX: "${ex.name}" in workout ${workout.endTime?.slice(0, 10)} — bodyweight: ${ex.bodyweight} → true`);
            ex.bodyweight = true;
            fixedExercises++;
        }
    });
});

// Step 2: Recalculate personalRecords and exercisePRs from scratch (same logic as usePersonalRecords.js)
// Then recompute hadPR for every workout.

// Sort chronologically
const sortedHistory = [...history].sort(
    (a, b) => new Date(a.endTime) - new Date(b.endTime)
);

// Build set-level PRs up to each workout
function recalcHadPR() {
    const setRecords = {};   // { [exName]: { volume, weight } }
    const exRecords = {};    // { [exName]: { totalVolume } }

    for (const workout of sortedHistory) {
        if (!workout.exercises) continue;

        let hadPR = false;

        for (const ex of workout.exercises) {
            // --- Set-level PR check ---
            if (ex.target !== 'Cardio' && ex.sets) {
                const historicalBestVol = setRecords[ex.name]?.volume || 0;
                const historicalBestWeight = setRecords[ex.name]?.weight || 0;

                for (const s of ex.sets) {
                    if (s.completed && s.weight >= 0 && Number(s.reps) > 0) {
                        const mult = s.unilateral ? 2 : 1;
                        const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, workout.bodyWeightSnapshot);
                        const vol = effectiveWeight * Number(s.reps) * mult;

                        const isNewPR = vol > historicalBestVol ||
                            (vol === historicalBestVol && s.weight > historicalBestWeight);

                        if (isNewPR) {
                            hadPR = true;
                        }
                    }
                }
            }

            // --- Exercise-level PR check ---
            if (ex.target !== 'Cardio' && ex.sets) {
                const totalVol = ex.sets.reduce((sum, s) => {
                    const mult = s.unilateral ? 2 : 1;
                    const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, workout.bodyWeightSnapshot);
                    return sum + (s.completed ? effectiveWeight * Number(s.reps || 0) * mult : 0);
                }, 0);

                const historicalTotalBest = exRecords[ex.name]?.totalVolume || 0;
                if (totalVol > 0 && totalVol > historicalTotalBest) {
                    hadPR = true;
                }
            }

            // --- Cardio PR check ---
            if (ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                const historicalCardio = setRecords[ex.name]?.volume || 0;
                if (ex.accumulatedSeconds > historicalCardio) {
                    hadPR = true;
                }
            }
        }

        // Now update the records AFTER checking (so we compare against prior history)
        for (const ex of workout.exercises) {
            if (ex.target === 'Cardio' && ex.accumulatedSeconds > 0) {
                const existing = setRecords[ex.name] || { volume: 0 };
                if (ex.accumulatedSeconds > existing.volume) {
                    setRecords[ex.name] = {
                        volume: ex.accumulatedSeconds,
                        weight: 0,
                        isCardio: true
                    };
                }
            } else if (ex.sets) {
                // Update set-level records
                for (const s of ex.sets) {
                    if (s.completed && s.weight >= 0 && Number(s.reps) > 0) {
                        const mult = s.unilateral ? 2 : 1;
                        const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, workout.bodyWeightSnapshot);
                        const vol = effectiveWeight * Number(s.reps) * mult;
                        const existing = setRecords[ex.name] || { volume: 0, weight: 0 };
                        const isNewPR = vol > existing.volume ||
                            (vol === existing.volume && s.weight > (existing.weight || 0));
                        if (isNewPR) {
                            setRecords[ex.name] = { volume: vol, weight: s.weight };
                        }
                    }
                }

                // Update exercise-level records
                const totalVol = ex.sets.reduce((sum, s) => {
                    const mult = s.unilateral ? 2 : 1;
                    const effectiveWeight = calculateEffectiveWeight(s.weight, ex.bodyweight, workout.bodyWeightSnapshot);
                    return sum + (s.completed ? effectiveWeight * Number(s.reps || 0) * mult : 0);
                }, 0);
                if (totalVol > 0) {
                    const existing = exRecords[ex.name] || { totalVolume: 0 };
                    if (totalVol > existing.totalVolume) {
                        exRecords[ex.name] = { totalVolume: totalVol };
                    }
                }
            }
        }

        // Update hadPR if it changed
        const oldHadPR = workout.hadPR;
        if (oldHadPR !== hadPR) {
            console.log(`  RECALC hadPR: workout ${workout.endTime?.slice(0, 10)} — ${oldHadPR} → ${hadPR}`);
            workout.hadPR = hadPR;
            recalculatedWorkouts++;
        }
    }
}

recalcHadPR();

// Write the corrected data back
fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), 'utf-8');

console.log(`\nDone!`);
console.log(`  Fixed ${fixedExercises} exercise entries (bodyweight flag)`);
console.log(`  Recalculated hadPR on ${recalculatedWorkouts} workouts`);
console.log(`  Output: ${OUTPUT}`);
