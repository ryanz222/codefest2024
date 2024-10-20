'use client';

import { useState } from 'react';

const TestPhotoPage = () => {
    const [photo, setPhoto] = useState<string | null>(null);
    const [placeName, setPlaceName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const searchPlace = async () => {
        setLoading(true);
        setError(null);
        setPhoto(null);

        try {
            const response = await fetch(`/api/getPhotoFromAddress?placeName=${encodeURIComponent(placeName)}`);
            const data = await response.json();

            if (response.ok) {
                if (data.photos && data.photos.length > 0) {
                    setPhoto(data.photos[0].photoUrl);
                } else {
                    setError('No photos available for this place.');
                }
            } else {
                setError(data.error || 'An error occurred while fetching the photo.');
            }
        } catch (error) {
            console.error('Error fetching place data:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Test Google Maps Photo</h1>
            <div className="mb-4">
                <input
                    className="border p-2 mr-2"
                    disabled={loading}
                    placeholder="Enter place name"
                    type="text"
                    value={placeName}
                    onChange={e => setPlaceName(e.target.value)}
                />
                <button
                    className={`text-white px-4 py-2 rounded ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    disabled={loading}
                    onClick={searchPlace}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {photo && (
                <div>
                    <img alt={placeName} className="max-w-full h-auto" src={photo} />
                </div>
            )}
            {!photo && !error && !loading && <div className="text-gray-500">Enter a place name and click &apos;Search&apos; to find a photo.</div>}
        </div>
    );
};

export default TestPhotoPage;
