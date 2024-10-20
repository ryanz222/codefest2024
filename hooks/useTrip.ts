// hooks/useTrips.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

import { TripDescription } from './useTrips';

export interface Hotel {
    // Id to connect hotel to trip and creator
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus hotel offer API
    relative_check_in_day: number;
    relative_check_out_day: number;
    adults: number;

    // Optional specific hotel data
    hotel_id?: string; // If empty, will pull from Amadeus hotel search.  Otherwise, user entered address -> lat+lon -> amadeus hotel search -> hotel_id with nearest distance
    address?: string; // Pulled from either the user inputting the address manually, or amadeus hotel search -> lat+lon -> address from Google Place API
    photo_url?: string; // Pulled from Google Place API once we know the address

    // If no hotel_id is provided, these are used to get the best hotel from amadeus hotel list API
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
    // Id to connect activity to trip and creator
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus activity offer API
    id?: string;
    name: string;
    relative_day: number;

    // Optional specific activity data
    photo_url?: string;
    address?: string;
    description?: string;
}

export interface Flight {
    // Id to connect flight to trip and creator
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus flight offer API
    id: string;
    destination_city_code: string;
    departure_city_code: string;
    relative_departure_day: number;
    relative_return_day: number;
    adults: number;
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
    const { data: tripDataResult, error: tripError } = await client.from('trips').update(tripData).eq('trip_id', trip_id).select().single();

    if (tripError) throw tripError;

    // Handle hotels
    if (hotels && hotels.length > 0) {
        const { error: hotelError } = await client.from('hotels').upsert(
            hotels.map(h => ({
                trip_id: h.trip_id,
                creator_id: h.creator_id,
                relative_check_in_day: h.relative_check_in_day,
                relative_check_out_day: h.relative_check_out_day,
                adults: h.adults,
                hotel_api_id: h.hotel_id, // Ensure hotel_id is mapped correctly
                address: h.address,
                photo_url: h.photo_url,
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
            { onConflict: 'trip_id,hotel_api_id' }
        );

        if (hotelError) throw hotelError;
    }

    // Handle flights
    if (flights && flights.length > 0) {
        const { error: flightError } = await client.from('flights').upsert(
            flights.map(f => ({
                trip_id: f.trip_id,
                creator_id: f.creator_id,
                flight_api_id: f.id,
                destination_city_code: f.destination_city_code,
                departure_city_code: f.departure_city_code,
                relative_departure_day: f.relative_departure_day,
                relative_return_day: f.relative_return_day,
                adults: f.adults,
                travel_class: f.travel_class,
                non_stop: f.non_stop,
                currency: f.currency,
                max_price: f.max_price,
                included_airline_codes: f.included_airline_codes,
                excluded_airline_codes: f.excluded_airline_codes,
            })),
            { onConflict: 'trip_id,flight_api_id' }
        );

        if (flightError) throw flightError;
    }

    // Handle activities
    if (activities && activities.length > 0) {
        const { error: activityError } = await client.from('activities').upsert(
            activities.map(a => ({
                trip_id: a.trip_id,
                creator_id: a.creator_id,
                activity_api_id: a.id,
                name: a.name,
                photo_url: a.photo_url,
                address: a.address,
                description: a.description,
            })),
            { onConflict: 'trip_id,activity_api_id' }
        );

        if (activityError) throw activityError;
    }

    return fetchTrip(client, trip_id);
};

const deleteTrip = async (client: SupabaseClient, trip_id: string): Promise<void> => {
    const { error } = await client.from('trips').delete().eq('trip_id', trip_id);

    if (error) throw error;
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

    const tripQuery = useQuery<TripData, Error>({
        queryKey: ['trip', trip_id],
        queryFn: () => {
            if (!client) throw new Error('Supabase client not initialized');

            return fetchTrip(client, trip_id);
        },
        enabled: !!client,
    });

    const updateTripMutation = useMutation({
        mutationFn: (updatedTrip: Partial<TripData>) => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            return updateTrip(client, updatedTrip);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trip', trip_id] });
        },
    });

    const deleteTripMutation = useMutation({
        mutationFn: () => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            return deleteTrip(client, trip_id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            queryClient.removeQueries({ queryKey: ['trip', trip_id] });
        },
    });

    return {
        trip: tripQuery.data,
        isLoading: tripQuery.isLoading || !client,
        isError: tripQuery.isError,
        error: tripQuery.error,
        updateTrip: updateTripMutation.mutate,
        deleteTrip: deleteTripMutation.mutate,
    };
}
