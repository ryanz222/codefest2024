// app/trips/[trip_id]/page.tsx
'use client';
import React, { useState } from 'react';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

import MapComponent from './map';
import TripChatbot from './chatbot';
import AboutTrip from './aboutTrip';
import FlightModal from './flightModal';
import HotelModal from './hotelModal';
import ActivityModal from './activityModal';
import TripDays from './tripDays';

import { useTrip } from '@/hooks/useTrip';
import EditTripModal from './editTripModal';

export default function ItineraryPage({ params }: { params: Params }) {
    const { trip_id } = params;
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);
    const { trip } = useTrip(trip_id);

    const [tripStartDate, setTripStartDate] = useState<Date>(() => {
        const date = new Date();

        date.setMonth(date.getMonth() + 2);

        return date;
    });

    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);

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

    const handleOpenEditTripModal = () => {
        setIsEditTripModalOpen(true);
    };

    return (
        <div className="relative w-full h-[calc(100vh-64px)]">
            {/* Map Component */}
            <MapComponent trip_id={trip_id} />

            {/* Floating left panel */}
            <div className="absolute flex gap-4 flex-col top-0 left-0 w-1/3 h-full p-4 overflow-auto">
                <AboutTrip handleOpenEditTripModal={handleOpenEditTripModal} trip_id={trip_id} />
                {trip && <TripDays trip={trip} tripStartDate={tripStartDate} onAddEvent={handleAddEvent} />}
                <TripChatbot />
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

            <EditTripModal
                isOpen={isEditTripModalOpen}
                onClose={() => setIsEditTripModalOpen(false)}
                trip_id={trip_id}
            />
        </div>
    );
}
