import { NextResponse } from 'next/server';
import Amadeus from 'amadeus-ts';

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET,
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const checkInDate = searchParams.get('checkInDate');

    if (!latitude || !longitude || !checkInDate) {
        return NextResponse.json({ error: 'Latitude, longitude, and checkInDate are required' }, { status: 400 });
    }

    try {
        const response = await amadeus.referenceData.locations.hotels.byGeocode.get({
            latitude: Number(latitude),
            longitude: Number(longitude),
            radius: 5,
            radiusUnit: 'KM',
        });

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Amadeus API error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
