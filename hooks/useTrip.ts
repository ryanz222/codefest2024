// hooks/useTrips.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

import { TripDescription } from './useTrips';

export interface Hotel {
    // Ids
    hotel_entry_id?: number;
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus hotel offer API
    relative_check_in_day: number;
    relative_check_out_day: number;

    // Optional specific hotel data
    amadeus_hotel_id?: string; // If empty, will pull from Amadeus hotel search.  Otherwise, user entered address -> lat+lon -> amadeus hotel search -> hotel_id with nearest distance
    address?: string; // Pulled from either the user inputting the address manually, or amadeus hotel search -> lat+lon -> address from Google Place API
    photo_url?: string; // Pulled from Google Place API once we know the address
    hotel_latitude?: number;
    hotel_longitude?: number;

    // If no amadeus_hotel_id is provided, these are used to get the best hotel from amadeus hotel list API
    search_latitude?: number;
    search_longitude?: number;
    search_radius?: number;
    search_radius_unit?: 'KM' | 'MI';
    allowed_chain_codes?: string[];
    allowed_ratings?: Array<1 | 2 | 3 | 4 | 5>;
    required_amenities?: Array<
        | 'SWIMMING_POOL'
        | 'SPA'
        | 'FITNESS_CENTER'
        | 'AIR_CONDITIONING'
        | 'RESTAURANT'
        | 'PARKING'
        | 'PETS_ALLOWED'
        | 'AIRPORT_SHUTTLE'
        | 'BUSINESS_CENTER'
        | 'DISABLED_FACILITIES'
        | 'WIFI'
        | 'MEETING_ROOMS'
        | 'NO_KID_ALLOWED'
        | 'TENNIS'
        | 'GOLF'
        | 'KITCHEN'
        | 'BABY-SITTING'
        | 'BEACH'
        | 'CASINO'
        | 'JACUZZI'
        | 'SAUNA'
        | 'MASSAGE'
        | 'VALET_PARKING'
        | 'BAR'
        | 'LOUNGE'
        | 'MINIBAR'
        | 'TELEVISION'
        | 'WI-FI_IN_ROOM'
        | 'ROOM_SERVICE'
    >;
    priority?: 'PRICE' | 'DISTANCE' | 'RATING' | 'CLOSESTNAME';
    ideal_hotel_name?: string;
}

export interface Activity {
    // Ids
    activity_entry_id?: number;
    trip_id: string;
    creator_id: string;

    // Information needed to get prices and locations
    name: string;
    relative_day: number;
    price_usd: number;

    // Optional specific activity data
    photo_url?: string;
    address?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
}

export interface Flight {
    // Ids
    flight_entry_id?: number;
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus flight offer API
    destination_city_code: string;
    departure_city_code: string;
    relative_departure_day: number;
    relative_return_day: number;
    travel_class: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    non_stop: boolean;
    currency: string;
    max_price: number;
    included_airline_codes: string[];
    excluded_airline_codes: string[];
}

export interface TripData extends TripDescription {
    hotels: Hotel[];
    flights: Flight[];
    activities: Activity[];
}

// ----------------------------------------
// Singleton Supabase Client with Token Caching
// ----------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

// Cache for the Supabase client and the last used token
let cachedSupabaseClient: SupabaseClient | null = null;
let lastToken: string | null | undefined = undefined;

const createOrGetSupabaseClient = (supabaseAccessToken: string | null) => {
    if (supabaseAccessToken === lastToken && cachedSupabaseClient !== null) {
        return cachedSupabaseClient;
    }

    lastToken = supabaseAccessToken;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                ...(supabaseAccessToken && {
                    Authorization: `Bearer ${supabaseAccessToken}`,
                }),
            },
        },
    });

    cachedSupabaseClient = supabase;

    return supabase;
};

// ----------------------------------------
// Supabase Data Functions
// ----------------------------------------

const fetchTrip = async (client: SupabaseClient, trip_id: string): Promise<TripData> => {
    const { data, error } = await client
        .from('trips')
        .select(
            `
            *,
            hotels (*),
            flights (*),
            activities (*)
        `
        )
        .eq('trip_id', trip_id)
        .single();

    if (error) throw error;

    return {
        ...data,
        hotels: data.hotels || [],
        flights: data.flights || [],
        activities: data.activities || [],
    };
};

// ----------------------------------------
// useTrip Hook
// ----------------------------------------

export function useTrip(trip_id: string) {
    const { session, isLoaded: isClerkLoaded } = useSession();
    const queryClient = useQueryClient();

    const [client, setClient] = useState<SupabaseClient | null>(null);

    // useEffect to create the client once isClerkLoaded is true
    useEffect(() => {
        if (!isClerkLoaded) return;

        let isMounted = true;

        const getClient = async () => {
            // Get the latest Clerk token, if available
            let token: string | null = null;

            if (session) {
                token = await session.getToken({ template: 'supabase' });
            }

            const supabaseClient = createOrGetSupabaseClient(token);

            if (isMounted) {
                setClient(supabaseClient);
            }
        };

        getClient();

        return () => {
            isMounted = false;
        };
    }, [isClerkLoaded, session]);

    // Query to fetch the trip data
    const tripQuery = useQuery<TripData, Error>({
        queryKey: ['trip', trip_id],
        queryFn: () => {
            if (!client) throw new Error('Supabase client not initialized');

            return fetchTrip(client, trip_id);
        },
        enabled: !!client,
    });

    // Update trip data
    const updateTripMutation = useMutation({
        mutationFn: async (updatedTrip: Partial<TripData>) => {
            // Make sure we have what we need
            if (!client || !session) throw new Error('Supabase client or session not initialized');
            if (!updatedTrip.trip_id) throw new Error('Trip ID is required for updating');
            if (!updatedTrip.trip_name) throw new Error('Trip name is required for updating');
            if (!updatedTrip.length_in_days) throw new Error('Length in days is required for updating');
            if (typeof updatedTrip.adults !== 'number') throw new Error('Adults is required for updating');
            if (!updatedTrip.created_at) throw new Error('Created at is required for updating');
            if (typeof updatedTrip.is_published !== 'boolean') throw new Error('Is published is required for updating');

            // Create the trip details object
            const tripDetailsOnly: Omit<TripDescription, 'creator_id'> = {
                trip_id: updatedTrip.trip_id,
                trip_name: updatedTrip.trip_name,
                length_in_days: updatedTrip.length_in_days,
                adults: updatedTrip.adults,
                created_at: updatedTrip.created_at,
                is_published: updatedTrip.is_published,
                photo_url: updatedTrip.photo_url,
                description: updatedTrip.description,
            };

            const { data, error } = await client.from('trips').update(tripDetailsOnly).eq('trip_id', trip_id).select().single();

            if (error) throw error;

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    // Delete trip data
    const deleteTripMutation = useMutation({
        mutationFn: async () => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            const { error } = await client.from('trips').delete().eq('trip_id', trip_id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.removeQueries({ queryKey: ['trip', trip_id] });
        },
    });

    // Create hotel data
    const createHotelMutation = useMutation({
        mutationFn: async (newHotel: Omit<Hotel, 'hotel_entry_id' | 'creator_id'>): Promise<number> => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            const { data, error } = await client.from('hotels').insert(newHotel).select('hotel_entry_id').single();

            if (error) throw error;

            return data.hotel_entry_id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    // Update hotel data
    const updateHotelMutation = useMutation({
        mutationFn: async (updatedHotel: Hotel) => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            // Destructure hotel_entry_id and the rest of the hotel data
            const { hotel_entry_id, ...hotelDataToUpdate } = updatedHotel;

            const { data, error } = await client.from('hotels').update(hotelDataToUpdate).eq('hotel_entry_id', hotel_entry_id).select().single();

            if (error) throw error;

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    // Create flight data
    const createFlightMutation = useMutation({
        mutationFn: async (newFlight: Omit<Flight, 'flight_entry_id' | 'creator_id'>): Promise<number> => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            const { data, error } = await client.from('flights').insert(newFlight).select('flight_entry_id').single();

            if (error) throw error;

            return data.flight_entry_id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    // Update flight data
    const updateFlightMutation = useMutation({
        mutationFn: async (updatedFlight: Flight) => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            // Create a new object without the flight_entry_id
            const { flight_entry_id, ...flightDataToUpdate } = updatedFlight;

            const { data, error } = await client.from('flights').update(flightDataToUpdate).eq('flight_entry_id', flight_entry_id).select().single();

            if (error) throw error;

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    // Delete flight data
    const deleteFlightMutation = useMutation({
        mutationFn: async (flight_entry_id: number) => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            const { error } = await client.from('flights').delete().eq('flight_entry_id', flight_entry_id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    return {
        trip: tripQuery.data,
        isLoading: tripQuery.isLoading || !client,
        isError: tripQuery.isError,
        error: tripQuery.error,
        updateTrip: updateTripMutation.mutate,
        deleteTrip: deleteTripMutation.mutate,
        createHotel: createHotelMutation.mutateAsync,
        updateHotel: updateHotelMutation.mutate,
        createFlight: createFlightMutation.mutateAsync,
        updateFlight: updateFlightMutation.mutate,
        deleteFlight: deleteFlightMutation.mutate,
    };
}
