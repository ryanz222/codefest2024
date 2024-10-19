"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Textarea,
} from "@nextui-org/react";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import styles from "./itinerary-page.module.css";

import {
    UpArrow,
    DownArrow,
    PlaneIcon,
    HotelIcon,
    ActivityIcon,
} from "@/components/icons";

interface Event {
    id: number;
    date: Date;
    type: "Hotel" | "Flight" | "Activity";
    location: {
        address: string;
        coordinates: [number, number]; // [longitude, latitude]
    };
    title: string;
    description: string;
}

const eventTypeColors = {
    Hotel: "bg-red-200",
    Flight: "bg-green-200",
    Activity: "bg-blue-200",
};

const DAY_HEIGHT = 120; // Adjust this value based on your design
const DAYS_TO_LOAD = 3650; // 10 years worth of days

const holidays = [
    { date: "2024-01-01", name: "New Year's Day", color: "bg-red-200" },
    { date: "2024-07-04", name: "Independence Day", color: "bg-blue-200" },
    { date: "2024-10-31", name: "Halloween", color: "bg-purple-200" },
    { date: "2024-12-25", name: "Christmas Day", color: "bg-green-200" },
];

export default function ItineraryPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [centerDate, setCenterDate] = useState<Date>(new Date());
    const [showReturnToPresent, setShowReturnToPresent] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newEventDescription, setNewEventDescription] = useState("");
    const [newEventType, setNewEventType] = useState<Event["type"]>("Activity");
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventLocation, setNewEventLocation] = useState("");

    const listRef = useRef<List>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const rowHeights = useRef<{ [key: number]: number }>({});

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
        // Initialize Mapbox
        mapboxgl.accessToken =
            "pk.eyJ1Ijoic2hhcmVkLWhhY2thdGhvbiIsImEiOiJjbTJnaDlleHcwMTR6MmtvcmRqcmlpMTl0In0.HVWCktNb9-FN1Ey9muk7cw";
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current!,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [-74.5, 40],
            zoom: 9,
        });

        // Add markers for events
        events.forEach((event) => {
            new mapboxgl.Marker()
                .setLngLat(event.location.coordinates)
                .setPopup(
                    new mapboxgl.Popup().setHTML(
                        `<h3>${event.title}</h3><p>${event.description}</p>`,
                    ),
                )
                .addTo(mapRef.current!);
        });

        // Scroll to today's date on initial render
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIndex = allDays.findIndex(
            (date) => date.toDateString() === today.toDateString()
        );
        listRef.current?.scrollTo(todayIndex * DAY_HEIGHT);

        // Pre-calculate all row heights
        allDays.forEach((date, index) => {
            const dayEvents = getEventsForDay(date);
            const holidayInfo = getHolidayInfo(date);
            const baseHeight = 120; // Minimum height
            const eventHeight = dayEvents.length * 70; // Adjust based on your event component height
            const holidayHeight = holidayInfo ? 30 : 0;
            const totalHeight = baseHeight + eventHeight + holidayHeight;
            setRowHeight(index, totalHeight);
        });

        // Force a re-render of the list to apply the new heights
        listRef.current?.resetAfterIndex(0);

        return () => mapRef.current?.remove();
    }, [allDays]); // Add allDays as a dependency

    const formatDate = (date: Date) => ({
        weekday: date.toLocaleString("default", { weekday: "short" }),
        monthDay: `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`,
        year: date.getFullYear(),
    });

    const getHolidayInfo = (date: Date) =>
        holidays.find((h) => h.date === date.toISOString().split("T")[0]);

    const getEventsForDay = (date: Date) =>
        events.filter(
            (event) => event.date.toDateString() === date.toDateString(),
        );

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
        const todayIndex = allDays.findIndex(
            (date) => date.toDateString() === today.toDateString(),
        );

        listRef.current?.scrollTo(todayIndex * DAY_HEIGHT);
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
            setNewEventType("Activity");
            setNewEventTitle("");
            setNewEventLocation("");
            setNewEventDescription("");

            // Add marker for new event
            new mapboxgl.Marker()
                .setLngLat(newEvent.location.coordinates)
                .setPopup(
                    new mapboxgl.Popup().setHTML(
                        `<h3>${newEvent.title}</h3><p>${newEvent.description}</p>`,
                    ),
                )
                .addTo(mapRef.current!);
        }
    };

    const setRowHeight = (index: number, size: number) => {
        listRef.current?.resetAfterIndex(0);
        rowHeights.current = { ...rowHeights.current, [index]: size };
    };

    const getRowHeight = (index: number) => {
        return rowHeights.current[index] || 120; // Default to 120px if not set
    };

    const renderDay = ({
        index,
        style,
    }: {
        index: number;
        style: React.CSSProperties;
    }) => {
        const date = allDays[index];
        const { weekday, monthDay, year } = formatDate(date);
        const holidayInfo = getHolidayInfo(date);
        const dayEvents = getEventsForDay(date);

        return (
            <div style={{ ...style, height: "auto" }}>
                <div
                    ref={(el) => {
                        if (
                            el &&
                            el.getBoundingClientRect().height !==
                            rowHeights.current[index]
                        ) {
                            setRowHeight(
                                index,
                                el.getBoundingClientRect().height,
                            );
                        }
                    }}
                    className="p-2 relative min-h-[120px]"
                >
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                            <span className="font-semibold">{weekday}</span>
                            <span className="ml-1">{monthDay}</span>
                            {holidayInfo && (
                                <span
                                    className={`ml-2 text-xs px-2 py-1 rounded-full ${holidayInfo.color}`}
                                >
                                    {holidayInfo.name}
                                </span>
                            )}
                        </div>
                    </div>
                    {dayEvents.map((event) => {
                        const IconComponent =
                            event.type === "Hotel"
                                ? HotelIcon
                                : event.type === "Flight"
                                    ? PlaneIcon
                                    : ActivityIcon;

                        return (
                            <div
                                key={event.id}
                                className={`${eventTypeColors[event.type]} shadow-sm rounded-md px-3 py-2 mb-2`}
                            >
                                <div className="flex items-center">
                                    <IconComponent className="w-4 h-4 mr-2" />
                                    <h3 className="font-semibold">
                                        {event.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-700">
                                    {event.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {event.location.address}
                                </p>
                            </div>
                        );
                    })}
                    {dayEvents.length === 0 && (
                        <p className="text-sm text-gray-400">No events</p>
                    )}
                    <div className="absolute top-2 right-2 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                            {year}
                        </span>
                        <Button
                            isIconOnly
                            aria-label="Add event"
                            className="bg-white text-black shadow-sm hover:bg-gray-100 transition-colors duration-200"
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
        <div className="relative w-full h-[calc(100vh-64px)]">
            <div
                ref={mapContainerRef}
                className="absolute top-0 left-0 w-full h-full"
            />
            <div className="absolute top-4 left-4 h-[calc(100%-2rem)] w-1/3 bg-white bg-opacity-80 p-4 overflow-hidden rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-4">
                    Your Itinerary
                </h1>
                <div className="h-[calc(100%-3rem)]">
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
                </div>
                {showReturnToPresent && (
                    <Button
                        isIconOnly
                        aria-label="Return to present day"
                        className="absolute bottom-4 right-4 bg-white text-blue-500 shadow-lg hover:bg-gray-100 transition-colors duration-200"
                        radius="full"
                        size="lg"
                        onClick={returnToPresent}
                    >
                        {centerDate > new Date() ? <UpArrow /> : <DownArrow />}
                    </Button>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Event</ModalHeader>
                    <ModalBody>
                        <Input
                            readOnly
                            label="Date"
                            value={selectedDate?.toDateString() || ""}
                        />
                        <select
                            className="w-full p-2 border rounded mt-2"
                            value={newEventType}
                            onChange={(e) =>
                                setNewEventType(e.target.value as Event["type"])
                            }
                        >
                            <option value="Activity">Activity</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Flight">Flight</option>
                        </select>
                        <Input
                            className="mt-2"
                            label="Title"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                        />
                        <Input
                            className="mt-2"
                            label="Location"
                            value={newEventLocation}
                            onChange={(e) =>
                                setNewEventLocation(e.target.value)
                            }
                        />
                        <Textarea
                            className="mt-2"
                            label="Event Description"
                            value={newEventDescription}
                            onChange={(e) =>
                                setNewEventDescription(e.target.value)
                            }
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => setIsModalOpen(false)}
                        >
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
