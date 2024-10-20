import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cityName = searchParams.get('cityName');

    if (!cityName) {
        return NextResponse.json({ error: 'Invalid cityName parameter' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key is not configured' }, { status: 500 });
    }

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=airport+in+${encodeURIComponent(cityName)}&key=${apiKey}`;

    try {
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.status === 'OK' && searchData.results.length > 0) {
            const location = searchData.results[0].geometry.location;
            const { lat, lng } = location;

            // Use IATA Geo service to get the airport code
            const iataUrl = `http://iatageo.com/getCode/${lat}/${lng}`;
            const iataResponse = await fetch(iataUrl);
            const iataData = await iataResponse.json();
            console.log('IATA data:', iataData);

            if (iataData.code) {
                return NextResponse.json({ airportCode: iataData.code });
            } else {
                return NextResponse.json({ error: 'Airport code not found' }, { status: 404 });
            }
        } else {
            return NextResponse.json({ error: 'Airport not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error fetching airport code:', error);
        return NextResponse.json({ error: 'Error fetching airport code' }, { status: 500 });
    }
}
