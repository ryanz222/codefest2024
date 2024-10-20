// app/api/getHotelListByIATACode/route.ts
import { NextResponse } from 'next/server';
import Amadeus from 'amadeus-ts';

const amadeus = new Amadeus({
    //host: 'api.amadeus.com',
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cityCode = searchParams.get('cityCode');

    if (!cityCode) {
        return NextResponse.json({ error: 'City code is required' }, { status: 400 });
    }

    try {
        const response = await amadeus.referenceData.locations.hotels.byCity.get({
            cityCode: cityCode,
        });

        const hotels = response.data;

        return NextResponse.json(hotels);
    } catch (error) {
        console.error('Error fetching hotel offers:', error);

        return NextResponse.json({ error: 'Failed to fetch hotel offers' }, { status: 500 });
    }
}
