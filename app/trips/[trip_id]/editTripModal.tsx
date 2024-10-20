// app/trips/[trip_id]/activityModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@nextui-org/react';

import { useTrip } from '@/hooks/useTrip';

interface EditTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip_id: string;
}

const EditTripModal: React.FC<EditTripModalProps> = ({ isOpen, onClose, trip_id }) => {
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
