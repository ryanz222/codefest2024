// app/trips/[trip_id]/hotelModal.tsx
'use client';
import React, { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Button,
    ButtonGroup,
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
    newEventDate: Date | null;
    tripStartDate: Date | null;
    trip_id: string;
}

const HotelModal: React.FC<HotelModalProps> = ({ isOpen, onClose, newEventDate: exactCheckinDate, tripStartDate, trip_id }) => {
    const { trip, updateTrip } = useTrip(trip_id);
    const [hotelModalTab, setHotelModalTab] = useState<'specific' | 'search'>('specific');
    const [hotelAddress, setHotelAddress] = useState('');
    const [hotelCity, setHotelCity] = useState('');
    const [hotelFilterPriority, setHotelFilterPriority] = useState<'PRICE' | 'DISTANCE' | 'RATING'>('PRICE');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [hotelOptions, setHotelOptions] = useState<any[]>([]);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleSpecificHotelSubmission = async () => {
        try {
            console.log('Submitting specific hotel:', hotelAddress);
            // Step 1: Get latitude and longitude from address
            const geocodeResponse = await fetch(`/api/addressToCoordinate?address=${encodeURIComponent(hotelAddress)}`);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.error) {
                throw new Error(geocodeData.error);
            }
            const { latitude, longitude } = geocodeData;

            // Step 2: Get tomorrow's date for check-in
            const tomorrow = new Date();

            tomorrow.setDate(tomorrow.getDate() + 1);
            const checkInDate = tomorrow.toISOString().split('T')[0];

            // Step 3: Fetch hotel information from Amadeus
            const hotelResponse = await fetch(
                `/api/getHotelNearestCoordinate?latitude=${latitude}&longitude=${longitude}&checkInDate=${checkInDate}`
            );
            const hotelData = await hotelResponse.json();

            if (hotelData.error) {
                throw new Error(hotelData.error);
            }

            console.log('Hotel data:', hotelData);
            // Step 4: Process and display hotel information
            if (hotelData.length > 0) {
                setHotelOptions(hotelData);
                setSelectedHotelId(null);
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
                const relativeCheckInDay = Math.floor((exactCheckinDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));
                const newHotel: Hotel = {
                    trip_id: trip.trip_id,
                    creator_id: trip.creator_id,
                    relative_check_in_day: relativeCheckInDay,
                    relative_check_out_day: relativeCheckInDay + 1, // Assuming 1-night stay by default
                    adults: 2, // Default value, can be adjusted
                    hotel_id: selectedHotel.hotelId,
                    address: hotelAddress,
                    photo_url: '', // Assuming this is available in the Amadeus response
                    search_latitude: selectedHotel.geoCode.latitude,
                    search_longitude: selectedHotel.geoCode.longitude,
                    search_radius: 5,
                    search_radius_unit: 'KM',
                    allowed_chain_codes: [],
                    allowed_ratings: [],
                    required_amenities: [],
                    priority: hotelFilterPriority,
                    ideal_hotel_name: selectedHotel.name,
                };

                const updatedTrip = {
                    ...trip,
                    hotels: [...trip.hotels, newHotel],
                };

                await updateTrip(updatedTrip);
                onClose();
            }
        }
    };

    const handleAddHotel = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (hotelModalTab === 'specific') {
                await handleSpecificHotelSubmission();
            } else {
                // Implement hotel search submission logic
                console.log('Submitting hotel search:', { hotelCity, hotelFilterPriority });
            }
        } catch (error) {
            setError('An error occurred while adding the hotel. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>Add New Hotel</ModalHeader>
                <ModalBody>
                    <Input readOnly label="Date" value={exactCheckinDate?.toDateString() || ''} />

                    <ButtonGroup>
                        <Button color={hotelModalTab === 'specific' ? 'primary' : 'default'} onPress={() => setHotelModalTab('specific')}>
                            Specific Hotel
                        </Button>
                        <Button color={hotelModalTab === 'search' ? 'primary' : 'default'} onPress={() => setHotelModalTab('search')}>
                            Search Hotels
                        </Button>
                    </ButtonGroup>

                    {hotelModalTab === 'specific' ? (
                        <>
                            <Autocomplete
                                label="Hotel Address"
                                placeholder="Enter hotel address"
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

                            {hotelOptions.length > 0 && (
                                <RadioGroup label="Select a hotel" value={selectedHotelId} onValueChange={setSelectedHotelId}>
                                    {hotelOptions.map(hotel => (
                                        <Radio key={hotel.hotelId} value={hotel.hotelId}>
                                            {hotel.name}
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            )}
                        </>
                    ) : (
                        <>
                            <Input label="City" placeholder="Enter city name" value={hotelCity} onChange={e => setHotelCity(e.target.value)} />
                            <ButtonGroup>
                                <Button
                                    color={hotelFilterPriority === 'PRICE' ? 'primary' : 'default'}
                                    onPress={() => setHotelFilterPriority('PRICE')}
                                >
                                    Price
                                </Button>
                                <Button
                                    color={hotelFilterPriority === 'DISTANCE' ? 'primary' : 'default'}
                                    onPress={() => setHotelFilterPriority('DISTANCE')}
                                >
                                    Distance
                                </Button>
                                <Button
                                    color={hotelFilterPriority === 'RATING' ? 'primary' : 'default'}
                                    onPress={() => setHotelFilterPriority('RATING')}
                                >
                                    Rating
                                </Button>
                            </ButtonGroup>
                        </>
                    )}

                    {error && <p className="text-red-500">{error}</p>}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        disabled={isLoading || (hotelOptions.length > 0 && !selectedHotelId)}
                        onPress={hotelOptions.length > 0 ? handleHotelSelection : handleAddHotel}
                    >
                        {isLoading ? <Spinner size="sm" /> : hotelOptions.length > 0 ? 'Confirm Hotel' : 'Search Hotels'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default HotelModal;
