// app/itinerary/page.tsx
'use client';
import { useState } from 'react';

import MapComponent from './components/map';
import TripTimeline from './components/timeline';
import TripChatbot from './components/chatbot';

export interface Event {
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

export default function ItineraryPage() {
    const [events, setEvents] = useState<Event[]>([]);

    return (
        <div className="relative w-full h-[calc(100vh-64px)]">
            {/* Map Component */}
            <MapComponent events={events} />

            {/* Floating left panel */}
            <div className="absolute flex gap-4 flex-col top-0 left-0 w-1/3 h-full p-4 overflow-auto">

                {/* Trip Timeline */}
                <TripTimeline events={events} setEvents={setEvents} />

                {/* Trip Chatbot */}
                <TripChatbot />
            </div>
        </div>
    );
}
