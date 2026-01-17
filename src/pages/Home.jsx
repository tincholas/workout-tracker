import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { EXERCISE_TYPES, SPLIT_COLORS } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell, Anchor, Move, Footprints, Shirt, BicepsFlexed, User, Plus, Star, X, Trash2, Settings, History,
    Heart, Activity, Flame, Zap, Timer, Trophy, Medal, Crown, Target, Swords, Bike, Waves, Mountain,
    Brain, Smile, Ghost, Sun, Moon
} from 'lucide-react';
import SettingsModal from '../components/SettingsModal';

// Icon Registry - Mapping names to Components
const ICON_MAP = {
    // Existing Defaults
    'Dumbbell': Dumbbell,
    'Shirt': Shirt,
    'BicepsFlexed': BicepsFlexed,
    'User': User,
    'Footprints': Footprints,

    // New Options
    'Heart': Heart,
    'Activity': Activity,
    'Flame': Flame,
    'Zap': Zap,
    'Timer': Timer,
    'Trophy': Trophy,
    'Medal': Medal,
    'Crown': Crown,
    'Target': Target,
    'Swords': Swords,
    'Bike': Bike,
    'Waves': Waves,
    'Mountain': Mountain,
    'Star': Star,
    'Anchor': Anchor,
    'Move': Move,
    'Brain': Brain,
    'Smile': Smile,
    'Ghost': Ghost,
    'Sun': Sun,
    'Moon': Moon
};

const SPLIT_ICONS = {
    [EXERCISE_TYPES.CHEST_TRICEPS]: 'Shirt',
    [EXERCISE_TYPES.BACK_BICEPS]: 'BicepsFlexed',
    [EXERCISE_TYPES.SHOULDERS]: 'User',
    [EXERCISE_TYPES.LEGS]: 'Footprints'
};

const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#f97316', '#64748b'];

export default function Home() {
    const { startWorkout, activeWorkout, extraTypes, createCustomType, deleteCustomType, history } = useWorkoutContext();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[4]);
    const [selectedIcon, setSelectedIcon] = useState('Star');
    const [isStarting, setIsStarting] = useState(false); // Prevents flicker during transition

    // Find last workout name
    const lastWorkoutName = React.useMemo(() => {
        if (!history || history.length === 0) return null;
        // Sort by endTime descending
        const sorted = [...history].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
        return sorted[0].name;
    }, [history]);

    const handleStart = (type, customName = null) => {
        setIsStarting(true); // Suppress "Active Workout Found" during exit
        startWorkout(type, customName);
        navigate('/session');
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newWorkoutName) return;
        createCustomType(newWorkoutName, selectedColor, selectedIcon);
        setShowModal(false);
        setNewWorkoutName('');
        setSelectedIcon('Star'); // Reset
    };

    return (
        <div className="page-container" style={{
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--bg-app)',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--text-primary)', position: 'relative' }}>
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
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    IRON <span style={{ color: 'var(--primary)' }}>TRACK</span>
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Select your split to begin</p>
            </header>

            {activeWorkout && !isStarting && (
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
                    const iconName = SPLIT_ICONS[type] || 'Dumbbell';
                    const Icon = ICON_MAP[iconName] || Dumbbell;
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
                                color: 'var(--text-primary)', // Ensure readability in boith modes
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
                    const IconComponent = ICON_MAP[custom.icon] || Star;
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
                                    color: 'var(--text-primary)' // Ensure readability in both modes
                                }}
                            >
                                <div style={{
                                    background: `${custom.color}20`,
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    color: custom.color
                                }}>
                                    <IconComponent size={28} />
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete the "${custom.name}" split?`)) {
                                        deleteCustomType(custom.id);
                                    }
                                }}
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
                    <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>New Workout</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><X /></button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Name</label>
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {COLORS.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => setSelectedColor(c)}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%', background: c,
                                                cursor: 'pointer',
                                                border: selectedColor === c ? '3px solid white' : 'none',
                                                boxShadow: selectedColor === c ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Icon</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gap: '0.5rem',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    padding: '4px' // padding for scrollbar
                                }}>
                                    {Object.keys(ICON_MAP).map(iconName => {
                                        const IconComp = ICON_MAP[iconName];
                                        const isSelected = selectedIcon === iconName;
                                        return (
                                            <div
                                                key={iconName}
                                                onClick={() => setSelectedIcon(iconName)}
                                                style={{
                                                    aspectRatio: '1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    background: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                                                    color: isSelected ? '#000' : '#a3a3a3'
                                                }}
                                            >
                                                <IconComp size={20} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create</button>
                        </form>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            </AnimatePresence>
        </div>
    );
}
