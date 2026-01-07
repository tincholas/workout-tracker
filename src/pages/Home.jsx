import React, { useState } from 'react';
import { EXERCISE_TYPES, SPLIT_COLORS } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Anchor, Move, Footprints, Shirt, BicepsFlexed, User, Plus, Star, X, Trash2, Settings, History } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';

const SPLIT_ICONS = {
    [EXERCISE_TYPES.CHEST_TRICEPS]: Shirt,
    [EXERCISE_TYPES.BACK_BICEPS]: BicepsFlexed,
    [EXERCISE_TYPES.SHOULDERS]: User,
    [EXERCISE_TYPES.LEGS]: Footprints
};

const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#f97316', '#64748b'];

export default function Home() {
    const { startWorkout, activeWorkout, extraTypes, createCustomType, deleteCustomType, history } = useWorkoutContext();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[4]);

    // Find last workout name
    const lastWorkoutName = React.useMemo(() => {
        if (!history || history.length === 0) return null;
        // Sort by endTime descending
        const sorted = [...history].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
        return sorted[0].name;
    }, [history]);

    const handleStart = (type, customName = null) => {
        startWorkout(type, customName);
        navigate('/session');
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newWorkoutName) return;
        createCustomType(newWorkoutName, selectedColor);
        setShowModal(false);
        setNewWorkoutName('');
    };

    return (
        <div className="page-container" style={{ padding: 'var(--space-lg)' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center', color: '#ffffff', position: 'relative' }}>
                <button
                    onClick={() => setShowSettings(true)}
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.5rem'
                    }}
                >
                    <Settings size={24} />
                </button>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem', color: '#ffffff' }}>
                    IRON <span style={{ color: 'var(--primary)' }}>TRACK</span>
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Select your split to begin</p>
            </header>

            {activeWorkout && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Active Workout Found</h3>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/session')}>
                        Resume {activeWorkout.name}
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Standard Splits */}
                {Object.values(EXERCISE_TYPES).filter(t => t !== 'Custom').map((type) => {
                    const Icon = SPLIT_ICONS[type] || Dumbbell;
                    const isLast = lastWorkoutName === type;
                    return (
                        <button
                            key={type}
                            className="card"
                            onClick={() => handleStart(type)}
                            style={{
                                padding: '1.5rem',
                                borderLeft: `6px solid ${SPLIT_COLORS[type]}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                color: '#ffffff', // Ensure white text
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                background: `${SPLIT_COLORS[type]}20`,
                                padding: '0.75rem',
                                borderRadius: '12px',
                                color: SPLIT_COLORS[type]
                            }}>
                                <Icon size={28} />
                            </div>
                            <div style={{ flex: 1 }}>{type}</div>
                            {isLast && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    color: 'var(--text-muted)', fontSize: '0.75rem',
                                    background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px'
                                }}>
                                    <History size={12} />
                                    <span>Last</span>
                                </div>
                            )}
                        </button>
                    );
                })}

                {/* Custom Workouts */}
                {extraTypes.map((custom) => {
                    const isLast = lastWorkoutName === custom.name;
                    return (
                        <div key={custom.id} style={{ position: 'relative' }}>
                            <button
                                className="card"
                                onClick={() => handleStart(EXERCISE_TYPES.CUSTOM, custom.name)}
                                style={{
                                    padding: '1.5rem',
                                    borderLeft: `6px solid ${custom.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    color: '#ffffff' // Ensure white text
                                }}
                            >
                                <div style={{
                                    background: `${custom.color}20`,
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    color: custom.color
                                }}>
                                    <Star size={28} />
                                </div>
                                <div style={{ flex: 1 }}>{custom.name}</div>
                                {isLast && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        color: 'var(--text-muted)', fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px',
                                        marginRight: '2.5rem' // Avoid delete button
                                    }}>
                                        <History size={12} />
                                        <span>Last</span>
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteCustomType(custom.id); }}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '0.5rem'
                                }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    );
                })}

                {/* Create New Button */}
                <button
                    className="card"
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '1.5rem',
                        border: '2px dashed var(--text-muted)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={24} />
                    <span>Create Custom Workout</span>
                </button>
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>New Workout</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Name</label>
                                <input
                                    type="text"
                                    value={newWorkoutName}
                                    onChange={e => setNewWorkoutName(e.target.value)}
                                    className="input"
                                    placeholder="e.g. Abs & Cardio"
                                    autoFocus
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {COLORS.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => setSelectedColor(c)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', background: c,
                                                cursor: 'pointer',
                                                border: selectedColor === c ? '3px solid white' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create</button>
                        </form>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    );
}
