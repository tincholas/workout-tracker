import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWorkout } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from '../components/ExerciseCard';
import ExercisePickerModal from '../components/ExercisePickerModal';
import { Plus, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function WorkoutSession() {
    const { activeWorkout, completeWorkout, cancelWorkout, addExercise, swapExercise, cancelRestTimer, extraTypes } = useWorkout();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Scroll to last completed set on mount
    useEffect(() => {
        if (!activeWorkout) return;
        // Small delay to let ExerciseCard components render their sets into the DOM
        const timer = setTimeout(() => {
            const completedSets = document.querySelectorAll('[data-set-completed="true"]');
            if (completedSets.length > 0) {
                const lastCompleted = completedSets[completedSets.length - 1];
                lastCompleted.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, []); // Only on mount

    // Modal State
    const [pickerMode, setPickerMode] = useState(null); // 'ADD' or 'SWAP'
    const [swapTargetId, setSwapTargetId] = useState(null);

    // Resolve Display Name: use i18nKey, then name-based lookup, then raw name
    const displayName = React.useMemo(() => {
        if (!activeWorkout) return '';
        const splitDef = extraTypes.find(t => t.id === activeWorkout.splitId);
        if (splitDef) {
            const NAME_TO_I18N_KEY = {
                'Chest & Triceps': 'CHEST_TRICEPS', 'Back & Biceps': 'BACK_BICEPS',
                'Shoulders': 'SHOULDERS', 'Legs': 'LEGS', 'Push': 'PUSH', 'Pull': 'PULL',
                'Full Body': 'FULL_BODY', 'Upper Body': 'UPPER_BODY', 'Lower Body': 'LOWER_BODY',
                'Arms': 'ARMS', 'Core': 'CORE',
            };
            const key = splitDef.i18nKey || NAME_TO_I18N_KEY[splitDef.name];
            if (key) return t(`common_splits.${key}`, { defaultValue: splitDef.name });
            return splitDef.name;
        }
        return activeWorkout.name;
    }, [activeWorkout, extraTypes, t]);

    if (!activeWorkout) {
        return (
            <div style={{ padding: 'var(--space-md)', textAlign: 'center', marginTop: '50px' }}>
                <h2>{t('no_active_workout')}</h2>
                <button className="btn btn-primary" onClick={() => navigate('/')}>{t('go_home')}</button>
            </div>
        );
    }

    const handleFinish = () => {
        if (confirm(t('confirm_finish'))) {
            cancelRestTimer();
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
        <div style={{ padding: 'var(--space-md)', paddingBottom: '120px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{displayName}</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="btn"
                        style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', border: 'none' }}
                        onClick={() => { if (confirm(t('confirm_cancel'))) { cancelWorkout(); navigate('/'); } }}
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
                <Plus size={20} /> {t('add_exercise')}
            </motion.button>

            {/* Finish Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleFinish}
            >
                <Save size={20} style={{ marginRight: '0.5rem' }} /> {t('finish_workout')}
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
