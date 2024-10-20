// app/trips/[trip_id]/dayItem.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { useTheme } from 'next-themes';

import { HotelIcon, PlaneIcon, ActivityIcon, DarkModeHotelIcon, DarkModePlaneIcon, DarkModeActivityIcon } from '@/components/icons';
import { Activity, TripData } from '@/hooks/useTrip';

type EventType = 'Hotel' | 'Flight' | 'Activity';

interface DayItemProps {
    date: Date;
    index: number;
    style: React.CSSProperties;
    trip: TripData | null;
    startDate: Date;
    eventTypeColors: {
        [key in EventType]: { light: string; dark: string };
    };
    getHolidayInfo: (date: Date) =>
        | {
            date: string;
            name: string;
            color: { light: string; dark: string };
        }
        | undefined;
    setRowHeight: (index: number, size: number) => void;
    onAddEvent: (eventType: EventType, date: Date) => void;
}

const DayItem: React.FC<DayItemProps> = ({ date, index, style, trip, startDate, eventTypeColors, getHolidayInfo, setRowHeight, onAddEvent }) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            const height = containerRef.current.getBoundingClientRect().height;

            setRowHeight(index, height);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef.current]);

    const { weekday, monthDay, year } = {
        weekday: date.toLocaleString('default', { weekday: 'short' }),
        monthDay: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
        year: date.getFullYear(),
    };
    const holidayInfo = getHolidayInfo(date);
    const dayEvents = getEventsForDay(date);

    function getEventsForDay(date: Date) {
        if (!trip) return [];
        const relativeDay = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

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

    return (
        <div style={{ ...style, height: 'auto' }}>
            <div ref={containerRef} className="p-2 relative min-h-[90px]">
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

                    if ('hotel_id' in event) {
                        eventType = 'Hotel';
                        IconComponent = getIconComponent(eventType);
                        title = event.ideal_hotel_name || 'Unknown Hotel';
                        description = `Check-in: Day ${event.relative_check_in_day}, Check-out: Day ${event.relative_check_out_day}`;
                        address = event.address || '';
                    } else if ('destination_city_code' in event) {
                        eventType = 'Flight';
                        IconComponent = getIconComponent(eventType);
                        title = `${event.departure_city_code} to ${event.destination_city_code}`;
                        description = `Departure: Day ${event.relative_departure_day}`;
                    } else {
                        eventType = 'Activity';
                        IconComponent = getIconComponent(eventType);
                        title = (event as Activity).name;
                        description = (event as Activity).description;
                        address = (event as Activity).address || '';
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
                                className={`${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-black hover:bg-gray-100'
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
};

export default DayItem;
