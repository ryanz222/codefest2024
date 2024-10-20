import React, { useMemo, useState } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, ScrollShadow } from '@nextui-org/react';
import { useTheme } from 'next-themes';

import ActivityModal from './activityModal';
import FlightModal from './flightModal';
import HotelModal from './hotelModal';

import { Hotel, Flight, Activity, useTrip } from '@/hooks/useTrip';
import { HotelIcon, PlaneIcon, ActivityIcon, DarkModeHotelIcon, DarkModePlaneIcon, DarkModeActivityIcon } from '@/components/icons';

type EventType = 'Hotel' | 'Flight' | 'Activity';

// Define color schemes for different event types
const eventTypeColors: Record<EventType, { light: string; dark: string }> = {
    Hotel: { light: 'bg-red-200', dark: 'bg-red-800' },
    Flight: { light: 'bg-green-200', dark: 'bg-green-800' },
    Activity: { light: 'bg-blue-200', dark: 'bg-blue-800' },
};

interface TripDaysProps {
    trip_id: string;
    tripStartDate: Date;
}

const TripDays: React.FC<TripDaysProps> = ({ tripStartDate, trip_id }) => {
    const { theme } = useTheme();
    const { trip, isLoading, createHotel, createFlight } = useTrip(trip_id);
    const [newEventDate, setNewEventDate] = useState<Date>(tripStartDate);
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [hotelEntryID, setHotelEntryID] = useState<number | null>(null);
    const [flightEntryID, setFlightEntryID] = useState<number | null>(null);
    const [hotelOffers, setHotelOffers] = useState<Record<string, any>>({});

    // Calculate all days of the trip
    const allDays = useMemo(() => {
        if (!trip) return [];

        return Array.from({ length: trip.length_in_days }, (_, i) => i);
    }, [trip]);

    // Function to get the appropriate icon component based on event type and theme
    function getIconComponent(eventType: EventType) {
        switch (eventType) {
            case 'Hotel':
                return theme === 'dark' ? DarkModeHotelIcon : HotelIcon;
            case 'Flight':
                return theme === 'dark' ? DarkModePlaneIcon : PlaneIcon;
            case 'Activity':
                return theme === 'dark' ? DarkModeActivityIcon : ActivityIcon;
            default:
                return null;
        }
    }

    // Function to get all events for a specific day
    function getEventsForDay(relativeDay: number) {
        if (!trip) return [];

        return [
            ...trip.hotels.filter(hotel => hotel.relative_check_in_day === relativeDay),
            ...trip.flights.filter(flight => flight.relative_departure_day === relativeDay),
            ...trip.activities.filter(activity => activity.relative_day === relativeDay),
        ];
    }

    // Function to fetch hotel offers
    const fetchHotelOffers = async (hotelId: string, checkInDate: string, checkOutDate: string) => {
        try {
            console.log('Fetching hotel offers for hotelId:', hotelId);
            const response = await fetch(
                `/api/hotel-api/getOfferFromHotelId?hotelIds=${hotelId}&adults=1&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`
            );

            if (!response.ok) throw new Error('Failed to fetch hotel offer');
            const data = await response.json();

            setHotelOffers(prev => ({ ...prev, [hotelId]: data[0] }));
        } catch (error) {
            console.error('Error fetching hotel offer:', error);
        }
    };

    // Function to render a single event
    const renderEvent = (event: Hotel | Flight | Activity, relativeDay: number) => {
        let eventType: EventType;
        let title: string;
        let description: string;
        let address: string | undefined;
        let price: number | undefined;
        let onClick: () => void;
        let uniqueId: string;

        if ('hotel_entry_id' in event) {
            eventType = 'Hotel';
            title = event.ideal_hotel_name || 'Unknown Hotel';
            description = `Check-in: Day ${event.relative_check_in_day}, Check-out: Day ${event.relative_check_out_day}`;
            address = event.address;

            // // Fetch hotel offer if not already fetched
            // const hotelId = event.amadeus_hotel_id;

            // if (hotelId && !hotelOffers[hotelId]) {
            //     const checkInDate = new Date(tripStartDate);

            //     checkInDate.setDate(checkInDate.getDate() + event.relative_check_in_day);
            //     const checkOutDate = new Date(tripStartDate);

            //     checkOutDate.setDate(checkOutDate.getDate() + event.relative_check_out_day);

            //     fetchHotelOffers(hotelId, checkInDate.toISOString().split('T')[0], checkOutDate.toISOString().split('T')[0]);
            // }

            // // Use fetched price if available
            // price = hotelOffers[hotelId]?.offers[0]?.price?.total || undefined;

            onClick = () => {
                setHotelEntryID(event.hotel_entry_id || null);
                setIsHotelModalOpen(true);
            };
            uniqueId = `hotel-${event.hotel_entry_id}-day${relativeDay}`;
        } else if ('flight_entry_id' in event) {
            eventType = 'Flight';
            title = `${event.departure_city_code} to ${event.destination_city_code}`;
            description = `Departure: Day ${event.relative_departure_day}, Class: ${event.travel_class}`;
            onClick = () => {
                setFlightEntryID(event.flight_entry_id || null);
                setIsFlightModalOpen(true);
            };
            uniqueId = `flight-${event.flight_entry_id}-day${relativeDay}`;
        } else {
            eventType = 'Activity';
            title = (event as Activity).name;
            description = (event as Activity).description || '';
            address = (event as Activity).address;
            price = (event as Activity).price_usd;
            onClick = () => setIsActivityModalOpen(true);
            uniqueId = `activity-${(event as Activity).activity_entry_id}-day${relativeDay}`;
        }

        const IconComponent = getIconComponent(eventType);

        return (
            <EventCard
                key={uniqueId}
                IconComponent={IconComponent || null}
                address={address}
                description={description}
                eventType={eventType}
                price={price}
                title={title}
                onClick={onClick}
            />
        );
    };

    // Function to handle adding a new event
    const handleAddEvent = (eventType: EventType, date: Date) => {
        setNewEventDate(date);
        if (eventType === 'Flight') {
            setIsFlightModalOpen(true);
        } else if (eventType === 'Hotel') {
            setIsHotelModalOpen(true);
        } else if (eventType === 'Activity') {
            setIsActivityModalOpen(true);
        }
    };

    const bgStyle = theme === 'dark' ? 'bg-gray-800/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md';

    return (
        <div className={`h-full w-full p-4 overflow-hidden rounded-xl shadow-lg flex flex-col ${bgStyle}`}>
            <ScrollShadow hideScrollBar className="h-full">
                {allDays.map(relativeDay => {
                    const currentDate = new Date(tripStartDate);

                    currentDate.setDate(currentDate.getDate() + relativeDay);

                    const { weekday, monthDay, year } = {
                        weekday: currentDate.toLocaleString('default', { weekday: 'short' }),
                        monthDay: `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}`,
                        year: currentDate.getFullYear(),
                    };

                    const dayEvents = getEventsForDay(relativeDay);

                    return (
                        <div key={relativeDay} className="p-2 relative min-h-[90px]">
                            {/* Day Header */}
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                    <span className="font-semibold">{weekday}</span>
                                    <span className="ml-1">{monthDay}</span>
                                </div>
                            </div>

                            {/* Events */}
                            {dayEvents.map(event => renderEvent(event, relativeDay))}

                            {/* No Events */}
                            {dayEvents.length === 0 && <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No events</p>}

                            {/* Day Footer with Dropdown */}
                            <div className="absolute top-2 right-2 flex items-center">
                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mr-2`}>{year}</span>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            isIconOnly
                                            aria-label="Add event"
                                            className={`${theme === 'dark'
                                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                                : 'bg-white text-black hover:bg-gray-100'
                                                } shadow-sm transition-colors duration-200`}
                                            size="sm"
                                        >
                                            +
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Add event options">
                                        <DropdownItem
                                            key="hotel"
                                            onPress={async () => {
                                                const newHotel: Omit<Hotel, 'hotel_entry_id' | 'creator_id'> = {
                                                    trip_id: trip_id,
                                                    relative_check_in_day: relativeDay,
                                                    relative_check_out_day: relativeDay + 1,
                                                };
                                                const newHotelEntryID = await createHotel(newHotel);

                                                setHotelEntryID(newHotelEntryID);
                                                setIsHotelModalOpen(true);
                                            }}
                                        >
                                            Hotel
                                        </DropdownItem>
                                        <DropdownItem
                                            key="flight"
                                            onPress={async () => {
                                                const newFlight: Omit<Flight, 'flight_entry_id' | 'creator_id'> = {
                                                    trip_id: trip_id,
                                                    relative_departure_day: relativeDay,
                                                    destination_city_code: '',
                                                    departure_city_code: '',
                                                    relative_return_day: 0,
                                                    travel_class: 'ECONOMY',
                                                    non_stop: false,
                                                    currency: 'USD',
                                                    max_price: 0,
                                                    included_airline_codes: [],
                                                    excluded_airline_codes: [],
                                                };
                                                const newFlightEntryID = await createFlight(newFlight);

                                                setFlightEntryID(newFlightEntryID);
                                                setIsFlightModalOpen(true);
                                            }}
                                        >
                                            Flight
                                        </DropdownItem>
                                        <DropdownItem key="activity" onPress={() => handleAddEvent('Activity', currentDate)}>
                                            Activity
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </div>
                    );
                })}
            </ScrollShadow>

            {/* Modals */}
            {flightEntryID && (
                <FlightModal
                    flight_entry_id={flightEntryID}
                    isOpen={isFlightModalOpen}
                    tripStartDate={tripStartDate}
                    trip_id={trip_id}
                    onClose={() => setIsFlightModalOpen(false)}
                />
            )}
            {hotelEntryID && (
                <HotelModal
                    hotel_entry_id={hotelEntryID}
                    isOpen={isHotelModalOpen}
                    tripStartDate={tripStartDate}
                    trip_id={trip_id}
                    onClose={() => setIsHotelModalOpen(false)}
                />
            )}
            <ActivityModal
                isOpen={isActivityModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsActivityModalOpen(false)}
            />
        </div>
    );
};

// EventCard component
interface EventCardProps {
    eventType: EventType;
    title: string;
    description: string;
    address?: string;
    price?: number;
    IconComponent: React.ComponentType<{ className: string }> | null;
    onClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ eventType, title, description, address, price, IconComponent, onClick }) => {
    const { theme } = useTheme();
    const bgColor = theme === 'dark' ? eventTypeColors[eventType].dark : eventTypeColors[eventType].light;

    return (
        <div
            className={`${bgColor} shadow-sm rounded-md px-3 py-2 mb-2 cursor-pointer`}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onClick();
            }}
        >
            <div className="flex items-center">
                {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                <h3 className="font-semibold">{title}</h3>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>
            {address && <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{address}</p>}
            {price !== undefined && (
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Price: ${price.toFixed(2)} USD</p>
            )}
        </div>
    );
};

export default TripDays;
