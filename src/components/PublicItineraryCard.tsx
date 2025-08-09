import React from 'react';
import { MapPin, Users, Calendar, Eye } from 'lucide-react';
import { Itinerary } from '../types';

interface PublicItineraryCardProps {
  itinerary: Itinerary;
  onView: (itinerary: Itinerary) => void;
}

const PublicItineraryCard: React.FC<PublicItineraryCardProps> = ({ itinerary, onView }) => {
  const data = itinerary.content;

  // Return null if data is missing to prevent rendering incomplete card
  if (!data) {
    console.log('PublicItineraryCard: No data for itinerary', itinerary.id);
    return null;
  }

  console.log('PublicItineraryCard: Rendering itinerary', itinerary.id, data);

  // Get author display name - nickname or email username
  const getAuthorName = () => {
    if (itinerary.chat_sessions?.users?.nickname) {
      return itinerary.chat_sessions.users.nickname;
    }
    if (itinerary.chat_sessions?.users?.email) {
      return itinerary.chat_sessions.users.email.split('@')[0];
    }
    return 'Anonymous';
  };
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-poppins font-bold text-xl text-secondary line-clamp-2">
            {data.title}
          </h3>
          <button
            onClick={() => onView(itinerary)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <p className="font-lato text-gray-600 mb-4 line-clamp-3">
          {data.summary}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="font-lato">{data.destination}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="font-lato">{data.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="font-lato">{data.number_of_travelers} travelers</span>
          </div>
        </div>
        
        {/* Author information */}
        <div className="mb-4 text-xs text-gray-400 font-lato">
          Created by {getAuthorName()}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-lato">
            Shared {new Date(itinerary.created_at).toLocaleDateString()}
          </span>
          <button
            onClick={() => onView(itinerary)}
            className="bg-primary hover:bg-primary/90 text-white font-lato font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicItineraryCard;