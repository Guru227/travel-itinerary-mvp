import React from 'react';
import { useNavigate } from 'react-router-dom';

const AgentShowcase: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-secondary mb-4">
            Meet Your Travel Assistant
          </h2>
          <p className="font-lato text-xl text-gray-600">
            Powered by advanced AI to understand your travel dreams
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-surface to-white p-8 md:p-12 rounded-2xl border-2 border-primary/20 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-4 border-primary/20">
              <img 
                src="/images/nomad.png" 
                alt="Nomad's Compass Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-poppins font-bold text-2xl md:text-3xl text-secondary mb-2">
                Nomad's Compass
              </h3>
              <p className="font-poppins font-semibold text-primary text-lg mb-4">
                Your AI Travel Planning Expert
              </p>
              <p className="font-lato text-gray-700 leading-relaxed mb-6">
                With extensive knowledge of destinations worldwide, cultural insights, and budget optimization techniques, 
                I'm here to transform your travel ideas into detailed, actionable itineraries. Whether you're seeking 
                adventure, relaxation, cultural immersion, or culinary experiences, I'll craft the perfect journey for you.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {['Destination Expert', 'Budget Optimizer', 'Cultural Guide', 'Adventure Planner'].map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary font-lato font-semibold text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <button
                onClick={() => navigate('/chat')}
                className="bg-primary hover:bg-primary/90 text-white font-poppins font-bold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentShowcase;