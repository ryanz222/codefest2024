// app/trips/[trip_id]/aboutTrip.tsx
'use client';

import {
    Card,
    CardHeader,
    CardBody,
    Skeleton,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    Calendar,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';

import { useTrip } from '@/hooks/useTrip';
import { MoreIcon } from '@/components/icons';

interface AboutTripProps {
    trip_id: string;
    handleOpenEditTripModal: () => void;
    tripStartDate: Date;
    setTripStartDate: (date: Date) => void;
}

export default function AboutTrip({ trip_id, handleOpenEditTripModal, tripStartDate, setTripStartDate }: AboutTripProps) {
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
            <Card className="w-full h-28">
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
        <Card className="w-full h-24">
            <CardHeader className="flex h-full justify-between items-center p-4">
                <h2 className="text-xl font-bold justify-center">{trip?.trip_name}</h2>

                <Popover backdrop="opaque" placement="bottom">
                    <PopoverTrigger>
                        <Button className="" variant="light">
                            Starts on {tripStartDate.toLocaleDateString()}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-transparent shadow-none border-none">
                        <Calendar
                            aria-label="Trip start date"
                            minValue={today(getLocalTimeZone())}
                            value={parseDate(tripStartDate.toISOString().split('T')[0])}
                            onChange={date => {
                                const isoDate = date.toString();
                                const selectedDate = new Date(isoDate);
                                const adjustedDate = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);

                                setTripStartDate(adjustedDate);
                            }}
                        />
                    </PopoverContent>
                </Popover>

                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly variant="light">
                            <MoreIcon height={24} width={24} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Trip actions">
                        <DropdownItem key="edit" onClick={handleOpenEditTripModal}>
                            Edit Trip
                        </DropdownItem>
                        <DropdownItem key="delete" className="text-danger" color="danger" onClick={handleDeleteTrip}>
                            Delete Trip
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </CardHeader>
        </Card>
    );
}
