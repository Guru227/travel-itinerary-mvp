import React from 'react';
import { Check, Sparkles, AlertCircle } from 'lucide-react';
import { ItineraryItem } from '../types';

interface ChecklistViewProps {
  items: ItineraryItem[];
  onItemToggle?: (itemId: string, completed: boolean) => void; // FIXED: Make optional
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ items, onItemToggle }) => {
  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.data.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

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
        return 'border-yellow-300 bg-yellow-50 animate-pulse';
      case 'placeholder':
        return 'border-gray-300 bg-gray-50 opacity-75';
      case 'confirmed':
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="p-6 space-y-8">
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <div key={category} className="space-y-4">
          <h2 className="font-poppins font-bold text-xl text-secondary flex items-center gap-2">
            {category}
            <span className="text-sm font-lato font-normal text-gray-500">
              ({categoryItems.filter(item => item.data.completed).length}/{categoryItems.length})
            </span>
          </h2>
          
          <div className="space-y-3">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                id={`item-${item.id}`}
                className={`border rounded-lg p-4 transition-all duration-300 ${getStatusStyle(item.status)}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onItemToggle?.(item.id, !item.data.completed)} // FIXED: Optional chaining
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      item.data.completed
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {item.data.completed && <Check className="w-3 h-3" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-lato ${
                        item.data.completed 
                          ? 'line-through text-gray-500' 
                          : 'text-secondary'
                      }`}>
                        {item.data.task}
                      </span>
                      {getStatusIcon(item.status)}
                    </div>
                    
                    {item.data.notes && (
                      <p className="font-lato text-sm text-gray-500 mt-1">
                        {item.data.notes}
                      </p>
                    )}
                    
                    {item.data.priority && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-lato font-semibold mt-2 ${
                        item.data.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : item.data.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.data.priority} priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChecklistView;