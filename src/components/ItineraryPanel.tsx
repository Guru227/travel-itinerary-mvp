import React, { useState } from 'react';
import { Calendar, CheckSquare, Map, Download, Share2, Save, Loader, Mail } from 'lucide-react';
import { ItineraryData } from '../types';

interface ItineraryPanelProps {
  itineraryData: ItineraryData | null;
  isConverting: boolean;
  onConvert: () => void;
  onSave: () => void;
  onShare: () => void;
  onMail: () => void;
}

const ItineraryPanel: React.FC<ItineraryPanelProps> = ({
  itineraryData,
  isConverting,
  onConvert,
  onSave,
  onShare,
  onMail
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'checklist' | 'map'>('schedule');

  const tabs = [
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'map', label: 'Map View', icon: Map },
  ];

  const renderSchedule = () => {
    if (!itineraryData?.daily_schedule) return null;

    return (
      <div className="space-y-6">
        {itineraryData.daily_schedule.map((day) => (
          <div key={day.day} className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-poppins font-bold text-lg text-secondary mb-4">
              Day {day.day} - {day.date}
            </h3>
            
            {/* Morning Activities */}
            {day.morning && day.morning.length > 0 && (
              <div className="mb-4">
                <h4 className="font-poppins font-semibold text-md text-secondary mb-2 flex items-center gap-2">
                  🌅 Morning
                </h4>
                <div className="space-y-2 ml-4">
                  {day.morning.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-yellow-600 font-lato font-semibold text-sm min-w-[60px]">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-lato font-semibold text-secondary">
                          {activity.title}
                        </h5>
                        <p className="text-gray-600 font-lato text-sm mt-1">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-gray-500 font-lato text-xs mt-1">
                            📍 {activity.location}
                          </p>
                        )}
                        {activity.cost && (
                          <p className="text-yellow-600 font-lato text-xs mt-1">
                            💰 {activity.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Activities */}
            {day.afternoon && day.afternoon.length > 0 && (
              <div className="mb-4">
                <h4 className="font-poppins font-semibold text-md text-secondary mb-2 flex items-center gap-2">
                  ☀️ Afternoon
                </h4>
                <div className="space-y-2 ml-4">
                  {day.afternoon.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div className="text-orange-600 font-lato font-semibold text-sm min-w-[60px]">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-lato font-semibold text-secondary">
                          {activity.title}
                        </h5>
                        <p className="text-gray-600 font-lato text-sm mt-1">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-gray-500 font-lato text-xs mt-1">
                            📍 {activity.location}
                          </p>
                        )}
                        {activity.cost && (
                          <p className="text-orange-600 font-lato text-xs mt-1">
                            💰 {activity.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evening Activities */}
            {day.evening && day.evening.length > 0 && (
              <div className="mb-4">
                <h4 className="font-poppins font-semibold text-md text-secondary mb-2 flex items-center gap-2">
                  🌙 Evening
                </h4>
                <div className="space-y-2 ml-4">
                  {day.evening.map((activity, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                      <div className="text-indigo-600 font-lato font-semibold text-sm min-w-[60px]">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-lato font-semibold text-secondary">
                          {activity.title}
                        </h5>
                        <p className="text-gray-600 font-lato text-sm mt-1">
                          {activity.description}
                        </p>
                        {activity.location && (
                          <p className="text-gray-500 font-lato text-xs mt-1">
                            📍 {activity.location}
                          </p>
                        )}
                        {activity.cost && (
                          <p className="text-indigo-600 font-lato text-xs mt-1">
                            💰 {activity.cost}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderChecklist = () => {
    if (!itineraryData?.checklist) return null;

    return (
      <div className="space-y-6">
        {itineraryData.checklist.map((category, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-poppins font-bold text-lg text-secondary mb-3">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <label key={itemIndex} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="font-lato text-secondary">{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMap = () => {
    if (!itineraryData?.map_locations) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="font-lato text-gray-600">
            Interactive map view coming soon
          </p>
          <p className="font-lato text-sm text-gray-500 mt-1">
            Map integration with Google Maps/Mapbox will be implemented here
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-poppins font-bold text-lg text-secondary mb-3">
            Key Locations
          </h3>
          <div className="space-y-2">
            {itineraryData.map_locations.map((location, index) => (
              <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <p className="font-lato font-semibold text-secondary">{location.name}</p>
                  <p className="font-lato text-sm text-gray-600">{location.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-bold text-xl text-secondary">
            {itineraryData ? itineraryData.title : 'Itinerary View'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={!itineraryData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Save & Share Itinerary"
            >
              <Save className="w-4 h-4 text-secondary" />
            </button>
            <button
              onClick={onShare}
              disabled={!itineraryData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Save & Share to Community"
            >
              <Share2 className="w-4 h-4 text-secondary" />
            </button>
            <button
              onClick={onMail}
              disabled={!itineraryData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Email Itinerary"
            >
              <Mail className="w-4 h-4 text-secondary" />
            </button>
          </div>
        </div>

        {!itineraryData && (
          <button
            onClick={onConvert}
            disabled={isConverting}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white font-poppins font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isConverting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Converting Itinerary...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Convert Itinerary
              </>
            )}
          </button>
        )}

        {itineraryData && (
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 font-lato font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-secondary'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!itineraryData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="font-lato text-gray-600 mb-2">No itinerary converted yet</p>
              <p className="font-lato text-sm text-gray-500">
                Click "Convert Itinerary" to process your travel plan
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'schedule' && renderSchedule()}
            {activeTab === 'checklist' && renderChecklist()}
            {activeTab === 'map' && renderMap()}
          </>
        )}
      </div>
    </div>
  );
};

export default ItineraryPanel;