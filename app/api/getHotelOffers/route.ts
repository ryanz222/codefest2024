// app/api/getHotelOffers/route.ts
import { NextResponse } from 'next/server';
import Amadeus, { CurrencyCode, HotelOffersSearchParams } from 'amadeus-ts';
export const runtime = 'nodejs'; // Set the runtime to Node.js

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

export type HotelOffer = {
    hotelId: string;
    hotelName: string;
    chainCode: string;
    cityCode: string;
    latitude: number;
    longitude: number;
    offerId: string;
    checkInDate: string;
    checkOutDate: string;
    roomType: string;
    bedType: string;
    description: string;
    adults: number;
    currency: string;
    basePrice: string;
    totalPrice: string;
};

export type PaymentPolicy = 'GUARANTEE' | 'DEPOSIT' | 'NONE';
export type BoardType = 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD' | 'ALL_INCLUSIVE';

function logAndDefault(field: string, hotelName: string, defaultValue: any = `MISSING ${field.toUpperCase()}`) {
    console.error(`Error: Missing ${field} in hotel offer ${hotelName}`);

    return defaultValue;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Make sure required hotelIds are provided
    const hotelIds = searchParams.get('hotelIds');

    if (!hotelIds) {
        return NextResponse.json({ error: 'hotelIds are required' }, { status: 400 });
    }

    const filters: HotelOffersSearchParams = {
        hotelIds: hotelIds, // keep this as a comma separated string
        adults: parseInt(searchParams.get('adults') || '1'),
        checkInDate: searchParams.get('checkInDate') || undefined, // Format YYYY-MM-DD
        checkOutDate: searchParams.get('checkOutDate') || undefined, // Format YYYY-MM-DD
        includeClosed: searchParams.get('includeClosed') === 'true' ? true : false,
        bestRateOnly: searchParams.get('bestRateOnly') === 'false' ? false : true,
        paymentPolicy: (searchParams.get('paymentPolicy') as PaymentPolicy) || 'NONE',
        priceRange: searchParams.get('priceRange') || undefined,
        currencyCode: (searchParams.get('currencyCode') as CurrencyCode) || undefined,
        boardType: (searchParams.get('boardType') as BoardType) || undefined,
        lang: searchParams.get('lang') || undefined,
    };

    try {
        const response = await amadeus.shopping.hotelOffersSearch.get(filters);
        const hotelOffers = response.data;
        const simplifiedOffers: HotelOffer[] = hotelOffers.flatMap(hotel => {
            return (hotel.offers || []).map(offer => {
                const hotelName = hotel.hotel?.name || hotel.hotel?.hotelId || 'MISSING HOTEL NAME';
                const hotelOffer: HotelOffer = {
                    hotelId: hotel.hotel?.hotelId || logAndDefault('hotelId', hotelName),
                    hotelName: hotel.hotel?.name || logAndDefault('hotelName', hotelName),
                    chainCode: hotel.hotel?.chainCode || logAndDefault('chainCode', hotelName),
                    cityCode: hotel.hotel?.cityCode || logAndDefault('cityCode', hotelName),
                    latitude: (hotel.hotel as any).latitude || logAndDefault('latitude', hotelName, 0),
                    longitude: (hotel.hotel as any).longitude || logAndDefault('longitude', hotelName, 0),
                    offerId: offer.id || logAndDefault('offerId', hotelName),
                    checkInDate: offer.checkInDate || logAndDefault('checkInDate', hotelName),
                    checkOutDate: offer.checkOutDate || logAndDefault('checkOutDate', hotelName),
                    roomType: offer.room.type || logAndDefault('roomType', hotelName),
                    bedType: offer.room.typeEstimated?.bedType || logAndDefault('bedType', hotelName),
                    description: offer.room.description?.text || logAndDefault('description', hotelName),
                    adults: offer.guests?.adults || logAndDefault('adults', hotelName, 1),
                    currency: offer.price.currency || logAndDefault('currency', hotelName),
                    basePrice: offer.price.base || logAndDefault('basePrice', hotelName),
                    totalPrice: offer.price.total || logAndDefault('totalPrice', hotelName),
                };

                return hotelOffer;
            });
        });

        return NextResponse.json(simplifiedOffers);
    } catch (error) {
        console.error('Error fetching hotel offers:', error);

        return NextResponse.json({ error: 'Failed to fetch hotel offers' }, { status: 500 });
    }
}
