import React, { useState, useMemo } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { SPLIT_COLORS } from '../store/models';
import VolumeChart from '../components/VolumeChart';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar() {
    const { history } = useWorkout();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

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

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    const handleDayClick = (day) => {
        const key = `${year}-${month}-${day}`;
        if (workoutsByDate[key]) {
            setSelectedDay({ dateStr: key, workouts: workoutsByDate[key] });
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
                        background: workouts.length > 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onClick={() => handleDayClick(day)}
                >
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{day}</span>
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                        {workouts.map((w, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: SPLIT_COLORS[w.type] || '#fff'
                                }}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div style={{ padding: 'var(--space-md)' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                {renderCalendar()}
            </div>

            <div className="card" style={{ marginTop: '1.5rem', padding: '1rem' }}>
                <VolumeChart history={history} currentMonth={month} currentYear={year} />
            </div>

            {/* Details Modal */}
            {selectedDay && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 150,
                    padding: '2rem', overflowY: 'auto'
                }}>
                    <button className="btn" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setSelectedDay(null)}>
                        <X size={24} />
                    </button>

                    <h2 style={{ marginBottom: '2rem' }}>Workouts</h2>

                    {selectedDay.workouts.map(w => (
                        <div key={w.id} style={{ marginBottom: '2rem' }}>
                            <h3 style={{ borderLeft: `4px solid ${SPLIT_COLORS[w.type]}`, paddingLeft: '1rem' }}>{w.name}</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {w.exercises.map(ex => (
                                    <div key={ex.id} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{ex.name}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {ex.sets.map((s, i) => (
                                                s.completed && (
                                                    <span key={i} style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {s.weight}kg x {s.reps}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
