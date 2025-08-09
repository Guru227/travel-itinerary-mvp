/**
 * Itinerary Processor - Converts natural language travel plans into structured JSON
 * 
 * This module provides functionality to take AI-generated travel text and convert it
 * into structured data suitable for rendering in Schedule, Checklist, and Map views.
 */

import { supabase } from './supabase';

// Define the structured itinerary data types
export interface StructuredItinerary {
  tripTitle: string;
  summary: string;
  destination: string;
  duration: string;
  numberOfTravelers: number;
  schedule: ScheduleItem[];
  checklist: ChecklistCategory[];
  mapPins: MapPin[];
}

export interface ScheduleItem {
  day: number;
  date: string;
  time: string;
  activity: string;
  description: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  estimatedCost?: string;
}

export interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  task: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface MapPin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'accommodation' | 'restaurant' | 'attraction' | 'transport' | 'activity';
  day?: number;
  description?: string;
}

// Error types for better error handling
export class ItineraryProcessorError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'PARSING_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ItineraryProcessorError';
  }
}

/**
 * Core function to generate structured itinerary from natural language text
 * 
 * @param itineraryText - The raw AI-generated travel plan text
 * @param options - Optional configuration for the conversion process
 * @returns Promise<StructuredItinerary> - The structured itinerary data
 */
export async function generateStructuredItinerary(
  itineraryText: string,
  options: {
    includeCoordinates?: boolean;
    includeCostEstimates?: boolean;
    maxRetries?: number;
  } = {}
): Promise<StructuredItinerary> {
  const {
    includeCoordinates = true,
    includeCostEstimates = true,
    maxRetries = 2
  } = options;

  // Validate input
  if (!itineraryText || itineraryText.trim().length === 0) {
    throw new ItineraryProcessorError(
      'No itinerary text provided',
      'VALIDATION_ERROR'
    );
  }

  // Construct the detailed prompt for Gemini
  const conversionPrompt = `You are an expert travel data parser. Convert the following travel itinerary text into a structured JSON format. Be precise and extract all relevant information.

CRITICAL: Return ONLY valid JSON, no additional text, explanations, or markdown formatting.

Required JSON Structure:
{
  "tripTitle": "Descriptive trip title",
  "summary": "2-3 sentence trip summary",
  "destination": "Primary destination/city",
  "duration": "Trip length (e.g., '7 days', '2 weeks')",
  "numberOfTravelers": 2,
  "schedule": [
    {
      "day": 1,
      "date": "2024-03-15",
      "time": "09:00",
      "activity": "Activity name",
      "description": "Detailed activity description",
      "location": "Specific location name",
      ${includeCoordinates ? '"coordinates": { "lat": 35.6762, "lng": 139.6503 },' : ''}
      ${includeCostEstimates ? '"estimatedCost": "$50 per person"' : ''}
    }
  ],
  "checklist": [
    {
      "category": "Documents",
      "items": [
        {
          "task": "Obtain passport",
          "completed": false,
          "priority": "high",
          "notes": "Required 6 months validity"
        }
      ]
    },
    {
      "category": "Packing",
      "items": [
        {
          "task": "Pack comfortable walking shoes",
          "completed": false,
          "priority": "medium"
        }
      ]
    }
  ],
  "mapPins": [
    {
      "id": "pin_1",
      "name": "Tokyo Station",
      "address": "1 Chome Marunouchi, Chiyoda City, Tokyo",
      "lat": 35.6812,
      "lng": 139.7671,
      "type": "transport",
      "day": 1,
      "description": "Main railway station"
    }
  ]
}

Guidelines:
- Extract dates in YYYY-MM-DD format
- Include realistic coordinates for major locations
- Categorize checklist items logically (Documents, Packing, Bookings, etc.)
- Set appropriate priorities (high/medium/low) for checklist items
- Use map pin types: accommodation, restaurant, attraction, transport, activity
- Ensure all schedule items have day numbers starting from 1
- Include cost estimates where mentioned in the text

Travel Itinerary Text:
${itineraryText}

JSON Response:`;

  let lastError: Error | null = null;
  
  // Retry logic for API calls
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Make API call to Supabase Edge Function (which calls Gemini)
      const response = await supabase.functions.invoke('convert-itinerary', {
        body: {
          itineraryText: conversionPrompt
        }
      });

      if (response.error) {
        throw new ItineraryProcessorError(
          `API call failed: ${response.error.message}`,
          'API_ERROR',
          response.error
        );
      }

      if (!response.data || !response.data.itinerary) {
        throw new ItineraryProcessorError(
          'No itinerary data received from API',
          'API_ERROR'
        );
      }

      // Validate and structure the response
      const structuredData = validateAndStructureData(response.data.itinerary);
      
      return structuredData;

    } catch (error) {
      lastError = error as Error;
      
      // If it's the last attempt, throw the error
      if (attempt > maxRetries) {
        if (error instanceof ItineraryProcessorError) {
          throw error;
        }
        
        throw new ItineraryProcessorError(
          `Failed to process itinerary after ${maxRetries + 1} attempts: ${error.message}`,
          'API_ERROR',
          error
        );
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Validates and structures the raw API response data
 * 
 * @param rawData - Raw data from the API response
 * @returns StructuredItinerary - Validated and structured data
 */
function validateAndStructureData(rawData: any): StructuredItinerary {
  try {
    // Ensure required fields exist
    const requiredFields = ['tripTitle', 'summary', 'destination', 'duration', 'numberOfTravelers'];
    for (const field of requiredFields) {
      if (!rawData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Structure and validate schedule data
    const schedule: ScheduleItem[] = (rawData.schedule || []).map((item: any, index: number) => ({
      day: item.day || index + 1,
      date: item.date || new Date().toISOString().split('T')[0],
      time: item.time || '09:00',
      activity: item.activity || 'Activity',
      description: item.description || item.activity || 'No description available',
      location: item.location,
      coordinates: item.coordinates ? {
        lat: parseFloat(item.coordinates.lat),
        lng: parseFloat(item.coordinates.lng)
      } : undefined,
      estimatedCost: item.estimatedCost
    }));

    // Structure and validate checklist data
    const checklist: ChecklistCategory[] = (rawData.checklist || []).map((category: any) => ({
      category: category.category || 'General',
      items: (category.items || []).map((item: any) => ({
        task: item.task || item,
        completed: Boolean(item.completed),
        priority: item.priority || 'medium',
        notes: item.notes
      }))
    }));

    // Structure and validate map pins data
    const mapPins: MapPin[] = (rawData.mapPins || []).map((pin: any, index: number) => ({
      id: pin.id || `pin_${index + 1}`,
      name: pin.name || 'Location',
      address: pin.address || '',
      lat: parseFloat(pin.lat) || 0,
      lng: parseFloat(pin.lng) || 0,
      type: pin.type || 'attraction',
      day: pin.day,
      description: pin.description
    }));

    return {
      tripTitle: rawData.tripTitle,
      summary: rawData.summary,
      destination: rawData.destination,
      duration: rawData.duration,
      numberOfTravelers: parseInt(rawData.numberOfTravelers) || 1,
      schedule,
      checklist,
      mapPins
    };

  } catch (error) {
    throw new ItineraryProcessorError(
      `Data validation failed: ${error.message}`,
      'VALIDATION_ERROR',
      error
    );
  }
}

/**
 * Utility function to update UI components with structured data
 * This function can be called after successful itinerary generation
 * 
 * @param structuredData - The structured itinerary data
 * @param updateCallbacks - Callbacks to update each UI component
 */
export function updateUIComponents(
  structuredData: StructuredItinerary,
  updateCallbacks: {
    onScheduleUpdate?: (schedule: ScheduleItem[]) => void;
    onChecklistUpdate?: (checklist: ChecklistCategory[]) => void;
    onMapUpdate?: (mapPins: MapPin[]) => void;
    onMetadataUpdate?: (metadata: {
      title: string;
      summary: string;
      destination: string;
      duration: string;
      travelers: number;
    }) => void;
  }
) {
  try {
    // Update schedule view
    if (updateCallbacks.onScheduleUpdate) {
      updateCallbacks.onScheduleUpdate(structuredData.schedule);
    }

    // Update checklist view
    if (updateCallbacks.onChecklistUpdate) {
      updateCallbacks.onChecklistUpdate(structuredData.checklist);
    }

    // Update map view
    if (updateCallbacks.onMapUpdate) {
      updateCallbacks.onMapUpdate(structuredData.mapPins);
    }

    // Update metadata/header information
    if (updateCallbacks.onMetadataUpdate) {
      updateCallbacks.onMetadataUpdate({
        title: structuredData.tripTitle,
        summary: structuredData.summary,
        destination: structuredData.destination,
        duration: structuredData.duration,
        travelers: structuredData.numberOfTravelers
      });
    }

  } catch (error) {
    console.error('Error updating UI components:', error);
    throw new ItineraryProcessorError(
      'Failed to update UI components',
      'VALIDATION_ERROR',
      error
    );
  }
}

/**
 * Main orchestrator function that combines generation and UI updates
 * This is the primary function that should be called from UI components
 * 
 * @param itineraryText - Raw AI-generated text
 * @param updateCallbacks - UI update callbacks
 * @param options - Processing options
 */
export async function processAndUpdateItinerary(
  itineraryText: string,
  updateCallbacks: Parameters<typeof updateUIComponents>[1],
  options?: Parameters<typeof generateStructuredItinerary>[1]
): Promise<StructuredItinerary> {
  try {
    // Generate structured data
    const structuredData = await generateStructuredItinerary(itineraryText, options);
    
    // Update UI components
    updateUIComponents(structuredData, updateCallbacks);
    
    return structuredData;
    
  } catch (error) {
    // Re-throw with additional context
    if (error instanceof ItineraryProcessorError) {
      throw error;
    }
    
    throw new ItineraryProcessorError(
      `Processing failed: ${error.message}`,
      'API_ERROR',
      error
    );
  }
}