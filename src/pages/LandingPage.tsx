import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import AgentShowcase from '../components/AgentShowcase';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <AgentShowcase />
    </div>
  );
};

export default LandingPage;