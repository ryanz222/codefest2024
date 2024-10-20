#TripTonic
<img width="549" alt="Screenshot 2024-10-20 at 3 44 52 PM" src="https://github.com/user-attachments/assets/1700b2c6-3c4f-43ff-a01d-5e32833c2ab8">

**Project Overview**

This app lets a user share social media content (Instagram Reels, TikTok videos, etc.) to plan their travels by using AI to recommend hotels, flights, and activities based on the content shared. The app enables users to replicate the travel experiences of influencers by converting content into structured travel itineraries.

## Key Features
- **Supabase Database Integration**: 
  - Trips, Hotels, Flights, and Activities tables store user travel data.
  - Row-level security enforced using JWT from Clerk Authentication for personalized data access.
  
- **Clerk Authentication**: 
  - Provides user authentication and JWT-based security.

- **Google Gemini API**: 
  - Displays trip plans to users and calls Amadeus hotel search APIs to return relevant hotel offers.

- **Amadeus APIs**: 
  - Includes Amadeus hotel search, hotel offers, and flight search functionalities.
  
- **Google Places API**: 
  - Enriches travel data by fetching location-based recommendations.

- **Mapbox Integration**: 
  - Allows users to visualize their trips on a map, providing an interactive travel planning experience.

- **NextUI Components**: 
  - Provides a clean, responsive user interface for users to interact with the app.
  
- **Backend**: 
  - Node.js APIs handle business logic and API integrations between Supabase, Amadeus, and Google Gemini.

- **Hosting**: 
  - The app is hosted on **Vercel** using Next.js for fast and scalable web deployment.

## Project Architecture

- **Frontend**: 
  - Built with Next.js and styled using NextUI for a modern, responsive UI.
  
- **Backend**: 
  - Node.js server handling API calls, including integrations with Amadeus, Google Places, and Google Gemini APIs.

- **Database**: 
  - Supabase is used to store trip data, with table structures for trips, hotels, flights, and activities.

- **Map Integration**: 
  - A Mapbox map shows the user's trip and relevant locations like hotels and activities.

## How It Works

1. **User Inputs Social Media Content**: 
   - The user shares an Instagram Reel or TikTok related to a travel experience.
   
2. **AI-Powered Trip Planning**: 
   - The app processes the content and generates recommendations for hotels, flights, and activities based on the influencer's travel content.
   
3. **Trip Visualization**: 
   - The trip is visualized on a Mapbox-powered map, displaying key locations like hotels, activities, and landmarks.
   
4. **Travel Recommendations**: 
   - AI, via the Google Gemini API and Amadeus APIs, provides hotel and flight offers that align with the user’s trip preferences.

## Tech Stack
- **Frontend**: Next.js, NextUI
- **Backend**: Node.js
- **APIs**: Google Gemini API, OpenAI GPT4o, Amadeus API, Google Places API, Mapbox
- **Database**: Supabase
- **Authentication**: Clerk
- **Hosting**: Vercel
