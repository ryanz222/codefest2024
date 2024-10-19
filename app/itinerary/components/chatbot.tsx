// app/itinerary/components/chatbot.tsx
'use client';
import React, { useState } from 'react';
import { Card, Textarea, Button } from '@nextui-org/react';
import { useTheme } from 'next-themes';

export default function TripChatbot() {
    const { theme } = useTheme();
    const [userInput, setUserInput] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput }),
            });
            const data = await response.json();

            setAiResponse(data.response);
        } catch (error) {
            console.error('Error:', error);
            setAiResponse('Sorry, there was an error processing your request.');
        }
        setIsLoading(false);
    };

    return (
        <Card className={`h-56 p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <div className="flex flex-col">
                <Textarea
                    className="mb-2"
                    placeholder="Ask for itinerary modifications..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                />
                <Button color="primary" isLoading={isLoading} onClick={handleSubmit}>
                    Get AI Modifications
                </Button>
                {aiResponse && (
                    <div className={`mt-2 p-2 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}>
                        <p>{aiResponse}</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
