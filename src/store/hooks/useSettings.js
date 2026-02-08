import { useState, useEffect, useCallback } from 'react';

/**
 * Settings hook for user preferences
 * 
 * @param {Object} initialData - Initial data from persistence
 * @returns {Object} Settings state and actions
 */
export const useSettings = (initialData = {}) => {
    const [preferredUnit, setPreferredUnit] = useState(initialData.unit || 'KG');
    const [restTimer, setRestTimer] = useState(initialData.restTimer || { enabled: false, seconds: 60 });
    const [extraTypes, setExtraTypes] = useState(initialData.extraTypes || []);
    const [notificationPermission, setNotificationPermission] = useState('default');

    // Check notification permission on mount
    useEffect(() => {
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const toggleUnit = useCallback(() => {
        setPreferredUnit(prev => prev === 'KG' ? 'LBS' : 'KG');
    }, []);

    const requestNotificationPermission = useCallback(() => {
        if (!("Notification" in window)) return;

        Notification.requestPermission().then((permission) => {
            setNotificationPermission(permission);
        });
    }, []);

    const createCustomType = useCallback((name, color, icon) => {
        const newType = {
            id: crypto.randomUUID(),
            name,
            color,
            icon,
            isCustom: true
        };
        setExtraTypes(prev => [...prev, newType]);
    }, []);

    const deleteCustomType = useCallback((id) => {
        setExtraTypes(prev => prev.filter(t => t.id !== id));
    }, []);

    // Sync with initial data when it changes (from persistence)
    useEffect(() => {
        if (initialData.unit) setPreferredUnit(initialData.unit);
        if (initialData.restTimer) setRestTimer(initialData.restTimer);
        if (initialData.extraTypes) setExtraTypes(initialData.extraTypes);
    }, [initialData.unit, initialData.restTimer, initialData.extraTypes]);

    return {
        // State
        preferredUnit,
        restTimer,
        extraTypes,
        notificationPermission,
        // Actions
        toggleUnit,
        setRestTimer,
        createCustomType,
        deleteCustomType,
        requestNotificationPermission,
        // Raw setters for persistence
        setPreferredUnit,
        setExtraTypes
    };
};
