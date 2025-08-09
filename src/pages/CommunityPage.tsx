import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Itinerary } from '../types';
import PublicItineraryCard from '../components/PublicItineraryCard';
import ItineraryPreviewModal from '../components/ItineraryPreviewModal';

const CommunityPage: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPublicItineraries();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = itineraries.filter(itinerary =>
        itinerary.content && 
        typeof itinerary.content === 'object' &&
        (
          (itinerary.content.title && itinerary.content.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (itinerary.content.destination && itinerary.content.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (itinerary.content.summary && itinerary.content.summary.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
      setFilteredItineraries(filtered);
    } else {
      // Show all itineraries that have valid content
      const validItineraries = itineraries.filter(itinerary => {
        const hasValidContent = itinerary.content && 
          typeof itinerary.content === 'object' && 
          itinerary.content.title;
        console.log('Itinerary validation:', itinerary.id, hasValidContent, itinerary.content);
        return hasValidContent;
      });
      setFilteredItineraries(validItineraries);
    }
  }, [searchTerm, itineraries]);

  const loadPublicItineraries = async () => {
    try {
      // Corrected query to follow proper relational path: itineraries -> chat_sessions -> users
      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          *,
          chat_sessions!inner (
            title,
            summary,
            number_of_travelers,
            users!inner (
              nickname,
              email
            )
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Log the data to debug the corrected structure
      console.log('Loaded itineraries:', data);
      
      setItineraries(data || []);
    } catch (error) {
      console.error('Error loading public itineraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-secondary" />
            </Link>
            <div>
              <h1 className="font-poppins font-bold text-2xl text-secondary">
                Community Hub
              </h1>
              <p className="font-lato text-gray-600">
                Discover amazing travel itineraries shared by fellow travelers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations, activities, or trip types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-lato"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-lato text-gray-700">Filters</span>
          </button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-white font-poppins font-bold text-sm">N</span>
            </div>
            <p className="font-lato text-gray-600">Loading community itineraries...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="font-lato text-gray-600">
                {filteredItineraries.length} itineraries found
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItineraries.map((itinerary) => (
                <PublicItineraryCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  onView={setSelectedItinerary}
                />
              ))}
            </div>

            {filteredItineraries.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="font-lato text-gray-600 mb-2">No itineraries found</p>
                <p className="font-lato text-sm text-gray-500">
                  Try adjusting your search terms or browse all available itineraries
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {selectedItinerary && (
        <ItineraryPreviewModal
          itinerary={selectedItinerary}
          onClose={() => setSelectedItinerary(null)}
        />
      )}
    </div>
  );
};

export default CommunityPage;