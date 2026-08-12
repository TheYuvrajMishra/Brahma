import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ContextCorePage } from './pages/ContextCorePage';
import { AuditTelemetryPage } from './pages/AuditTelemetryPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';

export default function App() {
    return (
        <Router>
            <Routes>
                {/* 1. Public Homepage (Google OAuth Verification Compliant - Public & Unauthenticated) */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />

                {/* 2. Public Legal Routes (Google OAuth Verification Compliant) */}
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />

                {/* 3. Authenticated App Routes */}
                <Route path="/playground" element={<MainLayout />}>
                    <Route index element={<PlaygroundPage />} />
                </Route>
                <Route path="/context" element={<MainLayout />}>
                    <Route index element={<ContextCorePage />} />
                </Route>
                <Route path="/logs" element={<MainLayout />}>
                    <Route index element={<AuditTelemetryPage />} />
                </Route>

                {/* Catch-all fallback to public homepage */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
