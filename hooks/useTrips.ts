"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { ActiveSessionResource } from "@clerk/types";
import { useMemo } from "react";

interface Trip {
    id: number;
    name: string;
    user_id: string;
}

// --- Singleton Supabase Client with Custom Fetch ---

// We declare a singleton Supabase client outside the component
let supabaseClient: SupabaseClient | null = null;

// Function to create the Supabase client with custom fetch
const getSupabaseClient = (
    session: ActiveSessionResource | null | undefined,
): SupabaseClient => {
    if (!supabaseClient) {
        supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_KEY!,
            {
                auth: {
                    persistSession: false,
                },
                global: {
                    fetch: async (
                        input: RequestInfo | URL,
                        init?: RequestInit,
                    ) => {
                        // Get the latest Clerk token
                        let clerkToken: string | null = null;

                        if (session) {
                            clerkToken = await session.getToken({
                                template: "supabase",
                            });
                        }

                        // Set up headers
                        const headers = new Headers(init?.headers);

                        if (clerkToken) {
                            headers.set(
                                "Authorization",
                                `Bearer ${clerkToken}`,
                            );
                        }

                        // Proceed with the fetch request
                        return fetch(input, {
                            ...init,
                            headers,
                        });
                    },
                },
            },
        );
    }

    return supabaseClient;
};

// --- Supabase Data Functions ---

// Function to fetch trips from Supabase
const fetchTrips = async (client: SupabaseClient): Promise<Trip[]> => {
    const { data, error } = await client.from("trips").select("*");

    if (error) throw error;

    return data;
};

// Function to add a trip to Supabase
const addTrip = async (client: SupabaseClient, name: string): Promise<Trip> => {
    const { data, error } = await client
        .from("trips")
        .insert({ name })
        .single();

    if (error) throw error;

    return data;
};

// Function to delete a trip from Supabase
const deleteTrip = async (
    client: SupabaseClient,
    id: number,
): Promise<void> => {
    const { error } = await client.from("trips").delete().eq("id", id);

    if (error) throw error;
};

// --- useTrips Hook ---

export function useTrips() {
    const { session } = useSession();
    const queryClient = useQueryClient();

    // Get the singleton Supabase client with the updated session
    const client = useMemo(() => getSupabaseClient(session), [session]);

    const tripsQuery = useQuery<Trip[], Error>({
        queryKey: ["trips"],
        queryFn: () => fetchTrips(client),
        // Allow the query to run even if the user is signed out
        // Adjust based on whether you want to show trips to signed-out users
        enabled: true,
    });

    const addTripMutation = useMutation({
        mutationFn: (name: string) => addTrip(client, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
    });

    const deleteTripMutation = useMutation({
        mutationFn: (id: number) => deleteTrip(client, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
    });

    return {
        trips: tripsQuery.data ?? [],
        isLoading: tripsQuery.isLoading || tripsQuery.isFetching,
        isError: tripsQuery.isError,
        error: tripsQuery.error,
        addTrip: addTripMutation.mutate,
        deleteTrip: deleteTripMutation.mutate,
    };
}
