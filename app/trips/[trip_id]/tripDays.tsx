import React, { useMemo } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, ScrollShadow } from '@nextui-org/react';
import { useTheme } from 'next-themes';

import { HotelIcon, PlaneIcon, ActivityIcon, DarkModeHotelIcon, DarkModePlaneIcon, DarkModeActivityIcon } from '@/components/icons';
import { TripData } from '@/hooks/useTrip';

type EventType = 'Hotel' | 'Flight' | 'Activity';

// Add these new type definitions
type EventTypeColors = {
    [key in EventType]: { light: string; dark: string };
};

type Holiday = {
    date: string;
    name: string;
    color: { light: string; dark: string };
};

// Move eventTypeColors and holidays here
const eventTypeColors: EventTypeColors = {
    Hotel: { light: 'bg-red-200', dark: 'bg-red-800' },
    Flight: { light: 'bg-green-200', dark: 'bg-green-800' },
    Activity: { light: 'bg-blue-200', dark: 'bg-blue-800' },
};

const holidays: Holiday[] = [
    {
        date: '2024-01-01',
        name: "New Year's Day",
        color: { light: 'bg-red-200', dark: 'bg-red-800' },
    },
    {
        date: '2024-07-04',
        name: 'Independence Day',
        color: { light: 'bg-blue-200', dark: 'bg-blue-800' },
    },
    {
        date: '2024-10-31',
        name: 'Halloween',
        color: { light: 'bg-purple-200', dark: 'bg-purple-800' },
    },
    {
        date: '2024-12-25',
        name: 'Christmas Day',
        color: { light: 'bg-green-200', dark: 'bg-green-800' },
    },
];

// Add this function
const getHolidayInfo = (date: Date) => holidays.find(h => h.date === date.toISOString().split('T')[0]);

interface TripDaysProps {
    trip: TripData;
    tripStartDate: Date;
    onAddEvent: (eventType: EventType, date: Date) => void;
}

const TripDays: React.FC<TripDaysProps> = ({ trip, tripStartDate, onAddEvent }) => {
    const { theme } = useTheme();

    const allDays = useMemo(() => {
        const startDate = new Date(tripStartDate);

        return Array.from({ length: trip.length_in_days }, (_, i) => {
            const date = new Date(startDate);

            date.setDate(date.getDate() + i);

            return date;
        });
    }, [tripStartDate, trip.length_in_days]);

    function getEventsForDay(date: Date) {
        const relativeDay = Math.floor((date.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

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
                {allDays.map((date, index) => {
                    const { weekday, monthDay, year } = {
                        weekday: date.toLocaleString('default', { weekday: 'short' }),
                        monthDay: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
                        year: date.getFullYear(),
                    };
                    const holidayInfo = getHolidayInfo(date);
                    const dayEvents = getEventsForDay(date);

                    return (
                        <div key={date.toISOString()} className="p-2 relative min-h-[90px]">
                            <div>
                                {/* Day Header */}
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                        <span className="font-semibold">{weekday}</span>
                                        <span className="ml-1">{monthDay}</span>
                                        {holidayInfo && (
                                            <span
                                                className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? holidayInfo.color.dark : holidayInfo.color.light
                                                    }`}
                                            >
                                                {holidayInfo.name}
                                            </span>
                                        )}
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
                                            {address && (
                                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{address}</p>
                                            )}
                                            {'price_usd' in event && (
                                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Price: ${event.price_usd.toFixed(2)} USD
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                                {/* No Events */}
                                {dayEvents.length === 0 && (
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No events</p>
                                )}

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
                                            <DropdownItem key="flight" onPress={() => onAddEvent('Flight', date)}>
                                                Flight
                                            </DropdownItem>
                                            <DropdownItem key="hotel" onPress={() => onAddEvent('Hotel', date)}>
                                                Hotel
                                            </DropdownItem>
                                            <DropdownItem key="activity" onPress={() => onAddEvent('Activity', date)}>
                                                Activity
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </ScrollShadow>
        </div>
    );
};

export default TripDays;
