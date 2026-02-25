import React, { useState, useEffect } from 'react';
import Calendar from './Calendar';
import ExerciseHistory from './ExerciseHistory';
import { useTranslation } from 'react-i18next';

const TAB_KEY = 'historyhub_active_tab';

export default function HistoryHub() {
    const { t } = useTranslation();

    // Persist active tab across navigations
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(TAB_KEY) || 'calendar';
    });

    useEffect(() => {
        localStorage.setItem(TAB_KEY, activeTab);
    }, [activeTab]);

    return (
        <div style={{
            backgroundColor: 'var(--bg-app)',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* Segmented Control */}
            <div style={{
                padding: 'var(--space-md)',
                paddingBottom: 0,
                position: 'sticky',
                top: 0,
                background: 'var(--bg-app)',
                zIndex: 10
            }}>
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    padding: '4px',
                    gap: '4px'
                }}>
                    {[
                        { key: 'calendar', label: t('calendar', { defaultValue: 'Calendar' }) },
                        { key: 'exercises', label: t('exercise_history', { defaultValue: 'Exercises' }) }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1,
                                padding: '0.6rem 1rem',
                                borderRadius: '9px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === tab.key ? '#000' : 'var(--text-muted)',
                                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'calendar'
                ? <Calendar embedded />
                : <ExerciseHistory embedded />
            }
        </div>
    );
}
