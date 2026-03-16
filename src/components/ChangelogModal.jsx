import React from 'react';
import { useTranslation } from 'react-i18next';
import { PartyPopper, ChevronRight } from 'lucide-react';

export default function ChangelogModal({ newVersions, onClose }) {
    const { t } = useTranslation();

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem'
        }}>
            <div className="slide-up" style={{
                background: 'var(--bg-app)',
                width: '100%', maxWidth: '500px',
                borderRadius: '24px',
                padding: '1.5rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                maxHeight: '85vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem auto'
                    }}>
                        <PartyPopper size={28} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>App Updated!</h2>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Here is what's new since you last visited
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {newVersions.map((release) => (
                        <div key={release.version} style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            padding: '1.25rem'
                        }}>
                            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                                Version {release.version}
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                {release.changes.map((change, i) => (
                                    <li key={i} style={{ marginBottom: '0.4rem' }}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}
                    onClick={onClose}
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
