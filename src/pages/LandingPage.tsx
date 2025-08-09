import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import AgentShowcase from '../components/AgentShowcase';
import PublicItinerariesPreview from '../components/PublicItinerariesPreview';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen"> {/* Removed padding - navbar sits flush */}
      <Hero />
      <Features />
      <AgentShowcase />
      <PublicItinerariesPreview />
    </div>
  );
};

export default LandingPage;