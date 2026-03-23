export function calculateEffectiveWeight(enteredWeight, isBodyweightExercise, userWeightSnapshot) {
    if (!isBodyweightExercise) return Number(enteredWeight || 0);
    
    // Fallback to 80kg in case of any bad data or if the user has never logged weight
    const bw = (userWeightSnapshot && userWeightSnapshot > 0) ? userWeightSnapshot : 80; 
    
    // Round to nearest 20 to smooth out daily fluctuations
    const roundedBodyweight = Math.round(bw / 20) * 20;
    
    // Effective weight = half of rounded bodyweight + whatever extra weight was entered
    return (roundedBodyweight / 2) + Number(enteredWeight || 0);
}
