"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { ActiveSessionResource } from "@clerk/types";

interface Trip {
    id: number;
    name: string;
    user_id: string;
}

// Create a single instance of the Supabase client
let supabaseClient: SupabaseClient | null = null;

// Create a custom Supabase client that injects the Clerk Supabase token
const createClerkSupabaseClient = (
    session: ActiveSessionResource | null | undefined,
): SupabaseClient => {
    if (supabaseClient) return supabaseClient;

    supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
            global: {
                fetch: async (url, options = {}) => {
                    let clerkToken = null;

                    // Get the Clerk token if available; signed-out users will not have a session
                    if (session) {
                        clerkToken = await session.getToken({
                            template: "supabase",
                        });
                    }

                    // Insert the Clerk Supabase token into the headers if available
                    const headers = new Headers(options?.headers);

                    if (clerkToken) {
                        headers.set("Authorization", `Bearer ${clerkToken}`);
                    }

                    // Now call the default fetch
                    return fetch(url, {
                        ...options,
                        headers,
                    });
                },
            },
        },
    );

    return supabaseClient;
};

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

export function useTrips() {
    const { session } = useSession();
    const queryClient = useQueryClient();
    const client = createClerkSupabaseClient(session);

    const tripsQuery = useQuery<Trip[], Error>({
        queryKey: ["trips"],
        queryFn: () => fetchTrips(client),
        enabled: !!session,
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
