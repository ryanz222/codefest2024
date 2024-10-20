'use client';

import { useState } from 'react';

export default function TestChat() {
    const [message, setMessage] = useState('');
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });
            const data = await response.json();

            setResult(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setResult({ error: 'An error occurred while fetching data' });
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Test Chat API</h1>
            <form className="mb-4" onSubmit={handleSubmit}>
                <input
                    className="border p-2 mr-2"
                    placeholder="Enter your message"
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
                <button className="bg-blue-500 text-white p-2 rounded" disabled={isLoading} type="submit">
                    {isLoading ? 'Loading...' : 'Send'}
                </button>
            </form>
            {result && (
                <div>
                    <h2 className="text-xl font-semibold mb-2">Result:</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
