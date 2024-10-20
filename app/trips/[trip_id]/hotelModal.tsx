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
    date: Date | null;
    trip_id: string;
}

const HotelModal: React.FC<HotelModalProps> = ({ isOpen, onClose, date, trip_id }) => {
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
        // Implement the autocomplete logic
    };

    const handlePredictionSelect = (predictionId: string) => {
        // Handle the selection logic
    };

    const handleSpecificHotelSubmission = async () => {
        // Implement the specific hotel submission logic
    };

    const handleHotelSelection = async () => {
        if (!trip || !date || !selectedHotelId) return;

        const selectedHotel = hotelOptions.find(hotel => hotel.hotelId === selectedHotelId);

        if (selectedHotel) {
            const relativeCheckInDay = Math.floor((date.getTime() - trip.start_date.getTime()) / (1000 * 60 * 60 * 24));

            const newHotel: Hotel = {
                trip_id: trip.trip_id,
                creator_id: trip.creator_id,
                relative_check_in_day: relativeCheckInDay,
                relative_check_out_day: relativeCheckInDay + 1,
                adults: 2,
                hotel_id: selectedHotel.hotelId,
                address: hotelAddress,
                photo_url: '',
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
    };

    const handleAddHotel = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (hotelModalTab === 'specific') {
                await handleSpecificHotelSubmission();
            } else {
                // Implement hotel search submission logic
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
                    <Input readOnly label="Date" value={date?.toDateString() || ''} />

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
