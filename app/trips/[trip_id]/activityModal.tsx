// app/trips/[trip_id]/activityModal.tsx
'use client';
import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button, Textarea, Autocomplete, AutocompleteItem } from '@nextui-org/react';

import { Activity, useTrip } from '@/hooks/useTrip';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    newEventDate: Date | null;
    trip_id: string;
    tripStartDate: Date;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, newEventDate: date, trip_id, tripStartDate }) => {
    const { trip, updateTrip } = useTrip(trip_id);
    const [activityName, setActivityName] = useState('');
    const [activityDescription, setActivityDescription] = useState('');
    const [activityAddress, setActivityAddress] = useState('');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);

    const handleInputChange = async (value: string) => {
        if (value.length > 2) {
            try {
                const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(value)}`);
                const data = await response.json();

                if (data.predictions) {
                    setPredictions(data.predictions);
                } else {
                    console.error('Unexpected response format:', data);
                    setPredictions([]);
                }
            } catch (error) {
                console.error('Error fetching predictions:', error);
                setPredictions([]);
            }
        } else {
            setPredictions([]);
        }
    };

    const handlePredictionSelect = (predictionId: string) => {
        const selectedPrediction = predictions.find(p => p.place_id === predictionId);

        if (selectedPrediction) {
            setActivityAddress(selectedPrediction.description);
        }
    };

    const handleAddActivity = async () => {
        if (!trip || !date) return;

        const relativeDay = Math.floor((date.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

        const newActivity: Omit<Activity, 'id'> = {
            trip_id: trip.trip_id,
            creator_id: trip.creator_id,
            relative_day: relativeDay,
            name: activityName,
            description: activityDescription,
            address: activityAddress,
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
                    <Input isReadOnly label="Date" value={date?.toDateString() || ''} />
                    <Input label="Activity Name" placeholder="Enter activity name" value={activityName} onValueChange={setActivityName} />
                    <Textarea
                        label="Description"
                        placeholder="Enter description"
                        value={activityDescription}
                        onValueChange={setActivityDescription}
                    />
                    <Autocomplete
                        label="Activity Address"
                        placeholder="Enter activity address"
                        onInputChange={handleInputChange}
                        onSelectionChange={key => {
                            if (typeof key === 'string') {
                                handlePredictionSelect(key);
                            }
                        }}
                    >
                        {predictions.map(prediction => (
                            <AutocompleteItem key={prediction.place_id} textValue={prediction.description}>
                                {prediction.description}
                            </AutocompleteItem>
                        ))}
                    </Autocomplete>
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
