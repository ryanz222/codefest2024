// hooks/useTrips.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface Hotel {
    id: string; // 8 character string
    trip_id: string; // 8 character string
    city_code: string;
    name: string;
    photo_url: string;
    address: string;
    latitude: number;
    longitude: number;
    check_in_day: number;
    check_out_day: number;
    adults: number;
    room_quantity: number;
    board_type: 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE';
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
    id: number;
    name: string;
    length_in_days: number;
    description: string;
    user_id: string;
    created_at: string;
    hotels: Hotel[];
    activities: Activity[];
    flights: Flight[];
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
