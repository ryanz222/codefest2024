"use client";
import { useState } from "react";

import { useTrips } from "@/hooks/useTrips";

export default function Trips() {
    const [name, setName] = useState("");
    const { trips, isLoading, isError, error, addTrip, deleteTrip } =
        useTrips();

    const handleCreateTrip = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        addTrip(name);
        setName("");
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError && error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h1>Trips</h1>

            {trips.length > 0 ? (
                trips.map((trip) => (
                    <div
                        key={trip.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        <p>{trip.name}</p>
                        <button onClick={() => deleteTrip(trip.id)}>
                            Delete
                        </button>
                    </div>
                ))
            ) : (
                <p>No trips found</p>
            )}

            <form onSubmit={handleCreateTrip}>
                <input
                    name="name"
                    placeholder="Enter new trip name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button type="submit">Add Trip</button>
            </form>
        </div>
    );
}
