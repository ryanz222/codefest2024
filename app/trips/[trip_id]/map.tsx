// app/trips/[trip_id]/map.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

interface MapComponentProps {
    trip_id: string;
}

export default function MapComponent({ trip_id }: MapComponentProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    // const { trip } = useTrips(trip_id);

    useEffect(() => {
        // Initialize Mapbox
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhcmVkLWhhY2thdGhvbiIsImEiOiJjbTJnaDlleHcwMTR6MmtvcmRqcmlpMTl0In0.HVWCktNb9-FN1Ey9muk7cw';

        if (!mapRef.current && mapContainerRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/standard',
                center: [-74.5, 40],
                zoom: 9,
            });
        }

        // Clean up on unmount
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return <div ref={mapContainerRef} className="absolute top-0 left-0 w-full h-full" />;
}
