import React, { useState, useEffect } from 'react';
import { Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";

interface Location {
    address: string;
    coordinates: [number, number];
}

interface LocationPickerProps {
    value: string;
    onChange: (location: Location) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
    const [suggestions, setSuggestions] = useState<Location[]>([]);
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (inputValue.length > 2) {
                const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(inputValue)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address`);
                const data = await response.json();
                setSuggestions(data.features.map((feature: any) => ({
                    address: feature.place_name,
                    coordinates: feature.center,
                })));
            } else {
                setSuggestions([]);
            }
        };

        fetchSuggestions();
    }, [inputValue]);

    const handleSelect = (location: Location) => {
        setInputValue(location.address);
        onChange(location);
        setSuggestions([]);
    };

    return (
        <Dropdown>
            <DropdownTrigger>
                <Input
                    label="Location"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Start typing an address..."
                />
            </DropdownTrigger>
            <DropdownMenu>
                {suggestions.map((suggestion, index) => (
                    <DropdownItem key={index} onClick={() => handleSelect(suggestion)}>
                        {suggestion.address}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
}