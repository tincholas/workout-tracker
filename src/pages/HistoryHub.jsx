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
                paddingBottom: '0.75rem',
                position: 'sticky',
                top: 0,
                background: 'var(--bg-app)',
                zIndex: 10
            }}>
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    gap: '4px',
                    boxShadow: 'var(--shadow-concave)',
                }}>
                    {[
                        { key: 'calendar', label: t('calendar', { defaultValue: 'Calendar' }) },
                        { key: 'exercises', label: t('history', { defaultValue: 'History' }) }
                    ].map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem 1rem',
                                    borderRadius: 'calc(var(--radius-md) - 4px)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    transition: 'all 0.25s var(--ease-spring)',
                                    background: isActive ? 'var(--color-primary)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--text-muted)',
                                    boxShadow: isActive ? 'var(--shadow-convex)' : 'none',
                                    transform: isActive ? 'scale(1)' : 'scale(0.97)',
                                    letterSpacing: isActive ? '0.01em' : 'normal',
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
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
