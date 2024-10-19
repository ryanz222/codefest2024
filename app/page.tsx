/* eslint-disable prettier/prettier */
"use client";

import { useState } from "react";

export default function Home() {
  const [cityCode, setCityCode] = useState("PAR");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  const cityOptions = [
    { code: "PAR", name: "Paris" },
    { code: "LON", name: "London" },
    { code: "NYC", name: "New York" },
  ];

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/amadeus?cityCode=${cityCode}`);
      const data = await response.json();

      setHotels(data);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Hotel Finder</h1>
      <div className="mb-4">
        <select
          className="mr-2 p-2 border rounded"
          value={cityCode}
          onChange={(e) => setCityCode(e.target.value)}
        >
          {cityOptions.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
        <button
          className="p-2 bg-blue-500 text-white rounded"
          disabled={loading}
          onClick={fetchHotels}
        >
          {loading ? "Loading..." : "Find Hotels"}
        </button>
      </div>
      {hotels.length > 0 && (
        <ul className="list-disc pl-5">
          {hotels.map((hotel: any) => (
            <li key={hotel.hotelId}>{hotel.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
