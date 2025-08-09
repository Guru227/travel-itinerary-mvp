import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import CommunityPage from './pages/CommunityPage';
import SharedItineraryPage from './pages/SharedItineraryPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        {/* Global Navigation Bar - Added to all pages */}
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/itinerary/:sessionId" element={<SharedItineraryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;