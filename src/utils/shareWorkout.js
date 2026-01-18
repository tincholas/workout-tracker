export const shareWorkout = async (workout, personalRecords = {}) => {
    const date = new Date(workout.endTime).toLocaleDateString();
    let text = `🏋️ ${workout.name} (${date})\n\n`;

    workout.exercises.forEach(ex => {
        text += `🔹 ${ex.name}`;

        if (ex.target === 'Cardio') {
            const mins = ((ex.accumulatedSeconds || 0) / 60).toFixed(1);
            text += `: ${mins} mins\n`;
        } else {
            text += `\n`;
            const completedSets = ex.sets.filter(s => s.completed);

            // Find Share PR (Max Vol Set)
            const prRecord = personalRecords[ex.name]; // { volume, setId }

            if (completedSets.length > 0) {
                completedSets.forEach((s, i) => {
                    const isPR = prRecord && prRecord.setId === s.id;
                    text += `   • ${s.weight}kg x ${s.reps}${isPR ? ' 🏆' : ''}\n`;
                });
            } else {
                text += `   (No completed sets)\n`;
            }
        }
        text += `\n`;
    });

    if (navigator.share) {
        try {
            await navigator.share({
                title: `${workout.name} Workout`,
                text: text,
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback
        try {
            await navigator.clipboard.writeText(text);
            alert('Workout summary copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
};
