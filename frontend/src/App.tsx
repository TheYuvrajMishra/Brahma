import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PlaygroundPage } from './pages/PlaygroundPage';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/playground" replace />} />
                <Route path="/playground" element={<PlaygroundPage />} />
                {/* Future pages can be added here */}
            </Routes>
        </Router>
    );
}
