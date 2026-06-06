import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ContextCorePage } from './pages/ContextCorePage';
import { AuditTelemetryPage } from './pages/AuditTelemetryPage';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/playground" replace />} />
                    <Route path="playground" element={<PlaygroundPage />} />
                    <Route path="context" element={<ContextCorePage />} />
                    <Route path="logs" element={<AuditTelemetryPage />} />
                </Route>
            </Routes>
        </Router>
    );
}
