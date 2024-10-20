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
    Card,
    CardBody,
    Select,
    SelectItem,
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
    const [showHotelOptions, setShowHotelOptions] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<any | null>(null);

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

        console.log('Selected prediction:', selectedPrediction);
        if (selectedPrediction) {
            setHotelAddress(selectedPrediction.description);
            handleSpecificHotelSubmission(selectedPrediction.description);
        }
    };

    const handleSpecificHotelSubmission = async (address: string) => {
        try {
            console.log('Submitting specific hotel:', address);
            // Step 1: Get latitude and longitude from address
            const geocodeResponse = await fetch(`/api/addressToCoordinate?address=${encodeURIComponent(address)}`);

            const geocodeData = await geocodeResponse.json();

            if (geocodeData.error) {
                throw new Error(geocodeData.error);
            }
            const { latitude, longitude } = geocodeData;

            // Step 2: Fetch hotel information from Amadeus
            const hotelResponse = await fetch(
                `/api/getHotelNearestCoordinate?latitude=${latitude}&longitude=${longitude}&checkInDate=${exactCheckinDate}`
            );
            const hotelData = await hotelResponse.json();

            if (hotelData.error) {
                throw new Error(hotelData.error);
            }

            console.log('Hotel data:', hotelData);
            // Step 3: Process and display hotel information
            if (hotelData.length > 0) {
                setHotelOptions(hotelData);
                setSelectedHotelId(null);
                setShowHotelOptions(true); // Show hotel options after fetching
            } else {
                throw new Error('No hotel offers found');
            }
        } catch (error) {
            console.error('Error submitting hotel:', error);
            setError('An error occurred while fetching hotel options. Please try again.');
        }
    };

    const handleHotelSelection = async () => {
        if (selectedHotelId && trip && exactCheckinDate) {
            const selectedHotel = hotelOptions.find(hotel => hotel.hotelId === selectedHotelId);

            console.log('Selected hotel:', selectedHotel);
            if (selectedHotel && tripStartDate) {
                //Update the hotel in the trip data
                console.log('Updating hotel:', currentHotel);
                const updatedHotel = {
                    ...currentHotel,
                    amadeus_hotel_id: selectedHotel.hotelId as string,
                    address: hotelAddress,
                    photo_url: '',
                    hotel_latitude: selectedHotel.geoCode.latitude,
                    hotel_longitude: selectedHotel.geoCode.longitude,
                };

                console.log('Updated hotel:', updatedHotel);

                updateHotel(updatedHotel as Hotel);
                onClose();
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

    const handleHotelSelect = (hotelId: string) => {
        const hotel = hotelOptions.find(h => h.hotelId === hotelId);

        setSelectedHotel(hotel);
        setSelectedHotelId(hotelId);
    };

    return (
        <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
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

                    {showHotelOptions && (
                        <div className="mt-4">
                            <Select
                                label="Select a hotel"
                                placeholder="Choose a hotel"
                                selectedKeys={selectedHotelId ? [selectedHotelId] : []}
                                onChange={e => handleHotelSelect(e.target.value)}
                            >
                                {hotelOptions.map(hotel => (
                                    <SelectItem key={hotel.hotelId} value={hotel.hotelId}>
                                        {hotel.name} - {hotel.address.cityName}, {hotel.address.countryCode}
                                    </SelectItem>
                                ))}
                            </Select>

                            {selectedHotel && (
                                <Card className="mt-4">
                                    <CardBody>
                                        <h3 className="text-lg font-bold">{selectedHotel.name}</h3>
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    )}

                    {error && <p className="text-red-500">{error}</p>}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" disabled={isLoading || !selectedHotelId} onPress={handleHotelSelection}>
                        {isLoading ? <Spinner size="sm" /> : 'Update Hotel'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default HotelModal;
