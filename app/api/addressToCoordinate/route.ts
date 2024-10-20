import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return NextResponse.json({ latitude: lat, longitude: lng });
        } else {
            return NextResponse.json({ error: 'Geocoding failed' }, { status: 400 });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}