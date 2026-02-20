import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * GestureLayout
 * Wraps a page and enables swipe-to-reveal navigation.
 * 
 * @param {ReactNode} children - The current page content
 * @param {ReactNode} leftPage - The page to reveal when swiping RIGHT (e.g., Calendar)
 * @param {string} leftPath - The path to navigate to for the left page
 * @param {ReactNode} rightPage - The page to reveal when swiping LEFT (e.g., History)
 * @param {string} rightPath - The path to navigate to for the right page
 */
export default function GestureLayout({ children, leftPage, leftPath, rightPage, rightPath, disableDrag = false }) {
    const navigate = useNavigate();
    const x = useMotionValue(0);
    const containerRef = useRef(null);
    const controls = useAnimation();

    // State to lazy-load neighbors
    const [activeNeighbor, setActiveNeighbor] = useState(null); // 'left' or 'right'

    // We use a transparent overlay or the container itself for drag
    // Constraints: We only want horizontal drag.

    const onDragStart = (event, info) => {
        // Determine intended direction roughly? 
        // Actually, we don't know direction until they move.
        // We'll just mount both? No, user said "load screen next".
        // But we can't predict direction 100% on start.
        // Optimization: For now, mount "potential" neighbors transparently? 
        // User's request: "Once a drag starts... load...".
        // Framer motion drag updates 'x'.
        // We can listen to x changes?
    };

    // Better approach: dragging mounts the "Reveal Layer".
    // Since we don't know direction on 'start' easily without logic,
    // let's see if we can derive it.

    // Simplified: Just render neighbors if dragging?
    // If we only render ONE, we need to know which one.
    // If standard swipe options are Calendar(Left) and History(Right),
    // dragging > 0 is Right (Reveal Left). Dragging < 0 is Left (Reveal Right).

    // We can use `onDrag` callback to set state if not set?
    const handleDrag = (event, info) => {
        if (!activeNeighbor) {
            if (info.offset.x > 5 && leftPage) {
                setActiveNeighbor('left');
            } else if (info.offset.x < -5 && rightPage) {
                setActiveNeighbor('right');
            }
        }
    };

    const handleDragEnd = async (event, info) => {
        const threshold = window.innerWidth * 0.25;
        const offset = info.offset.x;

        if (activeNeighbor === 'left' && offset > threshold) {
            await controls.start({ x: window.innerWidth, transition: { duration: 0.2, ease: "easeOut" } });
            navigate(leftPath, { state: { fromSwipe: true } });
        } else if (activeNeighbor === 'right' && offset < -threshold) {
            await controls.start({ x: -window.innerWidth, transition: { duration: 0.2, ease: "easeOut" } });
            navigate(rightPath, { state: { fromSwipe: true } });
        } else {
            // Cancel - Animate back smoothly
            await controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
            setActiveNeighbor(null);
        }
    };

    // Background color: Needs to match the theme.
    // We want the 'reveal' effect.
    // Ensure the children (top layer) has a background so we don't see through it.

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: 'var(--bg-app)' // Ensure base is colored
            }}
        >
            {/* Draggable Container - Slides all screens together */}
            <motion.div
                drag={disableDrag ? false : "x"}
                dragDirectionLock={true}
                dragConstraints={{
                    left: rightPage ? -window.innerWidth : 0,
                    right: leftPage ? window.innerWidth : 0
                }}
                dragElastic={0.2}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{
                    x,
                    width: '100%',
                    height: '100%',
                    position: 'relative', // Context for absolute neighbors
                    zIndex: 10,
                    background: 'var(--bg-app)',
                    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                    touchAction: 'pan-y',
                    willChange: 'transform' // Performance check
                }}
            >
                {/* Left Neighbor (Calendar) */}
                {activeNeighbor === 'left' && leftPage && (
                    <div
                        style={{
                            position: 'absolute',
                            top: window.scrollY,
                            left: '-100%',
                            width: '100%',
                            height: window.innerHeight,
                            overflowY: 'auto',
                            paddingBottom: '120px',
                            background: 'var(--bg-app)'
                        }}
                    >
                        {leftPage}
                    </div>
                )}

                {/* Current Page */}
                <div style={{ width: '100%', height: '100%' }}>
                    {children}
                </div>

                {/* Right Neighbor (History) */}
                {activeNeighbor === 'right' && rightPage && (
                    <div
                        style={{
                            position: 'absolute',
                            top: window.scrollY,
                            left: '100%',
                            width: '100%',
                            height: window.innerHeight,
                            overflowY: 'auto',
                            paddingBottom: '120px',
                            background: 'var(--bg-app)'
                        }}
                    >
                        {rightPage}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
