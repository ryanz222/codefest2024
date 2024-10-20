// app/trips/[trip_id]/timeline.tsx
'use client';
import React, { useState } from 'react';
import { ScrollShadow } from '@nextui-org/react';
import { useTheme } from 'next-themes';

import FlightModal from './flightModal';
import HotelModal from './hotelModal';
import ActivityModal from './activityModal';
import TripDays from './tripDays';

import { useTrip } from '@/hooks/useTrip';

export default function TripTimeline({ trip_id }: { trip_id: string }) {
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);

    const { theme } = useTheme();

    const { trip } = useTrip(trip_id);

    const [tripStartDate, setTripStartDate] = useState<Date>(() => {
        const date = new Date();

        date.setMonth(date.getMonth() + 2);

        return date;
    });

    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    const handleAddEvent = (eventType: 'Flight' | 'Hotel' | 'Activity', date: Date) => {
        setNewEventDate(date);
        if (eventType === 'Flight') {
            setIsFlightModalOpen(true);
        } else if (eventType === 'Hotel') {
            setIsHotelModalOpen(true);
        } else if (eventType === 'Activity') {
            setIsActivityModalOpen(true);
        }
    };

    const bgStyle = theme === 'dark' ? 'bg-gray-800/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md';

    return (
        <>
            {/* Timeline List */}
            <div className={`h-full w-full p-4 overflow-hidden rounded-xl shadow-lg flex flex-col ${bgStyle}`}>
                <ScrollShadow hideScrollBar className="h-full">
                    {trip && <TripDays trip={trip} tripStartDate={tripStartDate} onAddEvent={handleAddEvent} />}
                </ScrollShadow>
            </div>

            {/* Modals */}
            <FlightModal
                isOpen={isFlightModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsFlightModalOpen(false)}
            />

            <HotelModal
                isOpen={isHotelModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsHotelModalOpen(false)}
            />

            <ActivityModal
                isOpen={isActivityModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsActivityModalOpen(false)}
            />
        </>
    );
}
