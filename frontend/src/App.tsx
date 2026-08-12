import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ContextCorePage } from './pages/ContextCorePage';
import { AuditTelemetryPage } from './pages/AuditTelemetryPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Standalone Public Legal Routes (Google OAuth Verification Compliant) */}
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />

                {/* Authenticated Main App Routes */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/playground" replace />} />
                    <Route path="playground" element={<PlaygroundPage />} />
                    <Route path="context" element={<ContextCorePage />} />
                    <Route path="logs" element={<AuditTelemetryPage />} />
                </Route>

                {/* Fallback redirect */}
                <Route path="*" element={<Navigate to="/playground" replace />} />
            </Routes>
        </Router>
    );
}

