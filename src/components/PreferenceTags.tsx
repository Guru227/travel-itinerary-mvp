import React from 'react';
import { X, DollarSign, Utensils, Clock, Heart, Home, Car } from 'lucide-react';
import { PreferenceTag } from '../types';

interface PreferenceTagsProps {
  preferences: PreferenceTag[];
  onRemovePreference: (preferenceId: string) => void;
}

const PreferenceTags: React.FC<PreferenceTagsProps> = ({ preferences, onRemovePreference }) => {
  if (preferences.length === 0) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'budget': return DollarSign;
      case 'cuisine': return Utensils;
      case 'pace': return Clock;
      case 'interests': return Heart;
      case 'accommodation': return Home;
      case 'transport': return Car;
      default: return Heart;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'budget': return 'bg-green-100 text-green-800 border-green-200';
      case 'cuisine': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pace': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interests': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accommodation': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'transport': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="font-lato font-semibold text-sm text-gray-600">
          Your Preferences:
        </span>
        <div className="flex flex-wrap gap-2">
          {preferences.map((preference) => {
            const IconComponent = getCategoryIcon(preference.category);
            const colorClass = getCategoryColor(preference.category);
            
            return (
              <div
                key={preference.id}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-lato font-medium transition-all duration-200 hover:shadow-sm ${colorClass}`}
              >
                <IconComponent className="w-3 h-3" />
                <span>{preference.label}</span>
                {preference.removable && (
                  <button
                    onClick={() => onRemovePreference(preference.id)}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                    title={`Remove "${preference.label}" preference`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PreferenceTags;