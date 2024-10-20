// app/trips/page.tsx
'use client';
import { useState } from 'react';
import { Card, CardFooter, Image, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from '@nextui-org/react';
import Link from 'next/link';

import { Trip, useTrips } from '@/hooks/useTrips';

export default function Trips() {
    const [newTrip, setNewTrip] = useState<Omit<Trip, 'trip_id' | 'created_at' | 'creator_id'>>({
        trip_name: '',
        length_in_days: 1,
        is_published: false,
    });
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { trips, isLoading, isError, error, addTrip } = useTrips();

    const handleCreateTrip = () => {
        if (newTrip.trip_name.trim()) {
            addTrip(newTrip);
            setNewTrip({ trip_name: '', length_in_days: 1, is_published: false });
            onOpenChange();
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (isError && error) return <p>Error: {error.message}</p>;

    return (
        <div className="grid grid-cols-12 gap-4 p-4 h-full">
            <Button className="col-span-12 mb-4" onPress={onOpen}>
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
