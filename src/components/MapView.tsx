import React from 'react';
import { Map, MapPin, Navigation } from 'lucide-react';
import { ItineraryItem, ItineraryData } from '../types';

interface MapViewProps {
  items: ItineraryItem[];
  itineraryData: ItineraryData | null;
}

const MapView: React.FC<MapViewProps> = ({ items, itineraryData }) => {
  // Extract locations from items and itinerary data
  const locations = [
    ...(itineraryData?.map_locations || []),
    ...items
      .filter(item => item.data.location)
      .map(item => ({
        name: item.data.title || item.data.location,
        address: item.data.location,
        lat: 0, // Would need geocoding
        lng: 0,
        type: 'activity' as const,
        day: item.day
      }))
  ];

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return '🏨';
      case 'restaurant': return '🍽️';
      case 'attraction': return '🎯';
      case 'transport': return '🚌';
      case 'activity': return '📍';
      default: return '📍';
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'accommodation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'restaurant': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'attraction': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'transport': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'activity': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Map Placeholder */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center border-2 border-dashed border-blue-200">
        <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Map className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="font-poppins font-bold text-xl text-secondary mb-2">
          Interactive Map Coming Soon
        </h3>
        <p className="font-lato text-gray-600 mb-4">
          Full map integration with Google Maps/Mapbox will be implemented here
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
          <Navigation className="w-4 h-4" />
          <span className="font-lato font-semibold">Route Planning & Navigation</span>
        </div>
      </div>

      {/* Locations List */}
      {locations.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-poppins font-bold text-xl text-secondary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Key Locations ({locations.length})
          </h2>
          
          <div className="grid gap-3">
            {locations.map((location, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getLocationTypeIcon(location.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-poppins font-bold text-secondary mb-1">
                        {location.name}
                      </h3>
                      <p className="font-lato text-gray-600 text-sm mb-2">
                        {location.address}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-lato font-semibold border ${getLocationTypeColor(location.type)}`}>
                          {location.type}
                        </span>
                        {location.day && (
                          <span className="px-2 py-1 rounded-full text-xs font-lato font-semibold bg-primary/10 text-primary border border-primary/20">
                            Day {location.day}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Navigation className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-lato text-gray-600 mb-2">No locations added yet</p>
          <p className="font-lato text-sm text-gray-500">
            Add activities with specific locations to see them on the map
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;