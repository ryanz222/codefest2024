import { NextResponse } from 'next/server';
import Amadeus from 'amadeus-ts';

const amadeus = new Amadeus({
    host: 'api.amadeus.com',
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelIds = searchParams.get('hotelIds');
    const adults = searchParams.get('adults');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');

    if (!hotelIds || !adults || !checkInDate || !checkOutDate) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        console.log('Fetching hotel offers for hotelIds:', hotelIds, 'adults:', adults, 'checkInDate:', checkInDate, 'checkOutDate:', checkOutDate);
        const response = await amadeus.shopping.hotelOffersSearch.get({
            hotelIds: hotelIds.toString(),
            adults: parseInt(adults),
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            bestRateOnly: true,
        });
        console.log('Response:', response.data);
        return NextResponse.json(response.data, { status: 200 });
    } catch (error) {
        console.error('Error fetching hotel offers:', error);
        return NextResponse.json({ error: 'Failed to fetch hotel offers' }, { status: 500 });
    }
}