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
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.5rem 1rem 1.5rem 1rem', // Reduced padding
        height: '70px', // Reduced height
        zIndex: 100
      }}>
        <Link to="/calendar" style={{
          color: location.pathname === '/calendar' ? 'var(--color-primary)' : 'var(--text-muted)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <CalendarIcon size={26} />
        </Link>

        <Link to={activeWorkout ? '/session' : '/'} style={{
          color: (location.pathname === '/' || location.pathname === '/session') ? '#000' : '#fff',
          background: (location.pathname === '/' || location.pathname === '/session') ? 'var(--color-primary)' : 'var(--text-muted)',
          borderRadius: '50%',
          width: '52px', // Slightly larger than 26px icons (standard button size)
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-24px', // Reduced float
          boxShadow: (location.pathname === '/' || location.pathname === '/session') ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
          border: '3px solid #111'
        }}>
          <Dumbbell size={28} color={(location.pathname === '/' || location.pathname === '/session') ? '#000' : '#fff'} strokeWidth={2.5} />
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
