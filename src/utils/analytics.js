export const trackEvent = (eventName, params = {}) => {
    try {
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        } else if (import.meta.env.DEV) {
            console.log(`[GA Mock] ${eventName}:`, params);
        }
    } catch (error) {
        console.error('GA Error:', error);
    }
};
