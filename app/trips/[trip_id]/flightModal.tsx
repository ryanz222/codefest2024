// app/trips/[trip_id]/flightModal.tsx
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
    Switch,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
} from '@nextui-org/react';

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
    const [flightData, setFlightData] = useState<Flight>({
        trip_id: trip_id,
        creator_id: trip?.creator_id || '',
        id: '',
        destination_city_code: '',
        departure_city_code: '',
        relative_departure_day: 0,
        relative_return_day: 0,
        adults: 1,
        travel_class: 'ECONOMY',
        non_stop: false,
        currency: 'USD',
        max_price: 1000,
        included_airline_codes: [],
        excluded_airline_codes: [],
    });

    const [departureCity, setDepartureCity] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [departureSuggestions, setDepartureSuggestions] = useState<string[]>([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
    const [departurePredictions, setDeparturePredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [destinationPredictions, setDestinationPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);

    useEffect(() => {
        if (departureCity) {
            fetchSuggestions(departureCity, setDepartureSuggestions);
        }
    }, [departureCity]);

    useEffect(() => {
        if (destinationCity) {
            fetchSuggestions(destinationCity, setDestinationSuggestions);
        }
    }, [destinationCity]);

    const fetchSuggestions = async (input: string, setSuggestions: React.Dispatch<React.SetStateAction<string[]>>) => {
        try {
            const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
            const data = await response.json();
            const suggestions = data.predictions.map((prediction: any) => prediction.description);

            setSuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    const fetchCityCode = async (cityName: string, setCode: React.Dispatch<React.SetStateAction<string>>) => {
        try {
            const response = await fetch(`/api/places/citycode?cityName=${encodeURIComponent(cityName)}`);
            const data = await response.json();

            setCode(data.cityCode);
        } catch (error) {
            console.error('Error fetching city code:', error);
        }
    };

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
                setDepartureCity(cityName);
            } else {
                setDestinationCity(cityName);
            }

            try {
                const response = await fetch(`/api/cityNameTocityCode?cityName=${encodeURIComponent(cityName)}`);
                const data = await response.json();

                if (data.airportCode) {
                    handleInputChange(type === 'departure' ? 'departure_city_code' : 'destination_city_code', data.airportCode);
                } else {
                    console.error('City code not found');
                }
            } catch (error) {
                console.error('Error fetching city code:', error);
            }
        }
    };

    const handleAddFlight = async () => {
        if (!trip || !date) return;

        const relativeDepartureDay = Math.floor((date.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

        const newFlight: Flight = {
            ...flightData,
            relative_departure_day: relativeDepartureDay,
            relative_return_day: relativeDepartureDay, // Assuming it's a one-way flight for now
        };

        const updatedTrip = {
            ...trip,
            flights: [...trip.flights, newFlight],
        };

        await updateTrip(updatedTrip);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Add New Flight</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <Input readOnly label="Date" value={date?.toDateString() || ''} />
                        <Autocomplete
                            label="Departure City"
                            placeholder="Enter departure city"
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
                        <Autocomplete
                            label="Destination City"
                            placeholder="Enter destination city"
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
                            label="Number of Adults"
                            type="number"
                            value={flightData.adults.toString()}
                            onChange={e => setFlightData({ ...flightData, adults: parseInt(e.target.value) })}
                        />
                        <Select
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
                        <Switch checked={flightData.non_stop} onValueChange={checked => setFlightData({ ...flightData, non_stop: checked })}>
                            Non-stop flights only
                        </Switch>
                        <Input
                            label="Currency"
                            type="text"
                            value={flightData.currency}
                            onChange={e => setFlightData({ ...flightData, currency: e.target.value })}
                        />
                        <Input
                            label="Max Price"
                            type="number"
                            value={flightData.max_price.toString()}
                            onChange={e => setFlightData({ ...flightData, max_price: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Included Airline Codes"
                            placeholder="Comma-separated list"
                            value={flightData.included_airline_codes.join(',')}
                            onChange={e => setFlightData({ ...flightData, included_airline_codes: e.target.value.split(',') })}
                        />
                        <Input
                            label="Excluded Airline Codes"
                            placeholder="Comma-separated list"
                            value={flightData.excluded_airline_codes.join(',')}
                            onChange={e => setFlightData({ ...flightData, excluded_airline_codes: e.target.value.split(',') })}
                        />
                    </div>
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
