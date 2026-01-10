import React, { useRef } from 'react';
import { useWorkout } from '../store/WorkoutContext';
import { X, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { getAllData, importData, clearData } from '../store/db';

export default function SettingsModal({ onClose }) {
    const { preferredUnit, toggleUnit, restTimer, setRestTimer } = useWorkout();
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            const dbData = await getAllData();
            const data = {
                ...dbData,
                export_date: new Date().toISOString(),
                app_version: __APP_VERSION__
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export data: ' + err.message);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // Basic validation
                if (!data.workout_history && !data['workout_history']) throw new Error('Invalid backup file');

                if (confirm('This will OVERWRITE your current data with the backup. Are you sure?')) {
                    await importData(data);

                    alert('Import successful! Reloading...');
                    window.location.reload();
                }
            } catch (err) {
                alert('Failed to import: ' + err.message);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleClear = async () => {
        if (confirm('DANGER: This will delete ALL your workout history and custom templates. This cannot be undone.\n\nAre you sure?')) {
            if (confirm('Really, truly delete everything?')) {
                await clearData();
                window.location.reload();
            }
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Settings</h2>
                    <button onClick={onClose} className="btn" style={{ padding: '0.5rem' }}><X size={24} /></button>
                </div>

                {/* Data Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Data</h3>

                    <button onClick={handleExport} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <Upload size={20} />
                        <span>Export Data</span>
                    </button>

                    <button onClick={handleImportClick} className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem' }}>
                        <Download size={20} />
                        <span>Import Data</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleFileChange}
                    />

                    <button onClick={handleClear} className="btn btn-danger" style={{ justifyContent: 'flex-start', gap: '1rem', padding: '1rem', color: '#ef4444', borderColor: '#ef4444' }}>
                        <Trash2 size={20} />
                        <span>Clear All Info</span>
                    </button>
                </div>

                {/* Preferences */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Preferences</h3>

                    <button onClick={toggleUnit} className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <RefreshCw size={20} />
                            <span>Units</span>
                        </div>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{preferredUnit}</span>
                    </button>

                    {/* Rest Timer Settings */}
                    <div className="card" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 'bold', color: restTimer.seconds > 0 ? '#fff' : 'var(--text-muted)' }}>Default Rest Timer</label>
                            <input
                                type="checkbox"
                                checked={restTimer.enabled}
                                disabled={restTimer.seconds <= 0}
                                onChange={(e) => setRestTimer({ ...restTimer, enabled: e.target.checked })}
                                style={{ width: '20px', height: '20px', cursor: restTimer.seconds > 0 ? 'pointer' : 'not-allowed' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="number"
                                className="input"
                                value={Math.floor(restTimer.seconds / 60)} // Display as minutes
                                onChange={(e) => {
                                    const mins = Math.max(0, parseInt(e.target.value) || 0);
                                    setRestTimer({
                                        enabled: mins === 0 ? false : restTimer.enabled,
                                        seconds: mins * 60
                                    });
                                }}
                                style={{ flex: 1 }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>minutes</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Auto-start timer when checking off a set.
                        </p>
                    </div>
                </div>

                {/* About */}
                <div style={{ marginTop: '1rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.6' }}>
                    <p style={{ margin: 0 }}>Version {__APP_VERSION__}</p>
                    <p style={{ margin: 0 }}>Updated: {__BUILD_DATE__}</p>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#fff' }}>&copy; Martin Nanni {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
}
