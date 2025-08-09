import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import AgentShowcase from '../components/AgentShowcase';
import PublicItinerariesPreview from '../components/PublicItinerariesPreview';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-16"> {/* Add top padding for fixed navbar */}
      <Hero />
      <Features />
      <AgentShowcase />
      <PublicItinerariesPreview />
    </div>
  );
};

export default LandingPage;