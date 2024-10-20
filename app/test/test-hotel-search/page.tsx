'use client';

import { useState } from 'react';
import { Button, Input, Card, CardBody, CardHeader, Divider } from '@nextui-org/react';

import { useTrip } from '@/hooks/useTrip';

export default function TestHotelSearch() {
    const [searchParams, setSearchParams] = useState({
        adults: '2',
        checkInDate: '2023-12-01',
        checkOutDate: '2023-12-05',
        search_latitude: '48.8566',
        search_longitude: '2.3522',
        search_radius: '5',
        search_radius_unit: 'KM',
        allowed_chain_codes: '',
        allowed_ratings: '',
        required_amenities: '',
        priority: 'PRICE',
        ideal_hotel_name: '',
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { createHotel } = useTrip('test-trip-id'); // Replace with an actual trip ID

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/api/hotel-api/getHotelFromParams?${queryString}`);
            const data = await response.json();

            setResult(data);

            // Create a new hotel entry using the result
            if (data && data.hotel) {
                await createHotel({
                    trip_id: 'test-trip-id', // Replace with actual trip ID
                    relative_check_in_day: 0, // You may want to calculate this based on the trip start date
                    relative_check_out_day: 4, // You may want to calculate this based on the check-in and check-out dates
                    amadeus_hotel_id: data.hotel.hotelId,
                    address: data.hotel.address.lines.join(', '),
                    hotel_latitude: parseFloat(data.hotel.latitude),
                    hotel_longitude: parseFloat(data.hotel.longitude),
                    // Add other fields as necessary
                });
            }
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <h2 className="text-2xl font-bold">Hotel Search Test</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="space-y-4">
                        {Object.entries(searchParams).map(([key, value]) => (
                            <Input key={key} label={key.replace(/_/g, ' ')} name={key} value={value} onChange={handleInputChange} />
                        ))}
                        <Button color="primary" isLoading={loading} onClick={handleSubmit}>
                            Search
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {error && (
                <Card className="mt-4 max-w-2xl mx-auto bg-danger-50">
                    <CardBody>
                        <p className="text-danger">{error}</p>
                    </CardBody>
                </Card>
            )}

            {result && (
                <Card className="mt-4 max-w-2xl mx-auto">
                    <CardHeader>
                        <h3 className="text-xl font-semibold">Search Result</h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
