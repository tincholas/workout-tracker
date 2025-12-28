import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import WorkoutSession from './pages/WorkoutSession';
import ExerciseHistory from './pages/ExerciseHistory';
import ExerciseAnalytics from './pages/ExerciseAnalytics';
import Calendar from './pages/Calendar';
import { Dumbbell, Calendar as CalendarIcon, BarChart } from 'lucide-react';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <main style={{ flex: 1, paddingBottom: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/session" element={<WorkoutSession />} />
          <Route path="/history" element={<ExerciseHistory />} />
          <Route path="/analytics" element={<ExerciseAnalytics />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
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
        padding: '1rem',
        zIndex: 100
      }}>
        <Link to="/" style={{ color: location.pathname === '/' ? 'var(--color-primary)' : 'var(--text-muted)' }}>
          <Dumbbell />
        </Link>
        <Link to="/calendar" style={{ color: location.pathname === '/calendar' ? 'var(--color-primary)' : 'var(--text-muted)' }}>
          <CalendarIcon />
        </Link>
        <Link to="/history" style={{ color: location.pathname === '/history' ? 'var(--color-primary)' : 'var(--text-muted)' }}>
          <BarChart />
        </Link>
      </nav>
    </div>
  )
}

export default App
