// app/itinerary/components/timeline.tsx
'use client';
import React, { useState, useEffect, useRef, useMemo, Dispatch, SetStateAction } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, ScrollShadow } from '@nextui-org/react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme } from 'next-themes';

import { Event } from '../page';

import styles from '@/styles/itinerary-page.module.css';
import {
    UpArrow,
    DownArrow,
    PlaneIcon,
    HotelIcon,
    ActivityIcon,
    DarkModePlaneIcon,
    DarkModeHotelIcon,
    DarkModeActivityIcon,
} from '@/components/icons';

interface TripTimelineProps {
    events: Event[];
    setEvents: Dispatch<SetStateAction<Event[]>>;
}

export default function TripTimeline({ events, setEvents }: TripTimelineProps) {
    const [centerDate, setCenterDate] = useState<Date>(new Date());
    const [showReturnToPresent, setShowReturnToPresent] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventType, setNewEventType] = useState<Event['type']>('Activity');
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventLocation, setNewEventLocation] = useState('');
    const { theme } = useTheme();

    const listRef = useRef<List>(null);
    const rowHeights = useRef<{ [key: number]: number }>({});

    const DAY_HEIGHT = 90; // Adjust based on design
    const DAYS_TO_LOAD = 3650; // 10 years worth of days

    const eventTypeColors = {
        Hotel: { light: 'bg-red-200', dark: 'bg-red-800' },
        Flight: { light: 'bg-green-200', dark: 'bg-green-800' },
        Activity: { light: 'bg-blue-200', dark: 'bg-blue-800' },
    };

    const holidays = [
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

    const allDays = useMemo(() => {
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const startDate = new Date(today);

        startDate.setDate(startDate.getDate() - Math.floor(DAYS_TO_LOAD / 2));

        return Array.from({ length: DAYS_TO_LOAD }, (_, i) => {
            const date = new Date(startDate);

            date.setDate(date.getDate() + i);

            return date;
        });
    }, []);

    useEffect(() => {
        // Scroll to today's date on initial render
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const todayIndex = allDays.findIndex(date => date.toDateString() === today.toDateString());

        listRef.current?.scrollToItem(todayIndex, 'center');

        // Pre-calculate all row heights
        allDays.forEach((date, index) => {
            const dayEvents = getEventsForDay(date);
            const holidayInfo = getHolidayInfo(date);
            const baseHeight = 90; // Minimum height
            const eventHeight = dayEvents.length * 70; // Adjust based on your event component height
            const holidayHeight = holidayInfo ? 30 : 0;
            const totalHeight = baseHeight + eventHeight + holidayHeight;

            setRowHeight(index, totalHeight);
        });

        // Force a re-render of the list to apply the new heights
        listRef.current?.resetAfterIndex(0);
    }, [allDays]);

    useEffect(() => {
        // Reset row heights when events change
        listRef.current?.resetAfterIndex(0);
    }, [events]);

    const formatDate = (date: Date) => ({
        weekday: date.toLocaleString('default', { weekday: 'short' }),
        monthDay: `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`,
        year: date.getFullYear(),
    });

    const getHolidayInfo = (date: Date) => holidays.find(h => h.date === date.toISOString().split('T')[0]);

    const getEventsForDay = (date: Date) => events.filter(event => event.date.toDateString() === date.toDateString());

    const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
        const centerIndex = Math.floor(scrollOffset / DAY_HEIGHT) + 5; // Adjust based on visible items
        const newCenterDate = allDays[centerIndex];

        setCenterDate(newCenterDate);

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        // Calculate the difference in days
        const diffTime = Math.abs(newCenterDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Show the button if more than 10 days away from present
        setShowReturnToPresent(diffDays > 10);
    };

    const returnToPresent = () => {
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const todayIndex = allDays.findIndex(date => date.toDateString() === today.toDateString());

        listRef.current?.scrollToItem(todayIndex, 'center');
    };

    const handleAddEvent = () => {
        if (selectedDate && newEventTitle && newEventLocation) {
            // Here you would typically use a geocoding service to get coordinates
            // For this example, we'll use a dummy coordinate
            const dummyCoordinates: [number, number] = [-74.5, 40];

            const newEvent: Event = {
                id: Date.now(),
                date: selectedDate,
                type: newEventType,
                location: {
                    address: newEventLocation,
                    coordinates: dummyCoordinates,
                },
                title: newEventTitle,
                description: newEventDescription,
            };

            setEvents([...events, newEvent]);
            setIsModalOpen(false);
            setNewEventType('Activity');
            setNewEventTitle('');
            setNewEventLocation('');
            setNewEventDescription('');
        }
    };

    const setRowHeight = (index: number, size: number) => {
        rowHeights.current = { ...rowHeights.current, [index]: size };
    };

    const getRowHeight = (index: number) => {
        return rowHeights.current[index] || DAY_HEIGHT; // Default to DAY_HEIGHT if not set
    };

    const renderDay = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const date = allDays[index];
        const { weekday, monthDay, year } = formatDate(date);
        const holidayInfo = getHolidayInfo(date);
        const dayEvents = getEventsForDay(date);

        return (
            <div style={{ ...style, height: 'auto' }}>
                <div
                    ref={el => {
                        if (el && el.getBoundingClientRect().height !== rowHeights.current[index]) {
                            setRowHeight(index, el.getBoundingClientRect().height);
                        }
                    }}
                    className={`p-2 relative min-h-[90px]`}
                >
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
                        const IconComponent =
                            theme === 'dark'
                                ? event.type === 'Hotel'
                                    ? DarkModeHotelIcon
                                    : event.type === 'Flight'
                                        ? DarkModePlaneIcon
                                        : DarkModeActivityIcon
                                : event.type === 'Hotel'
                                    ? HotelIcon
                                    : event.type === 'Flight'
                                        ? PlaneIcon
                                        : ActivityIcon;

                        return (
                            <div
                                key={event.id}
                                className={`${theme === 'dark' ? eventTypeColors[event.type].dark : eventTypeColors[event.type].light
                                    } shadow-sm rounded-md px-3 py-2 mb-2`}
                            >
                                <div className="flex items-center">
                                    <IconComponent className="w-4 h-4 mr-2" />
                                    <h3 className="font-semibold">{event.title}</h3>
                                </div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{event.description}</p>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{event.location.address}</p>
                            </div>
                        );
                    })}

                    {/* No Events */}
                    {dayEvents.length === 0 && <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No events</p>}

                    {/* Day Footer */}
                    <div className="absolute top-2 right-2 flex items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mr-2`}>{year}</span>
                        <Button
                            isIconOnly
                            aria-label="Add event"
                            className={`${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-black hover:bg-gray-100'
                                } shadow-sm transition-colors duration-200`}
                            size="sm"
                            onClick={() => {
                                setSelectedDate(date);
                                setIsModalOpen(true);
                            }}
                        >
                            +
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className={`h-full w-full p-4 overflow-hidden rounded-xl shadow-lg flex flex-col ${theme === 'dark' ? 'bg-gray-800/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'
                }`}
        >
            {/* Title */}
            <h1 className="text-2xl font-bold text-center mb-4">Your Itinerary</h1>

            {/* Timeline List */}
            <div className="flex-grow overflow-hidden relative">
                <ScrollShadow className="h-full">
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                ref={listRef}
                                className={styles.hideScrollbar}
                                height={height}
                                itemCount={DAYS_TO_LOAD}
                                itemSize={getRowHeight}
                                width={width}
                                onScroll={handleScroll}
                            >
                                {renderDay}
                            </List>
                        )}
                    </AutoSizer>
                </ScrollShadow>
            </div>

            {/* Return to Present Button */}
            {showReturnToPresent && (
                <Button
                    isIconOnly
                    aria-label="Return to present day"
                    className={`absolute bottom-4 right-8 ${theme === 'dark' ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-white text-blue-500 hover:bg-gray-100'
                        } shadow-lg transition-colors duration-200`}
                    radius="full"
                    size="lg"
                    onClick={returnToPresent}
                >
                    {centerDate > new Date() ? <UpArrow /> : <DownArrow />}
                </Button>
            )}

            {/* Add Event Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Event</ModalHeader>
                    <ModalBody>
                        <Input readOnly label="Date" value={selectedDate?.toDateString() || ''} />
                        <select
                            className="w-full p-2 border rounded mt-2"
                            value={newEventType}
                            onChange={e => setNewEventType(e.target.value as Event['type'])}
                        >
                            <option value="Activity">Activity</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Flight">Flight</option>
                        </select>
                        <Input className="mt-2" label="Title" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                        <Input className="mt-2" label="Location" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} />
                        <Textarea
                            className="mt-2"
                            label="Event Description"
                            value={newEventDescription}
                            onChange={e => setNewEventDescription(e.target.value)}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleAddEvent}>
                            Add Event
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
