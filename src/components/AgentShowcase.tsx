import React from 'react';
import { useNavigate } from 'react-router-dom';
import { personas } from '../data/personas';

const AgentShowcase: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-secondary mb-4">
            Meet Your Travel Assistants
          </h2>
          <p className="font-lato text-xl text-gray-600">
            Choose from our specialized AI travel experts, each designed for different travel styles
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {personas.map((persona) => (
            <div 
              key={persona.id}
              className={`relative bg-gradient-to-br from-surface to-white p-6 md:p-8 rounded-2xl border-2 shadow-xl transition-all duration-300 ${
                persona.status === 'active' 
                  ? 'border-primary/20 hover:shadow-2xl hover:-translate-y-1' 
                  : 'border-gray-200 opacity-75'
              }`}
            >
              {/* Coming Soon Badge */}
              {persona.status === 'coming_soon' && (
                <div className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-poppins font-bold">
                  Coming Soon
                </div>
              )}
              
              <div className="text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg border-4 border-primary/20 mx-auto mb-4">
                  <img 
                    src={persona.avatarUrl} 
                    alt={`${persona.name} Avatar`} 
                    className={`w-full h-full object-cover ${
                      persona.status === 'coming_soon' ? 'grayscale' : ''
                    }`}
                  />
                </div>
                
                <h3 className="font-poppins font-bold text-xl md:text-2xl text-secondary mb-2">
                  {persona.name}
                </h3>
                <p className="font-poppins font-semibold text-primary text-md mb-4">
                  {persona.tagline}
                </p>
                <p className="font-lato text-gray-700 leading-relaxed mb-6 text-sm">
                  {persona.description}
                </p>
                
                {persona.skills && (
                  <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {persona.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className={`px-2 py-1 font-lato font-semibold text-xs rounded-full ${
                          persona.status === 'active'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => persona.status === 'active' && navigate('/chat')}
                  disabled={persona.status === 'coming_soon'}
                  className={`w-full font-poppins font-bold px-6 py-3 rounded-lg transition-all duration-300 ${
                    persona.status === 'active'
                      ? 'bg-primary hover:bg-primary/90 text-white transform hover:scale-105 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {persona.status === 'active' ? 'Start Chatting' : 'Coming Soon'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentShowcase;