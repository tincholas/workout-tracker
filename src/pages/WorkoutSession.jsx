import React, { useState } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import ExercisePickerModal from '../components/ExercisePickerModal';
import RestTimerModal from '../components/RestTimerModal';
import { Plus, Save, X } from 'lucide-react';

export default function WorkoutSession() {
    const { activeWorkout, completeWorkout, cancelWorkout, addExercise, swapExercise, restTimer } = useWorkout();
    const navigate = useNavigate();

    // Modal State
    const [pickerMode, setPickerMode] = useState(null); // 'ADD' or 'SWAP'
    const [swapTargetId, setSwapTargetId] = useState(null);
    const [showRestTimer, setShowRestTimer] = useState(false);

    if (!activeWorkout) {
        return (
            <div style={{ padding: 'var(--space-md)', textAlign: 'center', marginTop: '50px' }}>
                <h2>No Active Workout</h2>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
            </div>
        );
    }

    const handleFinish = () => {
        if (confirm('Finish this workout?')) {
            completeWorkout();
            navigate('/');
        }
    };

    const handleSetComplete = () => {
        if (restTimer.enabled && restTimer.seconds > 0) {
            setShowRestTimer(true);
        }
    };

    const openSwap = (id) => {
        setSwapTargetId(id);
        setPickerMode('SWAP');
    };

    const handleSelectExercise = (name) => {
        if (pickerMode === 'ADD') {
            addExercise(name);
        } else if (pickerMode === 'SWAP' && swapTargetId) {
            swapExercise(swapTargetId, name);
        }
        setPickerMode(null);
        setSwapTargetId(null);
    };

    return (
        <div style={{ padding: 'var(--space-md)', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{activeWorkout.name}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }} onClick={() => { if (confirm('Cancel workout?')) { cancelWorkout(); navigate('/'); } }}>
                        <X size={20} />
                    </button>

                </div>
            </div>

            {/* Exercises */}
            {activeWorkout.exercises.map(ex => (
                <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onSwap={(id) => openSwap(id)}
                    onSetComplete={handleSetComplete}
                />
            ))}

            {/* Add Exercise Button */}
            <button
                className="btn"
                style={{ width: '100%', borderStyle: 'dashed', marginTop: '1rem', padding: '1rem' }}
                onClick={() => setPickerMode('ADD')}
            >
                <Plus size={20} /> Add Exercise
            </button>

            {/* Finish Button */}
            <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleFinish}
            >
                <Save size={20} style={{ marginRight: '0.5rem' }} /> Finish Workout
            </button>

            {/* Picker Modal */}
            {pickerMode && (
                <ExercisePickerModal
                    onClose={() => setPickerMode(null)}
                    onSelect={handleSelectExercise}
                />
            )}

            {showRestTimer && (
                <RestTimerModal
                    initialSeconds={restTimer.seconds}
                    onClose={() => setShowRestTimer(false)}
                />
            )}
        </div>
    );
}
