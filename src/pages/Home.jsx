import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EXERCISE_TYPES } from '../store/models';
import { useWorkout as useWorkoutContext } from '../store/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import {
    Dumbbell, Anchor, Move, Footprints, Shirt, BicepsFlexed, User, Plus, Star, X, History,
    Heart, Activity, Flame, Zap, Timer, Trophy, Medal, Crown, Target, Swords, Bike, Waves, Mountain,
    Brain, Smile, Ghost, Sun, Moon, MoreVertical, ChevronUp, ChevronDown, Trash2, Pencil
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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


const COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#f97316', '#64748b'];

export default function Home() {
    const { startWorkout, activeWorkout, extraTypes, createCustomType, deleteCustomType, editCustomType, moveType, history } = useWorkoutContext();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState(null);
    const [newWorkoutName, setNewWorkoutName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[4]);
    const [selectedIcon, setSelectedIcon] = useState('Star');
    const [isStarting, setIsStarting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const { t } = useTranslation();

    // Lock body scroll when any modal is open
    useEffect(() => {
        if (showModal) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [showModal]);

    // Close context menu on outside click
    useEffect(() => {
        if (!openMenuId) return;
        const close = () => setOpenMenuId(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [openMenuId]);

    // Find last workout name
    const lastWorkoutName = React.useMemo(() => {
        if (!history || history.length === 0) return null;
        // Sort by endTime descending
        const sorted = [...history].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
        return sorted[0].name;
    }, [history]);

    const handleStart = (workoutDef) => {
        setIsStarting(true);
        startWorkout(workoutDef);
        navigate('/session');
    };

    const openCreateModal = () => {
        setEditingWorkout(null);
        setNewWorkoutName('');
        setSelectedColor(COLORS[4]);
        setSelectedIcon('Star');
        setShowModal(true);
    };

    const openEditModal = (workoutDef) => {
        setEditingWorkout(workoutDef);
        setNewWorkoutName(workoutDef.name);
        setSelectedColor(workoutDef.color);
        setSelectedIcon(workoutDef.icon || 'Star');
        setShowModal(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newWorkoutName) return;
        if (editingWorkout) {
            editCustomType(editingWorkout.id, newWorkoutName, selectedColor, selectedIcon);
        } else {
            createCustomType(newWorkoutName, selectedColor, selectedIcon);
        }
        setShowModal(false);
        setEditingWorkout(null);
        setNewWorkoutName('');
        setSelectedIcon('Star');
    };

    // Resolve a split's display name: use i18nKey translation if available, otherwise raw name
    const resolveSplitName = (workoutDef) => {
        if (workoutDef.i18nKey) {
            return t(`common_splits.${workoutDef.i18nKey}`, { defaultValue: workoutDef.name });
        }
        return workoutDef.name;
    };

    // Resolve Active Workout Name
    const activeWorkoutName = React.useMemo(() => {
        if (!activeWorkout) return '';
        const splitDef = extraTypes.find(t => t.id === activeWorkout.splitId);
        if (splitDef?.i18nKey) {
            return t(`common_splits.${splitDef.i18nKey}`, { defaultValue: splitDef.name });
        }
        return activeWorkout.name;
    }, [activeWorkout, extraTypes, t]);

    return (
        <div className="page-container" style={{
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--bg-app)',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {t('app_title')}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>{t('welcome_message')}</p>
            </header>

            {activeWorkout && !isStarting && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>{t('active_workout_found')}</h3>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/session')}>
                        {t('resume_workout', { name: activeWorkoutName })}
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Unified Workout List */}
                {extraTypes.map((workoutDef) => {
                    const isLast = lastWorkoutName === workoutDef.name;
                    const IconComponent = ICON_MAP[workoutDef.icon] || Star;
                    return (
                        <div key={workoutDef.id} style={{ position: 'relative' }}>
                            <div
                                className="card"
                                role="button"
                                tabIndex={0}
                                onClick={() => handleStart(workoutDef)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStart(workoutDef); } }}
                                style={{
                                    padding: '1.5rem',
                                    borderLeft: `6px solid ${workoutDef.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    width: '100%',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    color: 'var(--text-primary)',
                                    position: 'relative',
                                    boxSizing: 'border-box',
                                    userSelect: 'none',
                                    touchAction: 'pan-y'
                                }}
                            >
                                <div style={{
                                    background: `${workoutDef.color}20`,
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    color: workoutDef.color
                                }}>
                                    <IconComponent size={28} />
                                </div>
                                <div style={{ flex: 1 }}>{resolveSplitName(workoutDef)}</div>
                                {isLast && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        color: 'var(--text-muted)', fontSize: '0.75rem',
                                        background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px',
                                        marginRight: '2.5rem'
                                    }}>
                                        <History size={12} />
                                        <span>{t('last_workout')}</span>
                                    </div>
                                )}
                            </div>
                            {/* '...' context menu button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === workoutDef.id ? null : workoutDef.id);
                                }}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    lineHeight: 0
                                }}
                            >
                                <MoreVertical size={20} />
                            </button>

                            {/* Dropdown menu */}
                            {openMenuId === workoutDef.id && (
                                <div
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        right: '3rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'var(--bg-card)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                        zIndex: 50,
                                        minWidth: '140px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {[{
                                        icon: <Pencil size={14} />,
                                        label: t('edit'),
                                        onClick: () => { openEditModal(workoutDef); setOpenMenuId(null); }
                                    }, {
                                        icon: <ChevronUp size={14} />,
                                        label: t('move_up'),
                                        onClick: () => { moveType(workoutDef.id, 'up'); setOpenMenuId(null); }
                                    }, {
                                        icon: <ChevronDown size={14} />,
                                        label: t('move_down'),
                                        onClick: () => { moveType(workoutDef.id, 'down'); setOpenMenuId(null); }
                                    }, {
                                        icon: <Trash2 size={14} />,
                                        label: t('remove'),
                                        danger: true,
                                        onClick: () => {
                                            setOpenMenuId(null);
                                            if (window.confirm(t('confirm_delete_split', { name: resolveSplitName(workoutDef) }))) {
                                                deleteCustomType(workoutDef.id);
                                            }
                                        }
                                    }].map(({ icon, label, onClick, danger }) => (
                                        <button
                                            key={label}
                                            onClick={onClick}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                width: '100%',
                                                padding: '0.65rem 1rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: danger ? '#ef4444' : 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {icon}{label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Create New Button */}
                <div
                    className="card"
                    role="button"
                    tabIndex={0}
                    onClick={() => openCreateModal()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCreateModal(); } }}
                    style={{
                        padding: '1.5rem',
                        border: '2px dashed var(--text-muted)',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        touchAction: 'pan-y'
                    }}
                >
                    <Plus size={24} />
                    <span>{t('create_custom_workout')}</span>
                </div>
            </div>

            {/* Creation Modal */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
                    overflowY: 'auto', overflowX: 'hidden', padding: '1rem 1rem 120px 1rem'
                }}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', boxSizing: 'border-box', padding: '1.5rem', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>{editingWorkout ? t('edit') : t('new_workout')}</h2>
                            <button onClick={() => { setShowModal(false); setEditingWorkout(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}><X /></button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('workout_name')}</label>
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('color')}</label>
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t('icon')}</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gap: '0.5rem',
                                    padding: '4px'
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

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                {editingWorkout ? t('save') : t('create')}
                            </button>
                        </form>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
