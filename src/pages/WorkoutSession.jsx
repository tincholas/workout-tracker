import React, { useState } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import { Plus, Save, X } from 'lucide-react';

export default function WorkoutSession() {
    const { activeWorkout, completeWorkout, cancelWorkout, addExercise, swapExercise } = useWorkout();
    const navigate = useNavigate();
    const [showSwapModal, setShowSwapModal] = useState(null); // stores exerciseId to swap
    const [swapName, setSwapName] = useState('');

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

    const handleSwapSubmit = (e) => {
        e.preventDefault();
        if (swapName && showSwapModal) {
            swapExercise(showSwapModal, swapName, 'Custom'); // Defaulting target for now
            setShowSwapModal(null);
            setSwapName('');
        }
    };

    return (
        <div style={{ padding: 'var(--space-md)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{activeWorkout.name}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }} onClick={() => { if (confirm('Cancel workout?')) { cancelWorkout(); navigate('/'); } }}>
                        <X size={20} />
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleFinish}>
                        <Save size={20} style={{ marginRight: '0.5rem' }} /> Finish
                    </button>
                </div>
            </div>

            {/* Exercises */}
            {activeWorkout.exercises.map(ex => (
                <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onSwap={(id) => setShowSwapModal(id)}
                />
            ))}

            {/* Add Exercise Button */}
            <button
                className="btn"
                style={{ width: '100%', borderStyle: 'dashed', marginTop: '1rem' }}
                onClick={() => addExercise('New Exercise', 'Custom')}
            >
                <Plus size={20} /> Add Exercise
            </button>

            {/* Swap Modal */}
            {showSwapModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', p: '1rem'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px' }}>
                        <h3>Swap Exercise</h3>
                        <form onSubmit={handleSwapSubmit}>
                            <input
                                className="input"
                                autoFocus
                                placeholder="New Exercise Name"
                                value={swapName}
                                onChange={e => setSwapName(e.target.value)}
                                style={{ marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowSwapModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Swap</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
