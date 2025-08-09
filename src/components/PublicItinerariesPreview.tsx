import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Itinerary } from '../types';
import PublicItineraryCard from './PublicItineraryCard';
import ItineraryPreviewModal from './ItineraryPreviewModal';

const PublicItinerariesPreview: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLatestItineraries();
  }, []);

  const loadLatestItineraries = async () => {
    try {
      // Fixed API endpoint logic - Ensure we're querying for public itineraries correctly
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setItineraries(data || []);
    } catch (error) {
      console.error('Error loading latest itineraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-poppins font-bold text-sm">N</span>
          </div>
          <p className="font-lato text-gray-600">Loading community itineraries...</p>
        </div>
      </section>
    );
  }

  if (itineraries.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-secondary mb-4">
            Community Itineraries
          </h2>
          <p className="font-lato text-xl text-gray-600 mb-8">
            Get inspired by amazing travel plans shared by fellow adventurers
          </p>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-poppins font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Explore All Itineraries
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <PublicItineraryCard
              key={itinerary.id}
              itinerary={itinerary}
              onView={setSelectedItinerary}
            />
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {selectedItinerary && (
        <ItineraryPreviewModal
          itinerary={selectedItinerary}
          onClose={() => setSelectedItinerary(null)}
        />
      )}
    </section>
  );
};

export default PublicItinerariesPreview;