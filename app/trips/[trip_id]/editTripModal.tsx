// app/trips/[trip_id]/activityModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Button,
    Calendar,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@nextui-org/react';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';

import { useTrip } from '@/hooks/useTrip';

interface EditTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip_id: string;
    tripStartDate: Date;
    setTripStartDate: (date: Date) => void;
}

const EditTripModal: React.FC<EditTripModalProps> = ({ isOpen, onClose, trip_id, tripStartDate, setTripStartDate }) => {
    const { trip, updateTrip } = useTrip(trip_id);
    const [name, setName] = useState(trip?.trip_name || '');
    const [tripLength, setTripLength] = useState(trip?.length_in_days?.toString() || '');
    const [photoUrl, setPhotoUrl] = useState(trip?.photo_url || '');

    // Update local state when trip data changes
    useEffect(() => {
        if (trip) {
            setName(trip.trip_name || '');
            setTripLength(trip.length_in_days?.toString() || '');
            setPhotoUrl(trip.photo_url || '');
        }
    }, [trip]);

    const handleSaveChanges = async () => {
        if (!trip) return;

        const updatedTrip = {
            ...trip,
            trip_name: name,
            length_in_days: parseInt(tripLength, 10),
            photo_url: photoUrl,
        };

        await updateTrip(updatedTrip);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>Edit Trip Details</ModalHeader>
                <ModalBody>
                    <Input label="Trip Name" placeholder="Enter trip name" value={name} onChange={e => setName(e.target.value)} />
                    <Input
                        label="Trip Length (days)"
                        placeholder="Enter trip length in days"
                        type="number"
                        value={tripLength}
                        onChange={e => setTripLength(e.target.value)}
                    />
                    <Input label="Photo URL" placeholder="Enter photo URL" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
                    <Popover placement="bottom">
                        <PopoverTrigger>
                            <Button variant="bordered">Start Date: {tripStartDate.toLocaleDateString()}</Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <Calendar
                                aria-label="Trip start date"
                                minValue={today(getLocalTimeZone())}
                                value={parseDate(tripStartDate.toISOString().split('T')[0])}
                                onChange={date => {
                                    const isoDate = date.toString();
                                    const selectedDate = new Date(isoDate);
                                    const adjustedDate = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);

                                    setTripStartDate(adjustedDate);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleSaveChanges}>
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditTripModal;
