import { NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeName = searchParams.get('placeName');
    const maxWidth = searchParams.get('maxWidth') || '400';
    const maxHeight = searchParams.get('maxHeight') || '400';

    if (!placeName) {
        return NextResponse.json({ error: 'Place name is required' }, { status: 400 });
    }

    try {
        // Step 1: Get Place ID
        const placeIdResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
                placeName
            )}&inputtype=textquery&fields=place_id&key=${API_KEY}`
        );
        const placeIdData = await placeIdResponse.json();

        if (!placeIdData.candidates || placeIdData.candidates.length === 0) {
            return NextResponse.json({ error: 'Place not found' }, { status: 404 });
        }

        const placeId = placeIdData.candidates[0].place_id;

        console.log('placeId', placeId);
        // Step 2: Get Place Details using Place ID
        const detailsResponse = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,photos&key=${API_KEY}`
        );
        const detailsData = await detailsResponse.json();

        console.log('detailsData', detailsData);

        if (!detailsData.photos || detailsData.photos.length === 0) {
            return NextResponse.json({ error: 'No photos available for this place' });
        }

        // Step 3: Get photo details using the Place Photo API
        const photos = await Promise.all(detailsData.photos.slice(0, 10).map(async (photo: any) => {
            const photoResponse = await fetch(
                `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=${maxHeight}&maxWidthPx=${maxWidth}&key=${API_KEY}&skipHttpRedirect=true`
            );
            const photoData = await photoResponse.json();
            return {
                photoUrl: photoData.photoUri,
                htmlAttributions: photo.authorAttributions.map((attr: any) => attr.displayName).join(', ')
            };
        }));

        console.log('photos', photos);

        return NextResponse.json({ photos });
    } catch (error) {
        console.error('Error fetching place data:', error);
        return NextResponse.json({ error: 'Error fetching place data' }, { status: 500 });
    }
}
