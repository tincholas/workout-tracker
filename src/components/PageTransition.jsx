import { motion } from 'framer-motion';

import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const isSwipe = location.state?.fromSwipe;

    if (isSwipe) {
        return <div style={{ width: '100%', height: '100%' }}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
