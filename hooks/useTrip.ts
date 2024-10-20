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

const updateTrip = async (client: SupabaseClient, trip: Partial<TripData>): Promise<TripData> => {
    const { trip_id, hotels, flights, activities, ...tripData } = trip;

    if (!trip_id) throw new Error('Trip ID is required for updating');

    // Update trip data
    const { error: tripError } = await client.from('trips').update(tripData).eq('trip_id', trip_id).select().single();

    if (tripError) throw tripError;

    // Handle hotels
    if (hotels && hotels.length > 0) {
        const { data, error: hotelError } = await client
            .from('hotels')
            .upsert(
                hotels.map(({ ...h }) => ({
                    trip_id: h.trip_id,
                    creator_id: h.creator_id,
                    relative_check_in_day: h.relative_check_in_day,
                    relative_check_out_day: h.relative_check_out_day,
                    amadeus_hotel_id: h.amadeus_hotel_id,
                    address: h.address,
                    photo_url: h.photo_url,
                    hotel_latitude: h.hotel_latitude,
                    hotel_longitude: h.hotel_longitude,
                    search_latitude: h.search_latitude,
                    search_longitude: h.search_longitude,
                    search_radius: h.search_radius,
                    search_radius_unit: h.search_radius_unit,
                    allowed_chain_codes: h.allowed_chain_codes,
                    allowed_ratings: h.allowed_ratings,
                    required_amenities: h.required_amenities,
                    priority: h.priority,
                    ideal_hotel_name: h.ideal_hotel_name,
                })),
                {
                    onConflict: 'trip_id,hotel_entry_id',
                    ignoreDuplicates: false,
                }
            )
            .select();

        if (hotelError) {
            console.error('Error upserting hotels:', hotelError);
            throw hotelError;
        }

        console.log('Upserted hotels:', data);
    }

    // Handle flights
    if (flights && flights.length > 0) {
        const { error: flightError } = await client.from('flights').upsert(
            flights.map(f => ({
                flight_entry_id: f.flight_entry_id, // Include if present for updates
                trip_id: f.trip_id,
                creator_id: f.creator_id,
                destination_city_code: f.destination_city_code,
                departure_city_code: f.departure_city_code,
                relative_departure_day: f.relative_departure_day,
                relative_return_day: f.relative_return_day,
                travel_class: f.travel_class,
                non_stop: f.non_stop,
                currency: f.currency,
                max_price: f.max_price,
                included_airline_codes: f.included_airline_codes,
                excluded_airline_codes: f.excluded_airline_codes,
            })),
            {
                onConflict: 'flight_entry_id',
                ignoreDuplicates: false, // Updates existing rows
            }
        );

        if (flightError) throw flightError;
    }

    // Handle activities
    if (activities && activities.length > 0) {
        const { error: activityError } = await client.from('activities').upsert(
            activities.map(a => ({
                activity_entry_id: a.activity_entry_id, // Include if present for updates
                trip_id: a.trip_id,
                creator_id: a.creator_id,
                name: a.name,
                relative_day: a.relative_day,
                price_usd: a.price_usd,
                photo_url: a.photo_url,
                address: a.address,
                description: a.description,
                latitude: a.latitude,
                longitude: a.longitude,
            })),
            {
                onConflict: 'activity_entry_id',
                ignoreDuplicates: false, // Updates existing rows
            }
        );

        if (activityError) throw activityError;
    }

    return fetchTrip(client, trip_id);
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

            const { data, error } = await client
                .from('hotels')
                .update(updatedHotel)
                .eq('hotel_entry_id', updatedHotel.hotel_entry_id)
                .select()
                .single();

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

            const { data, error } = await client
                .from('flights')
                .update(updatedFlight)
                .eq('flight_entry_id', updatedFlight.flight_entry_id)
                .select()
                .single();

            if (error) throw error;

            return data;
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
    };
}
