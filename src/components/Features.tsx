import React from 'react';
import { Compass, Users, Bookmark } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Compass,
      title: 'Smart Itinerary Planning',
      description: 'Our AI analyzes your preferences, budget, and travel style to create personalized itineraries that match your unique interests and needs.'
    },
    {
      icon: Users,
      title: 'Group Travel Made Easy',
      description: 'Planning with friends or family? Our assistant considers everyone\'s preferences to create experiences that satisfy the entire group.'
    },
    {
      icon: Bookmark,
      title: 'Save & Share Plans',
      description: 'Save your favorite itineraries and share them with fellow travelers. Build a collection of dream destinations for future adventures.'
    }
  ];

  return (
    <section className="py-20 px-4 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-secondary mb-4">
            Why Choose Nomad's Compass?
          </h2>
          <p className="font-lato text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of travel planning with intelligent recommendations and seamless organization.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-poppins font-bold text-xl text-secondary mb-4">
                  {feature.title}
                </h3>
                <p className="font-lato text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;