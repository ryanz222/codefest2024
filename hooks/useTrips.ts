// hooks/useTrips.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface Hotel {
    // Id to connect hotel to trip
    tripId: string;

    // Information needed to get prices from amadeus hotel offer API
    relativeCheckInDay: number;
    relativeCheckOutDay: number;
    adults: number;

    // Optional specific hotel data
    hotelId?: string; // If empty, will pull from Amadeus hotel search.  Otherwise, user entered address -> lat+lon -> amadeus hotel search -> hotelId with nearest distance
    address?: string; // Pulled from either the user inputting the address manually, or amadeus hotel search -> lat+lon -> address from Google Place API
    photoURL?: string; // Pulled from Google Place API once we know the address

    // If no hotelId is provided, these are used to get the best hotel from amadeus hotel list API
    searchLatitude: number;
    searchLongitude: number;
    searchRadius: number;
    searchRadiusUnit: 'KM' | 'MI';
    allowedChainCodes: string[];
    allowedRatings: Array<1 | 2 | 3 | 4 | 5>;
    requiredAmenities: Array<
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
    idealHotelName?: string;
}

interface Activity {
    id: string; // 8 character string
    name: string;
    photo_url: string;
    address: string;
    description: string;
}

interface Flight {
    id: string; // 8 character string
    destinationCityCode: string;
    departureCityCode: string;
    departureDate: string;
    adults: number;
    travelClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    nonStop: boolean;
    currency: string;
    maxPrice: number;
    includedAirlineCodes: string[];
    excludedAirlineCodes: string[];
}

interface Trip {
    tripId: number;
    creatorId: string;
    tripName: string;
    lengthInDays: number;
    createdAt: Date;

    // Optional
    photoURL?: string;
    description?: string;
    hotels?: Hotel[];
    activities?: Activity[];
    flights?: Flight[];
}

interface TripFilters {
    creator?: string;
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

// Function to fetch trips from Supabase
const fetchTrips = async (client: SupabaseClient, filters?: TripFilters): Promise<Trip[]> => {
    let query = client.from('trips').select('*');

    // Apply filters if provided
    if (filters?.creator) {
        query = query.eq('user_id', filters.creator);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
};

// Function to add a trip to Supabase
const addTrip = async (client: SupabaseClient, name: string): Promise<Trip> => {
    const { data, error } = await client.from('trips').insert({ name }).select().single();

    if (error) throw error;

    return data;
};

// Function to delete a trip from Supabase
const deleteTrip = async (client: SupabaseClient, id: number): Promise<void> => {
    const { error } = await client.from('trips').delete().eq('id', id);

    if (error) throw error;
};

// ----------------------------------------
// useTrips Hook
// ----------------------------------------

export function useTrips(filters?: TripFilters) {
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

    const tripsQuery = useQuery<Trip[], Error>({
        queryKey: ['trips', filters],
        queryFn: () => {
            if (!client) throw new Error('Supabase client not initialized');

            return fetchTrips(client, filters);
        },
        enabled: !!client, // Only run the query when the client is initialized
    });

    const addTripMutation = useMutation({
        mutationFn: (name: string) => {
            if (!client) throw new Error('Supabase client not initialized');

            return addTrip(client, name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });

    const deleteTripMutation = useMutation({
        mutationFn: (id: number) => {
            if (!client) throw new Error('Supabase client not initialized');

            return deleteTrip(client, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
        },
    });

    return {
        trips: tripsQuery.data ?? [],
        isLoading: tripsQuery.isLoading || !client,
        isError: tripsQuery.isError,
        error: tripsQuery.error,
        addTrip: addTripMutation.mutate,
        deleteTrip: deleteTripMutation.mutate,
    };
}
