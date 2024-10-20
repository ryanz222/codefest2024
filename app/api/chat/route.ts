import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        // Call Gemini 1.5 Flash
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
        Given the user message: "${message}", generate an itinerary with hotel search parameters for each day of the trip, or modification to the existing itinerary if the message specifies so.
        Return the result as a JSON array of objects, where each object represents a day's hotel search parameters and follows this structure.
        Any day specified in the message will override the existing hotel for that day/those days.
        DO NOT INCLUDE ANY OTHER TEXT IN YOUR RESPONSE:
    {
      "relative_days": number[], (desc:array of relative days to the trip start date I am at this hotel, so if I am at this hotel for 2 days starting on day 2, it would be [2, 3])
      "adults": number,
      "search_latitude": number,
      "search_longitude": number,
      "search_radius": number,
      "search_radius_unit": "KM" | "MI",
      "allowed_chain_codes": string[],
      "allowed_ratings": number[],
      "required_amenities": 'SWIMMING_POOL'
        | 'SPA'
        | 'FITNESS_CENTER'
        | 'AIR_CONDITIONING'
        | 'RESTAURANT'
        | 'PARKING'
        | 'PETS_ALLOWED'
        | 'AIRPORT_SHUTTLE'
        | 'BUSINESS_CENTER'
        | 'DISABLED_FACILITIES'
        | 'WIFI'
        | 'MEETING_ROOMS'
        | 'NO_KID_ALLOWED'
        | 'TENNIS'
        | 'GOLF'
        | 'KITCHEN'
        | 'BABY-SITTING'
        | 'BEACH'
        | 'CASINO'
        | 'JACUZZI'
        | 'SAUNA'
        | 'MASSAGE'
        | 'VALET_PARKING'
        | 'BAR'
        | 'LOUNGE'
        | 'MINIBAR'
        | 'TELEVISION'
        | 'WI-FI_IN_ROOM'
        | 'ROOM_SERVICE',
      "priority": "PRICE" | "DISTANCE" | "RATING" | "CLOSESTNAME"
    }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Response:', text);

        // Parse the JSON response
        //Trim everything before the first [ and after the last ]
        const trimmedText = text.trim().substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        let hotelSearchParams = JSON.parse(trimmedText);

        return NextResponse.json({ hotelSearchParams: hotelSearchParams });
    } catch (error) {
        console.error('Error processing request:', error);

        return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
    }
}
