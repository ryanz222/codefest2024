// app/trips/[trip_id]/flightModal.tsx
'use client';
import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@nextui-org/react';

import { Flight, useTrip } from '@/hooks/useTrip';

interface FlightModalProps {
    isOpen: boolean;
    onClose: () => void;
    newEventDate: Date | null;
    trip_id: string;
    tripStartDate: Date;
}

const FlightModal: React.FC<FlightModalProps> = ({ isOpen, onClose, newEventDate: date, trip_id, tripStartDate }) => {
    const { trip, updateTrip } = useTrip(trip_id);
    const [departureCityCode, setDepartureCityCode] = useState('');
    const [destinationCityCode, setDestinationCityCode] = useState('');

    const handleAddFlight = async () => {
        if (!trip || !date) return;

        // const relativeDepartureDay = Math.floor((date.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

        // const newFlight: Flight = {
        //     trip_id: trip.trip_id,
        //     creator_id: trip.creator_id,
        //     relative_departure_day: relativeDepartureDay,
        //     departure_city_code: departureCityCode,
        //     destination_city_code: destinationCityCode,
        //     // Add other flight details here
        // };

        // const updatedTrip = {
        //     ...trip,
        //     flights: [...trip.flights, newFlight],
        // };

        // await updateTrip(updatedTrip);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>Add New Flight</ModalHeader>
                <ModalBody>
                    <Input readOnly label="Date" value={date?.toDateString() || ''} />
                    <Input
                        label="Departure City Code"
                        placeholder="Enter departure city code"
                        value={departureCityCode}
                        onChange={e => setDepartureCityCode(e.target.value)}
                    />
                    <Input
                        label="Destination City Code"
                        placeholder="Enter destination city code"
                        value={destinationCityCode}
                        onChange={e => setDestinationCityCode(e.target.value)}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleAddFlight}>
                        Add Flight
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default FlightModal;
