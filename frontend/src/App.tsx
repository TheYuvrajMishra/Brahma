import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import PlaygroundChat from './pages/PlaygroundChat';
import BrahmaBrain from './pages/BrahmaBrain';
import Skills from './pages/Skills';
import Keymanager from './pages/Keymanager';
import CronJobs from './pages/CronJobs';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/playground" element={<PlaygroundChat />} />
          <Route path="/brain" element={<BrahmaBrain />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/keys" element={<Keymanager />} />
          <Route path="/cron" element={<CronJobs />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
