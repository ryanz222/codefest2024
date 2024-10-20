// app/trips/[trip_id]/flightModal.tsx
'use client';
/// <reference types="@types/google.maps" />

import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Button,
    Switch,
    Select,
    SelectItem,
    Spinner,
    Autocomplete,
    AutocompleteItem,
} from '@nextui-org/react';
import { toast } from 'react-hot-toast';

import { Flight, useTrip } from '@/hooks/useTrip';

interface FlightModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip_id: string;
    tripStartDate: Date;
    flight_entry_id: number;
}

const FlightModal: React.FC<FlightModalProps> = ({ isOpen, onClose, trip_id, tripStartDate, flight_entry_id }) => {
    const { trip, updateFlight, deleteFlight } = useTrip(trip_id);
    const [flightData, setFlightData] = useState<Flight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [departureCityInput, setDepartureCityInput] = useState('');
    const [destinationCityInput, setDestinationCityInput] = useState('');
    const [departurePredictions, setDeparturePredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [destinationPredictions, setDestinationPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);

    // Find the current flight in the trip data
    useEffect(() => {
        if (trip) {
            const currentFlight = trip.flights.find(flight => flight.flight_entry_id === flight_entry_id);

            if (currentFlight) {
                setFlightData(currentFlight);
            }
        }
    }, [trip, flight_entry_id]);

    const handleUpdateFlight = async () => {
        if (!flightData) return;

        setIsLoading(true);
        setError(null);

        try {
            await updateFlight(flightData);
            toast.success('Flight updated successfully');
            onClose();
        } catch (error) {
            console.error('Error updating flight:', error);
            setError('An error occurred while updating the flight. Please try again.');
            toast.error('Failed to update flight');
        } finally {
            setIsLoading(false);
        }
    };

    const exactDepartureDate = useMemo(() => {
        if (flightData && tripStartDate) {
            const date = new Date(tripStartDate);

            date.setDate(date.getDate() + flightData.relative_departure_day);

            return date;
        }

        return null;
    }, [flightData, tripStartDate]);

    const handleInputChange = async (value: string, type: 'departure' | 'destination') => {
        if (value.length > 2) {
            try {
                const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(value)}`);
                const data = await response.json();

                if (data.predictions) {
                    if (type === 'departure') {
                        setDeparturePredictions(data.predictions);
                    } else {
                        setDestinationPredictions(data.predictions);
                    }
                } else {
                    console.error('Unexpected response format:', data);
                    if (type === 'departure') {
                        setDeparturePredictions([]);
                    } else {
                        setDestinationPredictions([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching predictions:', error);
                if (type === 'departure') {
                    setDeparturePredictions([]);
                } else {
                    setDestinationPredictions([]);
                }
            }
        } else {
            if (type === 'departure') {
                setDeparturePredictions([]);
            } else {
                setDestinationPredictions([]);
            }
        }
    };

    const handleCitySelect = async (predictionId: string, type: 'departure' | 'destination') => {
        const predictions = type === 'departure' ? departurePredictions : destinationPredictions;
        const selectedPrediction = predictions.find(p => p.place_id === predictionId);

        if (selectedPrediction) {
            const cityName = selectedPrediction.description;

            if (type === 'departure') {
                setDepartureCityInput(cityName);
            } else {
                setDestinationCityInput(cityName);
            }

            try {
                const response = await fetch(`/api/cityNameTocityCode?cityName=${encodeURIComponent(cityName)}`);
                const data = await response.json();

                if (data.airportCode) {
                    setFlightData(prev => ({
                        ...(prev as Flight),
                        [type === 'departure' ? 'departure_city_code' : 'destination_city_code']: data.airportCode,
                    }));
                } else {
                    console.error('City code not found');
                }
            } catch (error) {
                console.error('Error fetching city code:', error);
            }
        }
    };

    if (!flightData) return null;

    return (
        <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Edit Flight</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <Input key="departureDate" readOnly label="Departure Date" value={exactDepartureDate?.toDateString() || ''} />
                        <div className="flex gap-4">
                            <Autocomplete
                                label="Departure City"
                                placeholder="Enter departure city"
                                value={departureCityInput}
                                onInputChange={value => handleInputChange(value, 'departure')}
                                onSelectionChange={key => {
                                    if (typeof key === 'string') {
                                        handleCitySelect(key, 'departure');
                                    }
                                }}
                            >
                                {departurePredictions.map(prediction => (
                                    <AutocompleteItem key={prediction.place_id} textValue={prediction.description}>
                                        {prediction.description}
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                            <Input
                                label="Departure City Code"
                                value={flightData.departure_city_code}
                                onChange={e => setFlightData({ ...flightData, departure_city_code: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Autocomplete
                                label="Destination City"
                                placeholder="Enter destination city"
                                value={destinationCityInput}
                                onInputChange={value => handleInputChange(value, 'destination')}
                                onSelectionChange={key => {
                                    if (typeof key === 'string') {
                                        handleCitySelect(key, 'destination');
                                    }
                                }}
                            >
                                {destinationPredictions.map(prediction => (
                                    <AutocompleteItem key={prediction.place_id} textValue={prediction.description}>
                                        {prediction.description}
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                            <Input
                                label="Destination City Code"
                                value={flightData.destination_city_code}
                                onChange={e => setFlightData({ ...flightData, destination_city_code: e.target.value })}
                            />
                        </div>
                        <Select
                            key="travelClass"
                            label="Travel Class"
                            selectedKeys={[flightData.travel_class]}
                            onSelectionChange={keys =>
                                setFlightData({
                                    ...flightData,
                                    travel_class: Array.from(keys)[0] as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
                                })
                            }
                        >
                            <SelectItem key="ECONOMY">Economy</SelectItem>
                            <SelectItem key="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                            <SelectItem key="BUSINESS">Business</SelectItem>
                            <SelectItem key="FIRST">First</SelectItem>
                        </Select>
                        <Switch
                            key="nonStop"
                            checked={flightData.non_stop}
                            onValueChange={checked => setFlightData({ ...flightData, non_stop: checked })}
                        >
                            Non-stop flights only
                        </Switch>
                        <Input
                            key="currency"
                            label="Currency"
                            type="text"
                            value={flightData.currency}
                            onChange={e => setFlightData({ ...flightData, currency: e.target.value })}
                        />
                        <Input
                            key="maxPrice"
                            label="Max Price"
                            type="number"
                            value={flightData.max_price.toString()}
                            onChange={e => setFlightData({ ...flightData, max_price: parseFloat(e.target.value) })}
                        />
                        <Input
                            key="includedAirlineCodes"
                            label="Included Airline Codes"
                            placeholder="Comma-separated list"
                            value={flightData.included_airline_codes.join(',')}
                            onChange={e => setFlightData({ ...flightData, included_airline_codes: e.target.value.split(',') })}
                        />
                        <Input
                            key="excludedAirlineCodes"
                            label="Excluded Airline Codes"
                            placeholder="Comma-separated list"
                            value={flightData.excluded_airline_codes.join(',')}
                            onChange={e => setFlightData({ ...flightData, excluded_airline_codes: e.target.value.split(',') })}
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                </ModalBody>
                <ModalFooter>
                    {!!flightData.flight_entry_id && (
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                deleteFlight(flightData.flight_entry_id!);
                                onClose();
                            }}
                        >
                            Delete Flight
                        </Button>
                    )}
                    <Button color="primary" disabled={isLoading} onPress={handleUpdateFlight}>
                        {isLoading ? <Spinner size="sm" /> : 'Update Flight'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default FlightModal;
