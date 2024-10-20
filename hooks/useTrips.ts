// hooks/useTrips.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { SessionResource } from '@clerk/types';

export interface TripDescription {
    trip_id: string;
    creator_id: string;
    trip_name: string;
    length_in_days: number;
    created_at: Date;
    is_published: boolean;
    photo_url?: string;
    description?: string;
}

export interface TripFilters {
    creator?: string;
    min_length?: number;
    max_length?: number;
    search_term?: string;
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
const fetchTrips = async (client: SupabaseClient, session: SessionResource | null, filters?: TripFilters): Promise<TripDescription[]> => {
    let query = client.from('trips').select('*');

    // Apply filters if provided
    if (filters?.creator) {
        const creator = filters.creator === 'CURRENT_USER' ? session?.user?.id : filters.creator;

        query = query.eq('creator_id', creator);
    }
    if (filters?.min_length) {
        query = query.gte('length_in_days', filters.min_length);
    }
    if (filters?.max_length) {
        query = query.lte('length_in_days', filters.max_length);
    }
    if (filters?.search_term) {
        query = query.or(
            `description.ilike.%${filters.search_term}%,creator_id.ilike.%${filters.search_term}%,trip_name.ilike.%${filters.search_term}%`
        );
    }

    const { data, error } = await query;

    if (error) throw error;

    return data ?? [];
};

// Function to add a trip to Supabase
const addTrip = async (client: SupabaseClient, trip: Omit<TripDescription, 'trip_id' | 'created_at' | 'creator_id'>): Promise<TripDescription> => {
    const completeTrip = {
        ...trip,
        is_published: true, // Default to published
    };

    const { data, error } = await client.from('trips').insert(completeTrip).select().single();

    if (error) throw error;

    return data;
};

// Function to delete a trip from Supabase
const deleteTrip = async (client: SupabaseClient, id: number): Promise<void> => {
    const { error } = await client.from('trips').delete().eq('trip_id', id);

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

    const tripsQuery = useQuery<TripDescription[], Error>({
        queryKey: ['trips', filters],
        queryFn: () => {
            if (!client || !isClerkLoaded) throw new Error('Supabase client not initialized');

            return fetchTrips(client, session, filters);
        },
        enabled: !!client,
    });

    const addTripMutation = useMutation({
        mutationFn: (trip: Omit<TripDescription, 'trip_id' | 'created_at' | 'creator_id'>) => {
            if (!client || !session) throw new Error('Supabase client or session not initialized');

            return addTrip(client, trip);
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
