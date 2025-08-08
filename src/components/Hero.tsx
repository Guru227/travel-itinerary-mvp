import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="relative h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`
      }}
    >
      <div className="text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="font-poppins font-bold text-5xl md:text-7xl mb-6 leading-tight">
          Your Adventure,<br />
          <span className="text-primary">Reimagined.</span>
        </h1>
        <p className="font-lato text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
          Discover personalized travel experiences crafted by AI. From hidden gems to must-see destinations, let us plan your perfect journey.
        </p>
        <button
          onClick={() => navigate('/chat')}
          className="bg-primary hover:bg-primary/90 text-white font-poppins font-bold px-8 py-4 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Start Planning
        </button>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;