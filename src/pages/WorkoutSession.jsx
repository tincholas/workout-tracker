import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWorkout } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import ExercisePickerModal from '../components/ExercisePickerModal';
import { Plus, Save, X } from 'lucide-react';

export default function WorkoutSession() {
    const { activeWorkout, completeWorkout, cancelWorkout, addExercise, swapExercise, restTimer } = useWorkout();
    const navigate = useNavigate();

    // Modal State
    const [pickerMode, setPickerMode] = useState(null); // 'ADD' or 'SWAP'
    const [swapTargetId, setSwapTargetId] = useState(null);

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
            navigate('/completed');
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
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="btn"
                        style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
                        onClick={() => { if (confirm('Cancel workout?')) { cancelWorkout(); navigate('/'); } }}
                    >
                        <X size={20} />
                    </motion.button>
                </div>
            </div>

            {/* Exercises */}
            <div
                className='exercise-list'
            >
                {activeWorkout.exercises.map(ex => (
                    <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        onSwap={(id) => openSwap(id)}
                    />
                ))}
            </div>

            {/* Add Exercise Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="btn"
                style={{ width: '100%', borderStyle: 'dashed', marginTop: '1rem', padding: '1rem' }}
                onClick={() => setPickerMode('ADD')}
            >
                <Plus size={20} /> Add Exercise
            </motion.button>

            {/* Finish Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleFinish}
            >
                <Save size={20} style={{ marginRight: '0.5rem' }} /> Finish Workout
            </motion.button>

            {/* Picker Modal */}
            <AnimatePresence>
                {pickerMode && (
                    <ExercisePickerModal
                        onClose={() => setPickerMode(null)}
                        onSelect={handleSelectExercise}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
