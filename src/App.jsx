import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import WorkoutSession from './pages/WorkoutSession';
import WorkoutComplete from './pages/WorkoutComplete';
import ExerciseHistory from './pages/ExerciseHistory';
import ExerciseAnalytics from './pages/ExerciseAnalytics';
import Calendar from './pages/Calendar';
import { Dumbbell, Calendar as CalendarIcon, LineChart } from 'lucide-react';
import { useWorkout } from './store/WorkoutContext';

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

function App() {
  const location = useLocation();
  const { activeWorkout } = useWorkout();

  return (
    <div className="app-container">
      <main style={{ flex: 1, paddingBottom: '80px' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/session" element={<PageTransition><WorkoutSession /></PageTransition>} />
            <Route path="/history" element={<PageTransition><ExerciseHistory /></PageTransition>} />
            <Route path="/completed" element={<PageTransition><WorkoutComplete /></PageTransition>} />
            <Route path="/analytics" element={<PageTransition><ExerciseAnalytics /></PageTransition>} />
            <Route path="/calendar" element={<PageTransition><Calendar /></PageTransition>} />
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
        <Link to="/calendar" style={{
          color: location.pathname === '/calendar' ? 'var(--color-primary)' : 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textShadow: location.pathname === '/calendar' ? '0 0 10px var(--color-primary-glow)' : 'none'
        }}>
          <CalendarIcon size={26} />
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
            ? '6px 6px 12px rgba(0,0,0,0.4), -4px -4px 10px rgba(255,255,255,0.1)' // Neumorphic Pop
            : 'var(--shadow-convex)',
          border: '4px solid var(--bg-app)' // Matches background to create "cutout" effect
        }}>
          <Dumbbell size={28} strokeWidth={2.5} />
        </Link>

        <Link to="/history" style={{
          color: location.pathname === '/history' ? 'var(--color-primary)' : 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <LineChart size={26} />
        </Link>
      </nav>
    </div>
  )
}

export default App
