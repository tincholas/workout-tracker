import React, { useState, useMemo } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { SPLIT_COLORS } from '../store/models';
import VolumeChart from '../components/VolumeChart';
import CardioChart from '../components/CardioChart';
import { ChevronLeft, ChevronRight, X, Share2, Trophy } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
    const { history, preferredUnit, extraTypes, personalRecords } = useWorkout();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Helper to get workout color
    const getWorkoutColor = (workout) => {
        // 1. Check if it's a known Standard Type (and not Custom)
        if (SPLIT_COLORS[workout.type] && workout.type !== 'Custom') {
            return SPLIT_COLORS[workout.type];
        }

        // 2. If it's Custom (or unknown), check extraTypes for a name match
        const customType = extraTypes.find(t => t.name === workout.name);
        if (customType) return customType.color;

        // 3. Fallback
        return SPLIT_COLORS['Custom'] || '#a3a3a3';
    };

    // Map workouts to dates
    const workoutsByDate = useMemo(() => {
        const map = {};
        if (!history) return map;

        history.forEach(workout => {
            const date = new Date(workout.endTime);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!map[key]) map[key] = [];
            map[key].push(workout);
        });
        return map;
    }, [history]);

    const [animationClass, setAnimationClass] = useState('');

    const changeMonth = (delta) => {
        setAnimationClass(delta > 0 ? 'slide-right' : 'slide-left');
        setCurrentDate(new Date(year, month + delta, 1));
    };

    const handleDayClick = (day) => {
        const key = `${year}-${month}-${day}`;
        if (workoutsByDate[key]) {
            setSelectedDay({ dateStr: key, workouts: workoutsByDate[key] });
        }
    };

    const handleShare = async (workout) => {
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

    const renderCalendar = () => {
        const days = [];
        // Padding
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`pad-${i}`}></div>);
        }
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${year}-${month}-${day}`;
            const workouts = workoutsByDate[key] || [];

            days.push(
                <div
                    key={day}
                    className="card"
                    style={{
                        aspectRatio: '1/1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: '0.25rem',
                        cursor: workouts.length > 0 ? 'pointer' : 'default',
                        background: workouts.length > 0 ? 'var(--bg-card)' : 'transparent',
                        boxShadow: workouts.length > 0 ? 'var(--shadow-convex)' : 'none',
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onClick={() => handleDayClick(day)}
                >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{day}</span>
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                        {workouts.map((w, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: getWorkoutColor(w)
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    // Touch Handling for Swipe
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            changeMonth(1);
        }
        if (isRightSwipe) {
            changeMonth(-1);
        }
    };

    // Check for activity in current month to show/hide charts
    const { hasSetsData, hasCardioData } = useMemo(() => {
        if (!history) return { hasSetsData: false, hasCardioData: false };

        const monthlyWorkouts = history.filter(w => {
            const d = new Date(w.endTime);
            return d.getMonth() === month && d.getFullYear() === year;
        });

        let hasSets = false;
        let hasCardio = false;

        monthlyWorkouts.forEach(w => {
            w.exercises.forEach(ex => {
                if (ex.target === 'Cardio') {
                    if ((ex.accumulatedSeconds || 0) > 0) hasCardio = true;
                } else {
                    if (ex.sets.some(s => s.completed)) hasSets = true;
                }
            });
        });

        return { hasSetsData: hasSets, hasCardioData: hasCardio };
    }, [history, month, year]);

    return (
        <div
            style={{
                padding: 'var(--space-md)',
                backgroundColor: 'var(--bg-app)',
                minHeight: '100vh',
                boxSizing: 'border-box'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ margin: 0 }}>{MONTHS[month]} {year}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.5rem' }} onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                    <button className="btn" style={{ padding: '0.5rem' }} onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                {DAYS.map(d => <span key={d} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d}</span>)}
            </div>

            <div
                key={currentDate.toISOString()}
                className={animationClass}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}
            >
                {renderCalendar()}
            </div>

            {hasSetsData && (
                <div className="card" style={{ marginTop: '1.5rem', padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-muted)' }}>Daily Volume ({preferredUnit})</h3>
                    <VolumeChart history={history} currentMonth={month} currentYear={year} />
                </div>
            )}

            {hasCardioData && (
                <div className="card" style={{ marginTop: '1.5rem', padding: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-muted)' }}>Daily Cardio (Minutes)</h3>
                    <CardioChart history={history} currentMonth={month} currentYear={year} />
                </div>
            )}

            {/* Details Modal */}
            {selectedDay && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'var(--bg-app)', zIndex: 150,
                    padding: '2rem', overflowY: 'auto'
                }}>
                    <button className="btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setSelectedDay(null)}>
                        <X size={24} />
                    </button>

                    <h2 style={{ marginBottom: '2rem' }}>Workouts</h2>

                    {selectedDay.workouts.map(w => (
                        <div key={w.id} style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderLeft: `6px solid ${getWorkoutColor(w)}`, paddingLeft: '1rem' }}>
                                <h3 style={{ margin: 0 }}>{w.name}</h3>
                                <button className="btn" onClick={() => handleShare(w)} style={{ padding: '0.5rem', color: 'var(--primary)' }}>
                                    <Share2 size={20} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {w.exercises.map(ex => {
                                    const prRecord = personalRecords[ex.name];

                                    return (
                                        <div key={ex.id} className="card" style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>{ex.name}</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {ex.target === 'Cardio' ? (
                                                    <span style={{
                                                        background: 'var(--bg-app)',
                                                        boxShadow: 'var(--shadow-concave)',
                                                        color: '#22c55e',
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {((ex.accumulatedSeconds || 0) / 60).toFixed(1)} mins
                                                    </span>
                                                ) : (
                                                    ex.sets.map((s, i) => {
                                                        const isPR = prRecord && prRecord.setId === s.id;

                                                        return s.completed && (
                                                            <span key={i} style={{
                                                                background: 'var(--bg-app)',
                                                                boxShadow: isPR ? '0 0 10px rgba(234, 179, 8, 0.3), var(--shadow-convex)' : 'var(--shadow-concave)',
                                                                padding: '0.5rem 0.75rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                color: isPR ? '#eab308' : 'var(--text-primary)',
                                                                border: isPR ? '1px solid rgba(234, 179, 8, 0.2)' : 'none'
                                                            }}>
                                                                {s.weight}kg x {s.reps}
                                                                {isPR && <Trophy size={12} color="#eab308" />}
                                                            </span>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                    }
                </div>
            )}
        </div>
    );
}
