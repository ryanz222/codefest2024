// app/trips/[trip_id]/activityModal.tsx
'use client';
import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@nextui-org/react';

import { Activity, useTrip } from '@/hooks/useTrip';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    trip_id: string;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, date, trip_id }) => {
    const { trip, updateTrip } = useTrip(trip_id);
    const [activityName, setActivityName] = useState('');
    const [activityDescription, setActivityDescription] = useState('');
    const [activityAddress, setActivityAddress] = useState('');

    const handleAddActivity = async () => {
        if (!trip || !date) return;

        const relativeDay = Math.floor((date.getTime() - trip.start_date.getTime()) / (1000 * 60 * 60 * 24));

        const newActivity: Activity = {
            trip_id: trip.trip_id,
            creator_id: trip.creator_id,
            relative_day: relativeDay,
            name: activityName,
            description: activityDescription,
            address: activityAddress,
            // Add other activity details here
        };

        const updatedTrip = {
            ...trip,
            activities: [...trip.activities, newActivity],
        };

        await updateTrip(updatedTrip);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>Add New Activity</ModalHeader>
                <ModalBody>
                    <Input readOnly label="Date" value={date?.toDateString() || ''} />
                    <Input
                        label="Activity Name"
                        placeholder="Enter activity name"
                        value={activityName}
                        onChange={e => setActivityName(e.target.value)}
                    />
                    <Input
                        label="Description"
                        placeholder="Enter description"
                        value={activityDescription}
                        onChange={e => setActivityDescription(e.target.value)}
                    />
                    <Input label="Address" placeholder="Enter address" value={activityAddress} onChange={e => setActivityAddress(e.target.value)} />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={handleAddActivity}>
                        Add Activity
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ActivityModal;
