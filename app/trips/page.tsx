// app/trips/page.tsx
'use client';
import { useState } from 'react';
import {
    Card,
    CardFooter,
    Image,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input,
    Chip,
} from '@nextui-org/react';
import Link from 'next/link';

import { TripDescription, useTrips } from '@/hooks/useTrips';

export default function Trips() {
    const [newTrip, setNewTrip] = useState<Omit<TripDescription, 'trip_id' | 'created_at' | 'creator_id'>>({
        trip_name: '',
        length_in_days: 1,
        is_published: false,
    });
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [searchTerm, setSearchTerm] = useState('');
    const [creatorFilter, setCreatorFilter] = useState('');
    const [minLength, setMinLength] = useState<number>(0);
    const [maxLength, setMaxLength] = useState<number>(1000);
    const { trips, isLoading, isError, error, addTrip } = useTrips({
        search_term: searchTerm,
        creator: creatorFilter,
        min_length: minLength,
        max_length: maxLength,
    });
    const [searchInput, setSearchInput] = useState('');

    const handleCreateTrip = () => {
        if (newTrip.trip_name.trim()) {
            addTrip(newTrip);
            setNewTrip({ trip_name: '', length_in_days: 1, is_published: false });
            onOpenChange();
        }
    };

    const handleSearch = (value: string) => {
        setSearchInput(value);
    };

    const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            setSearchTerm(searchInput);
        }
    };

    const toggleCreatorFilter = () => {
        setCreatorFilter(prev => (prev ? '' : 'CURRENT_USER'));
    };

    const setLengthFilter = (min: number, max: number) => {
        if (minLength === min && maxLength === max) {
            setMinLength(0);
            setMaxLength(1000);
        } else {
            setMinLength(min);
            setMaxLength(max);
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError && error) return <p>Error: {error.message}</p>;

    return (
        <div className="grid grid-cols-12 gap-4 p-4 h-full">
            <div className="col-span-12 flex flex-wrap gap-4 mb-4">
                <Input
                    className="w-full sm:w-64"
                    placeholder="Search trips..."
                    value={searchInput}
                    onKeyDown={handleSearchKeyPress}
                    onValueChange={handleSearch}
                />
                <Chip color="primary" variant={creatorFilter ? 'solid' : 'bordered'} onClick={toggleCreatorFilter}>
                    Created by me
                </Chip>
                <Chip color="primary" variant={minLength === 1 && maxLength === 3 ? 'solid' : 'bordered'} onClick={() => setLengthFilter(1, 3)}>
                    1-3 days
                </Chip>
                <Chip color="primary" variant={minLength === 4 && maxLength === 7 ? 'solid' : 'bordered'} onClick={() => setLengthFilter(4, 7)}>
                    4-7 days
                </Chip>
                <Chip color="primary" variant={minLength === 8 ? 'solid' : 'bordered'} onClick={() => setLengthFilter(8, 1000)}>
                    8+ days
                </Chip>
            </div>

            <Button className="col-span-12 sm:col-span-6 md:col-span-4 h-[300px] mb-4" onPress={onOpen}>
                Create New Trip
            </Button>

            {trips.length > 0 ? (
                trips.map(trip => (
                    <Card key={trip.trip_id} isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-6 md:col-span-4">
                        <Image
                            removeWrapper
                            alt={`${trip.trip_name} image`}
                            className="z-0 w-full h-full object-cover"
                            src={trip.photo_url || `https://fakeimg.pl/600x400?text=${trip.trip_name}`}
                        />
                        <CardFooter className="absolute bg-black/40 bottom-0 z-10 justify-between">
                            <div>
                                <p className="text-white text-tiny">{trip.trip_name}</p>
                                <p className="text-white text-tiny">
                                    {trip.length_in_days} day{trip.length_in_days !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <Link href={`/trips/${trip.trip_id}`}>
                                <Button className="text-tiny" color="primary" radius="full" size="sm">
                                    View Trip
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <p className="col-span-12">No trips found</p>
            )}

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {onClose => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Create New Trip</ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Trip Name"
                                    placeholder="Enter trip name"
                                    value={newTrip.trip_name}
                                    onChange={e => setNewTrip({ ...newTrip, trip_name: e.target.value })}
                                />
                                <Input
                                    label="Length in Days"
                                    placeholder="Enter trip length"
                                    type="number"
                                    value={newTrip.length_in_days.toString()}
                                    onChange={e => setNewTrip({ ...newTrip, length_in_days: parseInt(e.target.value) || 1 })}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={handleCreateTrip}>
                                    Create Trip
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
