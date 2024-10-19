"use client";

import React, { useState } from 'react';
import { Card, Button } from "@nextui-org/react";

export default function ItineraryPage() {
    const [items, setItems] = useState<number[]>([]);

    const addItem = () => {
        setItems([...items, items.length]);
    };

    return (
        <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-center mb-4">Plan Your Itinerary</h1>

            {items.map((item) => (
                <Card key={item} className="p-4">
                    <p>Itinerary Item {item + 1}</p>
                    {/* You can add more content for each item here later */}
                </Card>
            ))}

            <Button
                onPress={addItem}
                className="h-40 text-4xl"
                size="lg"
                variant="bordered"
            >
                +
            </Button>
        </div>
    );
};

