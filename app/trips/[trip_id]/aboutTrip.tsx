// app/trips/[trip_id]/aboutTrip.tsx
'use client';

import { TripData, useTrip } from '@/hooks/useTrip';
import { Card, CardHeader } from '@nextui-org/react';

interface AboutTripProps {
    trip_id: string;
}

export default function AboutTrip({ trip_id }: AboutTripProps) {
    const { trip, isLoading, isError, error } = useTrip(trip_id);

    return (
        <Card>
            <CardHeader>{trip?.trip_name}</CardHeader>
        </Card>
    );
}
