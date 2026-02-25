import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import WorkoutSession from './pages/WorkoutSession';
import WorkoutComplete from './pages/WorkoutComplete';
import HistoryHub from './pages/HistoryHub';
import ExerciseAnalytics from './pages/ExerciseAnalytics';
import { Dumbbell, LineChart, User } from 'lucide-react';
import { useWorkout } from './store/WorkoutContext';

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import GestureLayout from './components/GestureLayout';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const location = useLocation();
  const { activeWorkout } = useWorkout();

  return (
    <div className="app-container">
      <ScrollToTop />
      <main style={{ flex: 1, paddingBottom: 'var(--navbar-clearance)' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={
              <PageTransition>
                <GestureLayout
                  leftPage={<HistoryHub />}
                  leftPath="/history"
                >
                  <Home />
                </GestureLayout>
              </PageTransition>
            } />
            <Route path="/session" element={<PageTransition><WorkoutSession /></PageTransition>} />
            <Route path="/history" element={
              <PageTransition>
                <GestureLayout
                  rightPage={<Home />}
                  rightPath="/"
                >
                  <HistoryHub />
                </GestureLayout>
              </PageTransition>
            } />
            <Route path="/completed" element={<PageTransition><WorkoutComplete /></PageTransition>} />
            <Route path="/analytics" element={<PageTransition><ExerciseAnalytics /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-app)', // Use variable
        boxShadow: '0 -4px 10px rgba(0,0,0,0.2)', // Top shadow
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.5rem 1rem 1.5rem 1rem',
        height: '76px', // Slightly taller for the floating button
        zIndex: 100
      }}>
        <Link to="/history" style={{
          color: location.pathname === '/history' ? 'var(--color-primary)' : 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textShadow: location.pathname === '/history' ? '0 0 10px var(--color-primary-glow)' : 'none'
        }}>
          <LineChart size={26} />
        </Link>

        {/* Floating Action Button */}
        <Link to={activeWorkout ? '/session' : '/'} style={{
          color: (location.pathname === '/' || location.pathname === '/session') ? '#fff' : 'var(--text-muted)',
          background: (location.pathname === '/' || location.pathname === '/session') ? 'var(--color-primary)' : 'var(--bg-card)',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-32px',
          boxShadow: (location.pathname === '/' || location.pathname === '/session')
            ? '6px 6px 12px rgba(0,0,0,0.4), -4px -4px 10px rgba(255,255,255,0.1)'
            : 'var(--shadow-convex)',
          border: '4px solid var(--bg-app)'
        }}>
          <Dumbbell size={28} strokeWidth={2.5} />
        </Link>

        {/* Profile placeholder — to be implemented */}
        <div style={{
          color: 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: 0.4,
          cursor: 'default'
        }}>
          <User size={26} />
        </div>
      </nav>
    </div>
  )
}

export default App
