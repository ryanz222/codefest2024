// app/trips/[trip_id]/hotelModal.tsx
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Button,
    Spinner,
    RadioGroup,
    Radio,
    Autocomplete,
    AutocompleteItem,
} from '@nextui-org/react';

import { Hotel, useTrip } from '@/hooks/useTrip';

interface HotelModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripStartDate: Date;
    hotel_entry_id: number;
    trip_id: string;
}

const HotelModal: React.FC<HotelModalProps> = ({ isOpen, onClose, tripStartDate, hotel_entry_id, trip_id }) => {
    const { trip, updateHotel } = useTrip(trip_id);
    const [hotelAddress, setHotelAddress] = useState('');
    const [hotelFilterPriority, setHotelFilterPriority] = useState<'PRICE' | 'DISTANCE' | 'RATING' | 'CLOSESTNAME'>('PRICE');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [hotelOptions, setHotelOptions] = useState<any[]>([]);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Find the current hotel in the trip data
    const currentHotel = useMemo(() => {
        return trip?.hotels.find(hotel => hotel.hotel_entry_id === hotel_entry_id);
    }, [trip, hotel_entry_id]);

    // Initialize state with current hotel data
    useEffect(() => {
        if (currentHotel) {
            setHotelAddress(currentHotel.address || '');
            setHotelFilterPriority(currentHotel.priority || 'PRICE');
            setSelectedHotelId(currentHotel.amadeus_hotel_id || null);
        }
    }, [currentHotel]);

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
            setHotelAddress(selectedPrediction.description);
        }
    };

    const handleHotelUpdate = async () => {
        if (currentHotel) {
            setIsLoading(true);
            setError(null);

            try {
                const updatedHotel: Hotel = {
                    ...currentHotel,
                    address: hotelAddress,
                    priority: hotelFilterPriority,
                    amadeus_hotel_id: selectedHotelId || currentHotel.amadeus_hotel_id,
                };

                await updateHotel(updatedHotel);
                onClose();
            } catch (error) {
                console.error('Error updating hotel:', error);
                setError('An error occurred while updating the hotel. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const exactCheckinDate = useMemo(() => {
        if (currentHotel && tripStartDate) {
            const date = new Date(tripStartDate);

            date.setDate(date.getDate() + currentHotel.relative_check_in_day);

            return date;
        }

        return null;
    }, [currentHotel, tripStartDate]);

    return (
        <Modal isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
            <ModalContent>
                <ModalHeader>Edit Hotel</ModalHeader>
                <ModalBody>
                    <Input readOnly label="Check-in Date" value={exactCheckinDate?.toDateString() || ''} />

                    <Autocomplete
                        label="Hotel Address"
                        placeholder="Enter hotel address"
                        value={hotelAddress}
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

                    <RadioGroup
                        label="Filter Priority"
                        value={hotelFilterPriority}
                        onValueChange={value => setHotelFilterPriority(value as 'PRICE' | 'DISTANCE' | 'RATING' | 'CLOSESTNAME')}
                    >
                        <Radio value="PRICE">Price</Radio>
                        <Radio value="DISTANCE">Distance</Radio>
                        <Radio value="RATING">Rating</Radio>
                    </RadioGroup>

                    {error && <p className="text-red-500">{error}</p>}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" disabled={isLoading} onPress={handleHotelUpdate}>
                        {isLoading ? <Spinner size="sm" /> : 'Update Hotel'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default HotelModal;
