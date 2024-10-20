import { NextResponse } from 'next/server';
import Amadeus from 'amadeus-ts';

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Extract parameters from searchParams
    const adults = searchParams.get('adults');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');

    const latitude = searchParams.get('search_latitude');
    const longitude = searchParams.get('search_longitude');
    const radius = searchParams.get('search_radius');
    const radiusUnit = searchParams.get('search_radius_unit');
    const chainCodes = searchParams.get('allowed_chain_codes');
    const ratings = searchParams.get('allowed_ratings');
    const amenities = searchParams.get('required_amenities');
    const priority = searchParams.get('priority') || 'PRICE';
    const idealHotelName = searchParams.get('ideal_hotel_name');

    // Validate required parameters
    if (!latitude || !longitude || !radius || !radiusUnit) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        // Step 1: Call Amadeus Hotel List API
        const hotelListResponse = await amadeus.referenceData.locations.hotels.byGeocode.get({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius: parseFloat(radius),
            radiusUnit: radiusUnit as 'MILE' | 'KM',
            chainCodes: chainCodes || undefined,
            ratings: ratings || undefined,
            amenities: amenities || undefined,
        });

        const hotelIds = hotelListResponse.data.map(hotel => hotel.hotelId).join(',');

        // Step 2: Call getHotelOffers with the hotel IDs
        const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
            hotelIds,
            adults: parseInt(adults || '1'),
            checkInDate: checkInDate || undefined,
            checkOutDate: checkOutDate || undefined,
            bestRateOnly: true,
        });

        // Process and sort offers based on priority
        let sortedOffers = offersResponse.data;

        console.log('sortedOffers', sortedOffers);

        // Return the best offer based on the priority
        return NextResponse.json(sortedOffers[0], { status: 200 });
    } catch (error) {
        console.error('Error fetching hotel data:', error);

        return NextResponse.json({ error: 'Failed to fetch hotel data' }, { status: 500 });
    }
}

// Helper function to calculate Levenshtein distance for CLOSESTNAME priority
function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }

    return matrix[b.length][a.length];
}
