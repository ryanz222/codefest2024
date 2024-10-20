// app/trips/[trip_id]/aboutTrip.tsx
'use client';

import { Card, CardHeader, CardBody, Skeleton, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';

import { useTrip } from '@/hooks/useTrip';
import { MoreIcon } from '@/components/icons';

interface AboutTripProps {
    trip_id: string;
    handleOpenEditTripModal: () => void;
}

export default function AboutTrip({ trip_id, handleOpenEditTripModal }: AboutTripProps) {
    const router = useRouter();
    const { trip, isLoading, isError, error, deleteTrip } = useTrip(trip_id);

    const handleDeleteTrip = async () => {
        try {
            await deleteTrip();
            router.push('/trips');
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    if (isLoading || !trip) {
        return (
            <Card className="w-full h-20">
                <CardHeader className="flex justify-between items-center">
                    <Skeleton className="w-3/5 rounded-lg">
                        <div className="h-8 rounded-lg bg-default-200" />
                    </Skeleton>
                    <Skeleton className="w-8 h-8 rounded-full" />
                </CardHeader>
                <CardBody>
                    <Skeleton className="w-4/5 rounded-lg mb-2">
                        <div className="h-4 rounded-lg bg-default-200" />
                    </Skeleton>
                    <Skeleton className="w-2/5 rounded-lg">
                        <div className="h-4 rounded-lg bg-default-200" />
                    </Skeleton>
                </CardBody>
            </Card>
        );
    }

    if (isError) {
        return <div>Error: {error?.message}</div>;
    }

    return (
        <Card className="w-full h-20">
            <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{trip?.trip_name}</h2>
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly variant="light">
                            <MoreIcon height={24} width={24} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Trip actions">
                        <DropdownItem key="delete" className="text-danger" color="danger" onClick={handleDeleteTrip}>
                            Delete Trip
                        </DropdownItem>
                        <DropdownItem key="edit" onClick={handleOpenEditTripModal}>
                            Edit Trip
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </CardHeader>
            <CardBody>
                <p>Duration: {trip?.length_in_days} days</p>
                {trip?.description && <p className="mt-2">{trip.description}</p>}
            </CardBody>
        </Card>
    );
}
