// app/trips/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const [newTrip, setNewTrip] = useState<Omit<TripDescription, 'trip_id' | 'created_at' | 'creator_id'>>({
        trip_name: '',
        length_in_days: 1,
        is_published: false,
        adults: 1,
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

    useEffect(() => {
        const defaultSearch = searchParams.get('search') || '';

        setSearchInput(defaultSearch);
        setSearchTerm(defaultSearch);
    }, [searchParams]);

    const handleCreateTrip = () => {
        if (newTrip.trip_name.trim()) {
            addTrip(newTrip);
            setNewTrip({ trip_name: '', length_in_days: 1, is_published: false, adults: 1 });
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
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-blue-50/50 dark:bg-blue-50/5">
            <div className="grid grid-cols-12 gap-4 p-4">
                <Card className="col-span-12 mb-4 rounded-lg bg-white dark:bg-blue-50/20">
                    <div className="grid grid-cols-12 gap-4 p-4">
                        <div className="col-span-12 flex flex-wrap gap-4 h-full">
                            <Input
                                className="w-full md:w-96"
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
                    </div>
                </Card>

                {trips.length > 0 ? (
                    trips.map(trip => (
                        <Card
                            key={trip.trip_id}
                            className="w-full h-[300px] col-span-12 sm:col-span-6 md:col-span-4 bg-white/90 dark:bg-slate-800/90"
                        >
                            <Image
                                removeWrapper
                                alt={`${trip.trip_name} image`}
                                className="z-0 w-full h-full object-cover"
                                src={trip.photo_url || `https://fakeimg.pl/600x400?text=${trip.trip_name}`}
                            />
                            <CardFooter className="absolute bottom-0 z-10 justify-between bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                                <div>
                                    <p className="text-blue-800 dark:text-blue-200 font-semibold">{trip.trip_name}</p>
                                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                                        {trip.length_in_days} day{trip.length_in_days !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <Link href={`/trips/${trip.trip_id}`}>
                                    <Button className="text-tiny bg-blue-500 text-white" radius="full" size="sm">
                                        View Trip
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-12 text-center">
                        <p className="text-xl text-gray-600 dark:text-gray-400">No trips found. Try adjusting your search or filters.</p>
                    </div>
                )}

            </div>

            <div className={`${trips.length > 0 ? 'py-12 mt-8' : ''}`}>
                <Card className="container mx-auto px-8 py-6 bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-md">
                    <div className="text-left">
                        <h2 className="text-3xl font-bold mb-4">Couldn&apos;t find your dream trip?</h2>
                        <p className="text-xl mb-6">Leverage our AI tools to create your own adventure and start planning today!</p>
                        <Button className="font-semibold" color="primary" size="lg" variant="shadow" onPress={onOpen}>
                            Create Your Own Trip
                        </Button>
                    </div>
                </Card>
            </div>

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
                                    label="Number of Adults"
                                    placeholder="Enter number of adults"
                                    type="number"
                                    value={newTrip.adults?.toString() || '2'}
                                    onChange={e => setNewTrip({ ...newTrip, adults: parseInt(e.target.value) || 2 })}
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
