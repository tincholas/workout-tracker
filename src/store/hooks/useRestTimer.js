import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Rest timer hook with notification support
 * 
 * @param {Function} requestNotificationPermission - Function to request notification permission
 * @returns {Object} Timer state and actions
 */
export const useRestTimer = (requestNotificationPermission) => {
    const [activeRestTimer, setActiveRestTimer] = useState(null);

    // Keep Ref updated for Interval to avoid stale closures
    const activeRestTimerRef = useRef(activeRestTimer);
    useEffect(() => {
        activeRestTimerRef.current = activeRestTimer;
    }, [activeRestTimer]);

    const startRestTimer = useCallback((exerciseId, durationSeconds) => {
        if (requestNotificationPermission) {
            requestNotificationPermission();
        }
        const now = Date.now();
        setActiveRestTimer({
            exerciseId,
            endTime: now + (durationSeconds * 1000),
            totalDuration: durationSeconds * 1000
        });
    }, [requestNotificationPermission]);

    const cancelRestTimer = useCallback(() => {
        setActiveRestTimer(null);
    }, []);

    const extendRestTimer = useCallback((seconds) => {
        setActiveRestTimer(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                endTime: prev.endTime + (seconds * 1000),
                totalDuration: prev.totalDuration + (seconds * 1000)
            };
        });
    }, []);

    // Timer notification logic
    useEffect(() => {
        let interval = null;
        if (activeRestTimer) {
            interval = setInterval(() => {
                const now = Date.now();
                const timer = activeRestTimerRef.current;

                if (timer && now >= timer.endTime) {
                    // Send Notification
                    if ("Notification" in window && Notification.permission === "granted") {
                        // Try Service Worker first
                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.ready.then(reg => {
                                reg.showNotification("Cool Down Finished", {
                                    body: "Time for your next set!",
                                    icon: '/bicep.svg',
                                    vibrate: [200, 100, 200]
                                });
                            }).catch(() => new Notification("Cool Down Finished", {
                                body: "Time for your next set!",
                                icon: '/bicep.svg'
                            }));
                        } else {
                            new Notification("Cool Down Finished", {
                                body: "Time for your next set!",
                                icon: '/bicep.svg'
                            });
                        }
                    }
                    setActiveRestTimer(null);
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeRestTimer]);

    return {
        activeRestTimer,
        startRestTimer,
        cancelRestTimer,
        extendRestTimer
    };
};
