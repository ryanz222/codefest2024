'use client';

import React, { useState } from 'react';
import { Input, Button, Card, CardBody, CardHeader, Spinner } from '@nextui-org/react';

const CityCodeTest: React.FC = () => {
    const [cityName, setCityName] = useState('');
    const [cityCode, setCityCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (value: string) => {
        setCityName(value);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        setCityCode(null);

        try {
            const response = await fetch(`/api/cityNameTocityCode?cityName=${encodeURIComponent(cityName)}`);
            const data = await response.json();
            console.log('Data:', data);

            if (response.ok) {
                console.log('City code:', data.airportCode);
                setCityCode(data.airportCode);
            } else {
                setError(data.error || 'An error occurred while fetching the city code.');
            }
        } catch (error) {
            setError('An error occurred while fetching the city code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="flex justify-center">
                    <h1 className="text-2xl font-bold">City Code Test</h1>
                </CardHeader>
                <CardBody className="space-y-4">
                    <Input label="City Name" placeholder="Enter city name" value={cityName} onChange={e => handleInputChange(e.target.value)} />
                    <Button color="primary" disabled={isLoading || !cityName} onPress={handleSubmit}>
                        {isLoading ? <Spinner size="sm" /> : 'Get City Code'}
                    </Button>
                    {error && <p className="text-red-500">{error}</p>}
                    {cityCode && (
                        <div className="mt-4">
                            <h2 className="text-lg font-semibold">Result:</h2>
                            <p>City Code: {cityCode}</p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default CityCodeTest;
