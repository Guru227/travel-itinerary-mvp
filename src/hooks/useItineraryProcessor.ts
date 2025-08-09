/**
 * React Hook for Itinerary Processing
 * 
 * This hook provides a clean interface for React components to use the
 * itinerary processor functionality with proper state management.
 */

import { useState, useCallback } from 'react';
import {
  generateStructuredItinerary,
  updateUIComponents,
  processAndUpdateItinerary,
  StructuredItinerary,
  ItineraryProcessorError,
  ScheduleItem,
  ChecklistCategory,
  MapPin
} from '../lib/itineraryProcessor';

interface UseItineraryProcessorState {
  isProcessing: boolean;
  error: string | null;
  structuredData: StructuredItinerary | null;
}

interface UseItineraryProcessorReturn extends UseItineraryProcessorState {
  processItinerary: (itineraryText: string) => Promise<StructuredItinerary | null>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing itinerary processing state and operations
 * 
 * @param onScheduleUpdate - Callback when schedule data is updated
 * @param onChecklistUpdate - Callback when checklist data is updated  
 * @param onMapUpdate - Callback when map data is updated
 * @param onMetadataUpdate - Callback when metadata is updated
 */
export function useItineraryProcessor(
  onScheduleUpdate?: (schedule: ScheduleItem[]) => void,
  onChecklistUpdate?: (checklist: ChecklistCategory[]) => void,
  onMapUpdate?: (mapPins: MapPin[]) => void,
  onMetadataUpdate?: (metadata: {
    title: string;
    summary: string;
    destination: string;
    duration: string;
    travelers: number;
  }) => void
): UseItineraryProcessorReturn {
  
  const [state, setState] = useState<UseItineraryProcessorState>({
    isProcessing: false,
    error: null,
    structuredData: null
  });

  const processItinerary = useCallback(async (itineraryText: string): Promise<StructuredItinerary | null> => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null
    }));

    try {
      const structuredData = await processAndUpdateItinerary(
        itineraryText,
        {
          onScheduleUpdate,
          onChecklistUpdate,
          onMapUpdate,
          onMetadataUpdate
        },
        {
          includeCoordinates: true,
          includeCostEstimates: true,
          maxRetries: 2
        }
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        structuredData,
        error: null
      }));

      return structuredData;

    } catch (error) {
      let errorMessage = 'An unexpected error occurred while processing the itinerary.';
      
      if (error instanceof ItineraryProcessorError) {
        switch (error.code) {
          case 'API_ERROR':
            errorMessage = 'Failed to connect to the processing service. Please try again.';
            break;
          case 'PARSING_ERROR':
            errorMessage = 'The itinerary format could not be processed. Please try with a different itinerary.';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = 'The processed data was invalid. Please check your itinerary content.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network connection failed. Please check your internet connection.';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));

      console.error('Itinerary processing error:', error);
      return null;
    }
  }, [onScheduleUpdate, onChecklistUpdate, onMapUpdate, onMetadataUpdate]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      structuredData: null
    });
  }, []);

  return {
    ...state,
    processItinerary,
    clearError,
    reset
  };
}