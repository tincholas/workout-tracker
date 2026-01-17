import { useState, useEffect } from 'react';

/**
 * Hook to get resolved CSS variable values.
 * Listens for system theme changes to update.
 */
export function useThemeColors() {
    const getColors = () => {
        const style = getComputedStyle(document.body);
        return {
            textMuted: style.getPropertyValue('--text-muted').trim() || '#a3a3a3',
            textPrimary: style.getPropertyValue('--text-primary').trim() || '#fff',
            borderSubtle: style.getPropertyValue('--border-subtle').trim() || 'rgba(255,255,255,0.05)',
            cardioColor: style.getPropertyValue('--color-success').trim() || '#22c55e',
            chestColor: style.getPropertyValue('--color-primary').trim() || '#3b82f6',
        };
    };

    const [colors, setColors] = useState(getColors());

    useEffect(() => {
        // Initial fetch in case styles weren't ready
        setColors(getColors());

        // Listen for theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handleChange = () => {
            // Slight delay to allow CSS to apply
            setTimeout(() => setColors(getColors()), 50);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return colors;
}
