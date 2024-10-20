import React, { useMemo, useState } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, ScrollShadow } from '@nextui-org/react';
import { useTheme } from 'next-themes';

import ActivityModal from './activityModal';
import FlightModal from './flightModal';
import HotelModal from './hotelModal';

import { Hotel, useTrip } from '@/hooks/useTrip';
import { HotelIcon, PlaneIcon, ActivityIcon, DarkModeHotelIcon, DarkModePlaneIcon, DarkModeActivityIcon } from '@/components/icons';

type EventType = 'Hotel' | 'Flight' | 'Activity';

// Add these new type definitions
type EventTypeColors = {
    [key in EventType]: { light: string; dark: string };
};

// Move eventTypeColors here
const eventTypeColors: EventTypeColors = {
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
    const { trip, isLoading, createHotel } = useTrip(trip_id);
    const [newEventDate, setNewEventDate] = useState<Date>(tripStartDate);
    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [hotelEntryID, setHotelEntryID] = useState<number | null>(null);

    const allDays = useMemo(() => {
        if (!trip) return [];

        return Array.from({ length: trip.length_in_days }, (_, i) => i);
    }, [trip]);

    // Function to handle adding an event to the trip
    const handleAddEvent = (eventType: 'Flight' | 'Hotel' | 'Activity', date: Date) => {
        setNewEventDate(date);
        if (eventType === 'Flight') {
            setIsFlightModalOpen(true);
        } else if (eventType === 'Hotel') {
            setIsHotelModalOpen(true);
        } else if (eventType === 'Activity') {
            setIsActivityModalOpen(true);
        }
    };

    function getEventsForDay(relativeDay: number) {
        if (!trip) return [];

        return [
            ...trip.hotels.filter(hotel => hotel.relative_check_in_day === relativeDay),
            ...trip.flights.filter(flight => flight.relative_departure_day === relativeDay),
            ...trip.activities.filter(activity => activity.relative_day === relativeDay),
        ];
    }

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
                            {dayEvents.map(event => {
                                let IconComponent = null;
                                let eventType: EventType;
                                let title = '';
                                let description = '';
                                let address = '';

                                if ('hotel_entry_id' in event) {
                                    eventType = 'Hotel';
                                    IconComponent = getIconComponent(eventType);
                                    title = event.ideal_hotel_name || 'Unknown Hotel';
                                    description = `Check-in: Day ${event.relative_check_in_day}, Check-out: Day ${event.relative_check_out_day}`;
                                    address = event.address || '';
                                } else if ('flight_entry_id' in event) {
                                    eventType = 'Flight';
                                    IconComponent = getIconComponent(eventType);
                                    title = `${event.departure_city_code} to ${event.destination_city_code}`;
                                    description = `Departure: Day ${event.relative_departure_day}, Class: ${event.travel_class}`;
                                } else if ('activity_entry_id' in event) {
                                    eventType = 'Activity';
                                    IconComponent = getIconComponent(eventType);
                                    title = event.name;
                                    description = event.description || '';
                                    address = event.address || '';
                                } else {
                                    return null; // Skip rendering if the event type is unknown
                                }

                                return (
                                    <div
                                        key={`${event.creator_id}-${event.trip_id}-${title}`}
                                        className={`${theme === 'dark' ? eventTypeColors[eventType].dark : eventTypeColors[eventType].light
                                            } shadow-sm rounded-md px-3 py-2 mb-2`}
                                    >
                                        <div className="flex items-center">
                                            {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                                            <h3 className="font-semibold">{title}</h3>
                                        </div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{description}</p>
                                        {address && <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{address}</p>}
                                        {'price_usd' in event && (
                                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Price: ${event.price_usd.toFixed(2)} USD
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
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
                                        <DropdownItem key="flight" onPress={() => handleAddEvent('Flight', currentDate)}>
                                            Flight
                                        </DropdownItem>
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

            {/* Flight Modal */}
            <FlightModal
                isOpen={isFlightModalOpen}
                newEventDate={newEventDate}
                tripStartDate={tripStartDate}
                trip_id={trip_id}
                onClose={() => setIsFlightModalOpen(false)}
            />

            {/* Hotel Modal */}
            {hotelEntryID && (
                <HotelModal
                    hotel_entry_id={hotelEntryID}
                    isOpen={isHotelModalOpen}
                    tripStartDate={tripStartDate}
                    trip_id={trip_id}
                    onClose={() => setIsHotelModalOpen(false)}
                />
            )}

            {/* Activity Modal */}
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

export default TripDays;
