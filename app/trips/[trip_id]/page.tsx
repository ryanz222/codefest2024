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
import EditTripModal from './editTripModal';

import { useTrip } from '@/hooks/useTrip';

export default function ItineraryPage({ params }: { params: Params }) {
    const { trip_id } = params;
    const { trip } = useTrip(trip_id);

    // States for the trip start date and new event date
    const [tripStartDate, setTripStartDate] = useState<Date>(() => {
        const date = new Date();

        date.setMonth(date.getMonth() + 2);

        return date;
    });
    const [newEventDate, setNewEventDate] = useState<Date>(tripStartDate);

    // States for the modals
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);

    // Function to handle adding an event to the trip
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

    return (
        <div className="relative w-full h-[calc(100vh-64px)]">
            {/* Map Component */}
            <MapComponent trip_id={trip_id} />

            {/* Floating left panel */}
            <div className="absolute flex gap-4 flex-col top-0 left-0 min-w-[400px] h-full p-4 overflow-auto">

                {/* About Trip */}
                <AboutTrip
                    handleOpenEditTripModal={() => setIsEditTripModalOpen(true)}
                    setTripStartDate={setTripStartDate}
                    tripStartDate={tripStartDate}
                    trip_id={trip_id}
                />

                {/* Trip Days */}
                {trip && <TripDays trip={trip} tripStartDate={tripStartDate} onAddEvent={handleAddEvent} />}

                {/* Chatbot */}
                <TripChatbot />
            </div>

            {/* Flight Modal */}
            <FlightModal
                isOpen={isFlightModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsFlightModalOpen(false)}
            />

            {/* Hotel Modal */}
            <HotelModal
                isOpen={isHotelModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsHotelModalOpen(false)}
            />

            {/* Activity Modal */}
            <ActivityModal
                isOpen={isActivityModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsActivityModalOpen(false)}
            />

            {/* Edit Trip Modal */}
            <EditTripModal
                isOpen={isEditTripModalOpen}
                setTripStartDate={setTripStartDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsEditTripModalOpen(false)}
            />
        </div>
    );
}
