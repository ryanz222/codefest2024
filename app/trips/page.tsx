// app/trips/page.tsx
'use client';
import { useState } from 'react';

import { useTrips } from '@/hooks/useTrips';

export default function Trips() {
    const [tripName, setTripName] = useState('');
    const { trips, isLoading, isError, error, addTrip, deleteTrip } = useTrips();

    const handleCreateTrip = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (tripName.trim()) {
            addTrip({
                trip_name: tripName.trim(),
                length_in_days: 1, // Set a default value or add input for this
                is_published: false, // Set a default value or add input for this
            });
            setTripName('');
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError && error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h1>Trips</h1>

            {trips.length > 0 ? (
                trips.map(trip => (
                    <div
                        key={trip.trip_id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <p>{trip.trip_name}</p>
                        <button onClick={() => deleteTrip(trip.trip_id)}>Delete</button>
                    </div>
                ))
            ) : (
                <p>No trips found</p>
            )}

            <form onSubmit={handleCreateTrip}>
                <input name="tripName" placeholder="Enter new trip name" type="text" value={tripName} onChange={e => setTripName(e.target.value)} />
                <button type="submit">Add Trip</button>
            </form>
        </div>
    );
}
