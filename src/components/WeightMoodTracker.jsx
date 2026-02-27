import React, { useState, useEffect, useRef } from 'react';
import { Scale, ChevronDown, ChevronUp } from 'lucide-react';
import { useWorkout } from '../store/WorkoutContext';
import { useTranslation } from 'react-i18next';

// ─── Constants ──────────────────────────────────────────────────────────────

const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '😄'];
const DEFAULT_MOOD = 2;

// KG step: 0.1 kg  |  LBS step: 0.2 lbs (≈ 100 g)
const KG_STEP = 0.1;
const LBS_STEP = 0.2;
const KG_TO_LBS = 2.20462;
const DEFAULT_WEIGHT_KG = 70;
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 300;

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function kgToDisplay(kg, unit) {
    if (unit === 'LBS') return Math.round(kg * KG_TO_LBS * 10) / 10;
    return Math.round(kg * 10) / 10;
}

function displayToKg(val, unit) {
    if (unit === 'LBS') return Math.round((val / KG_TO_LBS) * 1000) / 1000;
    return Math.round(val * 1000) / 1000;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function WeightMoodTracker() {
    const { trackWeightMood, getWeightMoodForDate, getLastWeightMoodEntry, preferredUnit } = useWorkout();
    const { t } = useTranslation();

    const todayStr = toDateStr(new Date());
    const todayEntry = getWeightMoodForDate(todayStr);
    const isTrackedToday = !!todayEntry;

    const [expanded, setExpanded] = useState(false);
    const [displayWeight, setDisplayWeight] = useState(() => {
        const kgVal = todayEntry?.weight ?? DEFAULT_WEIGHT_KG;
        return kgToDisplay(kgVal, preferredUnit);
    });
    const [mood, setMood] = useState(DEFAULT_MOOD);

    // Seed values whenever the panel opens
    useEffect(() => {
        if (expanded) {
            const lastEntry = getLastWeightMoodEntry?.();
            const seed = todayEntry ?? lastEntry;
            setDisplayWeight(kgToDisplay(seed?.weight ?? DEFAULT_WEIGHT_KG, preferredUnit));
            // Use today's stored mood if editing; otherwise centre
            setMood(todayEntry?.mood ?? DEFAULT_MOOD);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expanded]);

    // Re-convert display weight when unit changes while panel is open
    const prevUnitRef = useRef(preferredUnit);
    useEffect(() => {
        if (prevUnitRef.current !== preferredUnit && expanded) {
            const kg = displayToKg(displayWeight, prevUnitRef.current);
            setDisplayWeight(kgToDisplay(kg, preferredUnit));
        }
        prevUnitRef.current = preferredUnit;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preferredUnit]);

    const step = preferredUnit === 'LBS' ? LBS_STEP : KG_STEP;
    const unit = preferredUnit === 'LBS' ? 'lbs' : 'kg';

    const adjustWeight = (delta) => {
        setDisplayWeight(prev => {
            const minD = kgToDisplay(MIN_WEIGHT_KG, preferredUnit);
            const maxD = kgToDisplay(MAX_WEIGHT_KG, preferredUnit);
            const next = Math.round((Number(prev) + delta) * 100) / 100;
            return Math.min(maxD, Math.max(minD, next));
        });
    };

    const handleWeightBlur = (e) => {
        const parsed = parseFloat(e.target.value);
        if (isNaN(parsed)) {
            const last = getLastWeightMoodEntry?.();
            const fallback = todayEntry?.weight ?? last?.weight ?? DEFAULT_WEIGHT_KG;
            setDisplayWeight(kgToDisplay(fallback, preferredUnit));
        } else {
            const minD = kgToDisplay(MIN_WEIGHT_KG, preferredUnit);
            const maxD = kgToDisplay(MAX_WEIGHT_KG, preferredUnit);
            setDisplayWeight(Math.min(maxD, Math.max(minD, Math.round(parsed * 10) / 10)));
        }
    };

    const handleTrack = () => {
        const kg = displayToKg(parseFloat(displayWeight) || DEFAULT_WEIGHT_KG, preferredUnit);
        trackWeightMood(Math.round(kg * 1000) / 1000, mood);
        setExpanded(false);
    };

    // ── Summary values for the collapsed row ──
    const dispW = kgToDisplay(todayEntry?.weight ?? DEFAULT_WEIGHT_KG, preferredUnit);
    const summaryEmoji = MOOD_EMOJIS[todayEntry?.mood ?? DEFAULT_MOOD];

    return (
        <div
            className="card"
            style={{
                marginBottom: '1.25rem',
                overflow: 'hidden',
                padding: 0
            }}
        >
            {/* ── Collapsed header row (always visible) ── */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(v => !v)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1.25rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <Scale
                    size={18}
                    color={isTrackedToday ? 'var(--color-primary)' : 'var(--text-muted)'}
                    style={{ flexShrink: 0 }}
                />

                {isTrackedToday ? (
                    /* Summary line */
                    <>
                        <span style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {dispW} {unit}&nbsp;&nbsp;{summaryEmoji}
                        </span>
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                            [{t('edit')}]
                        </span>
                    </>
                ) : (
                    /* Default prompt */
                    <>
                        <span style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                            {t('track_weight_mood')}
                        </span>
                        {expanded
                            ? <ChevronUp size={16} color="var(--text-muted)" />
                            : <ChevronDown size={16} color="var(--text-muted)" />
                        }
                    </>
                )}
            </div>

            {/* ── Animated expandable body ── */}
            <div
                style={{
                    maxHeight: expanded ? '400px' : '0px',
                    opacity: expanded ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease'
                }}
            >
                <div style={{ padding: '0 1.25rem 1.25rem' }}>
                    {/* Thin separator */}
                    <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '1.1rem' }} />

                    {/* Weight row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <button onClick={() => adjustWeight(-step)} style={stepBtnStyle} aria-label="Decrease weight">−</button>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                            <input
                                type="number"
                                value={displayWeight}
                                onChange={e => setDisplayWeight(e.target.value)}
                                onBlur={handleWeightBlur}
                                step={step}
                                min={kgToDisplay(MIN_WEIGHT_KG, preferredUnit)}
                                max={kgToDisplay(MAX_WEIGHT_KG, preferredUnit)}
                                className="input"
                                style={{
                                    textAlign: 'center',
                                    width: '90px',
                                    fontSize: '1.4rem',
                                    fontWeight: '700',
                                    padding: '0.5rem',
                                    MozAppearance: 'textfield'
                                }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{unit}</span>
                        </div>
                        <button onClick={() => adjustWeight(step)} style={stepBtnStyle} aria-label="Increase weight">+</button>
                    </div>

                    {/* Mood emojis */}
                    <div style={{ marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            {MOOD_EMOJIS.map((emoji, i) => (
                                <span
                                    key={i}
                                    onClick={() => setMood(i)}
                                    style={{
                                        fontSize: '1.6rem',
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        transform: mood === i ? 'scale(1.28)' : 'scale(1)',
                                        transition: 'transform 0.15s ease, opacity 0.15s ease',
                                        opacity: mood === i ? 1 : 0.4,
                                        lineHeight: 1,
                                        padding: '2px'
                                    }}
                                    title={t(`mood_names.${i}`)}
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={4}
                            step={1}
                            value={mood}
                            onChange={e => setMood(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                        />
                    </div>

                    {/* Track button */}
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        onClick={handleTrack}
                    >
                        {t('track')}
                    </button>
                </div>
            </div>
        </div>
    );
}

const stepBtnStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'var(--bg-card)',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '1.4rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-convex)',
    flexShrink: 0,
    lineHeight: 1
};
