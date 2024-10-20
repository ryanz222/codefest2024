// hooks/useTrips.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

import { TripDescription } from './useTrips';

interface Hotel {
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
    search_latitude: number;
    search_longitude: number;
    search_radius: number;
    search_radius_unit: 'KM' | 'MI';
    allowed_chain_codes: string[];
    allowed_ratings: Array<1 | 2 | 3 | 4 | 5>;
    required_amenities: Array<
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
    priority: 'PRICE' | 'DISTANCE' | 'RATING' | 'CLOSESTNAME';
    ideal_hotel_name?: string;
}

interface Activity {
    // Id to connect activity to trip and creator
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus activity offer API
    id: string;
    name: string;
    photo_url: string;
    address: string;
    description: string;
}

interface Flight {
    // Id to connect flight to trip and creator
    trip_id: string;
    creator_id: string;

    // Information needed to get prices from amadeus flight offer API
    id: string;
    destination_city_code: string;
    departure_city_code: string;
    departure_date: string;
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

    const { data, error } = await client.from('trips').update(tripData).eq('trip_id', trip_id).select().single();

    if (error) throw error;

    if (hotels) {
        await client.from('hotels').upsert(hotels.map(h => ({ ...h, trip_id })));
    }

    if (flights) {
        await client.from('flights').upsert(flights.map(f => ({ ...f, trip_id })));
    }

    if (activities) {
        await client.from('activities').upsert(activities.map(a => ({ ...a, trip_id })));
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

    return {
        trip: tripQuery.data,
        isLoading: tripQuery.isLoading || !client,
        isError: tripQuery.isError,
        error: tripQuery.error,
        updateTrip: updateTripMutation.mutate,
    };
}
