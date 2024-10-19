// app/itinerary/components/map.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Event {
    id: number;
    date: Date;
    type: 'Hotel' | 'Flight' | 'Activity';
    location: {
        address: string;
        coordinates: [number, number]; // [longitude, latitude]
    };
    title: string;
    description: string;
}

interface MapComponentProps {
    events: Event[];
}

export default function MapComponent({ events }: MapComponentProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        // Initialize Mapbox
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhcmVkLWhhY2thdGhvbiIsImEiOiJjbTJnaDlleHcwMTR6MmtvcmRqcmlpMTl0In0.HVWCktNb9-FN1Ey9muk7cw';

        if (!mapRef.current && mapContainerRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [-74.5, 40],
                zoom: 9,
            });
        }

        // Clear existing markers
        if (mapRef.current) {
            const existingMarkers = mapRef.current.getCanvas().querySelectorAll('.mapboxgl-marker');

            existingMarkers.forEach(marker => marker.remove());
        }

        // Add markers for events
        events.forEach(event => {
            if (mapRef.current) {
                new mapboxgl.Marker()
                    .setLngLat(event.location.coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${event.title}</h3><p>${event.description}</p>`))
                    .addTo(mapRef.current);
            }
        });

        // Clean up on unmount
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [events]);

    return <div ref={mapContainerRef} className="absolute top-0 left-0 w-full h-full" />;
}
