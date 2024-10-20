// app/trips/[trip_id]/timeline.tsx
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, ScrollShadow } from '@nextui-org/react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme } from 'next-themes';

import DayItem from './dayItem';
import FlightModal from './flightModal';
import HotelModal from './hotelModal';
import ActivityModal from './activityModal';

import { useTrip } from '@/hooks/useTrip';
import { UpArrow, DownArrow } from '@/components/icons';
import styles from '@/styles/itinerary-page.module.css';

export default function TripTimeline({ trip_id }: { trip_id: string }) {
    const [centerDate, setCenterDate] = useState<Date>(new Date());
    const [showReturnToPresent, setShowReturnToPresent] = useState(false);
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);

    const { theme } = useTheme();

    const listRef = useRef<List>(null);
    const rowHeights = useRef<{ [key: number]: number }>({});

    const { trip } = useTrip(trip_id);

    const startDate = useMemo(() => {
        const date = new Date();

        date.setMonth(date.getMonth() + 1);

        return date;
    }, []);

    const DAY_HEIGHT = 90;
    const DAYS_TO_LOAD = 3650;

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
        const halfDaysToLoad = Math.floor(DAYS_TO_LOAD / 2);

        return Array.from({ length: DAYS_TO_LOAD }, (_, i) => {
            const date = new Date(today);

            date.setDate(date.getDate() + i - halfDaysToLoad);

            return date;
        });
    }, []);

    useEffect(() => {
        // Scroll to today's date on initial render
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const todayIndex = allDays.findIndex(date => date.toDateString() === today.toDateString());

        listRef.current?.scrollToItem(todayIndex, 'center');

        // Pre-calculate row heights
        listRef.current?.resetAfterIndex(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getHolidayInfo = (date: Date) => holidays.find(h => h.date === date.toISOString().split('T')[0]);

    const setRowHeight = (index: number, size: number) => {
        rowHeights.current = { ...rowHeights.current, [index]: size };
    };

    const getRowHeight = (index: number) => {
        return rowHeights.current[index] || DAY_HEIGHT;
    };

    const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
        const centerIndex = Math.floor(scrollOffset / DAY_HEIGHT) + 5;
        const newCenterDate = allDays[centerIndex];

        setCenterDate(newCenterDate);

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(newCenterDate.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setShowReturnToPresent(diffDays > 10);
    };

    const returnToPresent = () => {
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        const todayIndex = allDays.findIndex(date => date.toDateString() === today.toDateString());

        listRef.current?.scrollToItem(todayIndex, 'center');
    };

    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

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

    const renderDay = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const date = allDays[index];

        if (!trip) return null;

        return (
            <DayItem
                date={date}
                eventTypeColors={eventTypeColors}
                getHolidayInfo={getHolidayInfo}
                index={index}
                setRowHeight={setRowHeight}
                startDate={startDate}
                style={style}
                trip={trip}
                onAddEvent={handleAddEvent}
            />
        );
    };

    return (
        <div
            className={`h-full w-full p-4 overflow-hidden rounded-xl shadow-lg flex flex-col ${
                theme === 'dark' ? 'bg-gray-800/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'
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
                    // className={`absolute bottom-4 right-8 ${theme === 'dark' ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-white text-blue-500 hover:bg-gray-100'
                    //     } shadow-lg transition-colors duration-200`}
                    className={`absolute bottom-4 right-8`}
                    radius="full"
                    size="lg"
                    onClick={returnToPresent}
                >
                    {centerDate > new Date() ? <UpArrow /> : <DownArrow />}
                </Button>
            )}

            {/* Modals */}
            <FlightModal date={newEventDate} isOpen={isFlightModalOpen} trip_id={trip_id} onClose={() => setIsFlightModalOpen(false)} />

            <HotelModal date={newEventDate} isOpen={isHotelModalOpen} trip_id={trip_id} onClose={() => setIsHotelModalOpen(false)} />

            <ActivityModal date={newEventDate} isOpen={isActivityModalOpen} trip_id={trip_id} onClose={() => setIsActivityModalOpen(false)} />
        </div>
    );
}
