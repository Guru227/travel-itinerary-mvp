import React from 'react';
import { Clock, MapPin, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { ItineraryItem } from '../types';

interface ScheduleViewProps {
  items: ItineraryItem[];
  onItemClick: (item: ItineraryItem) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ items, onItemClick }) => {
  // Group items by day
  const itemsByDay = items.reduce((acc, item) => {
    const day = item.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  // Sort days
  const sortedDays = Object.keys(itemsByDay).sort((a, b) => parseInt(a) - parseInt(b));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'suggested': return <Sparkles className="w-4 h-4 text-yellow-500" />;
      case 'placeholder': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'suggested':
        return 'border-yellow-300 bg-yellow-50 shadow-md transform scale-105 animate-pulse';
      case 'placeholder':
        return 'border-gray-300 bg-gray-50 opacity-75';
      case 'confirmed':
      default:
        return 'border-gray-200 bg-white hover:shadow-md hover:border-primary/30';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {sortedDays.map((dayStr) => {
        const day = parseInt(dayStr);
        const dayItems = itemsByDay[day].sort((a, b) => {
          const timeA = a.time || '00:00';
          const timeB = b.time || '00:00';
          return timeA.localeCompare(timeB);
        });

        return (
          <div key={day} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-poppins font-bold text-lg">{day}</span>
              </div>
              <div>
                <h2 className="font-poppins font-bold text-xl text-secondary">
                  Day {day}
                </h2>
                {dayItems[0]?.data?.date && (
                  <p className="font-lato text-gray-600">
                    {new Date(dayItems[0].day ? `2024-01-${dayItems[0].day.toString().padStart(2, '0')}` : Date.now()).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="ml-6 space-y-3">
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${getStatusStyle(item.status)}`}
                  onClick={() => onItemClick(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {item.time && (
                          <div className="flex items-center gap-1 text-primary font-lato font-semibold text-sm">
                            <Clock className="w-4 h-4" />
                            {item.time}
                          </div>
                        )}
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <h3 className="font-poppins font-bold text-lg text-secondary mb-2">
                        {item.data.title}
                      </h3>
                      
                      {item.data.description && (
                        <p className="font-lato text-gray-600 mb-3 leading-relaxed">
                          {item.data.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        {item.data.location && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span className="font-lato">{item.data.location}</span>
                          </div>
                        )}
                        
                        {item.data.cost && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-lato font-semibold">{item.data.cost}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleView;