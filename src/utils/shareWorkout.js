import { trackEvent } from './analytics';
import { fmtSeconds } from './formatTime';

export const shareWorkout = async (workout, personalRecords = {}, exercisePRs = {}, completedGoals = []) => {
    const date = new Date(workout.endTime).toLocaleDateString();
    let text = `🏋️ ${workout.name} (${date})\n\n`;

    workout.exercises.filter(ex => ex.target === 'Cardio' ? (ex.accumulatedSeconds || 0) > 0 : ex.sets.some(s => s.completed)).forEach(ex => {
        // Check for exercise-level PR (total volume)
        const hasExercisePR = exercisePRs[ex.name]?.workoutId === workout.id && ex.target !== 'Cardio';

        text += `🔹 ${ex.name}${hasExercisePR ? ' 🏆' : ''}`;

        if (ex.target === 'Cardio') {
            const duration = fmtSeconds(ex.accumulatedSeconds || 0);
            const prRecord = personalRecords[ex.name];
            const isPR = prRecord && prRecord.setId === ex.id;
            text += `: ${duration}${isPR ? ' 🏆' : ''}\n`;
        } else {
            text += `\n`;
            const completedSets = ex.sets.filter(s => s.completed);

            // Find set-level PR
            const prRecord = personalRecords[ex.name]; // { volume, setId }

            if (completedSets.length > 0) {
                completedSets.forEach((s) => {
                    const isPR = prRecord && prRecord.setId === s.id;
                    text += `   • ${s.weight}kg x ${s.reps}${isPR ? ' 🏆' : ''}\n`;
                });
            } else {
                text += `   (No completed sets)\n`;
            }
        }
        text += `\n`;
    });

    if (completedGoals.length > 0) {
        text += `🎯 Goal${completedGoals.length > 1 ? 's' : ''} Completed!\n`;
        completedGoals.forEach(g => {
            const fmt = (v) => g.isCardio ? fmtSeconds(v) : `${v} kg`;
            const days = Math.max(0, Math.floor((new Date() - new Date(g.createdAt)) / 86400000));
            text += `   • ${g.exerciseName}: ${fmt(g.targetValue)} (after ${days} days)\n`;
        });
        text += `\n`;
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: `${workout.name} Workout`,
                text: text,
            });
            trackEvent('workout_shared', { method: 'native' });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback
        try {
            await navigator.clipboard.writeText(text);
            trackEvent('workout_shared', { method: 'clipboard' });
            alert('Workout summary copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
};
