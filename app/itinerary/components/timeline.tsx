/* eslint-disable prettier/prettier */
// app/itinerary/components/timeline.tsx
'use client';
import React, { useState, useEffect, useRef, useMemo, Dispatch, SetStateAction } from 'react';
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    ScrollShadow,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    ButtonGroup,
    Autocomplete,
    AutocompleteItem,
    Spinner,
    Radio,
    RadioGroup,
} from '@nextui-org/react';
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

    const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
    const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);
    const [hotelModalTab, setHotelModalTab] = useState<'specific' | 'search'>('specific');
    const [hotelAddress, setHotelAddress] = useState('');
    const [hotelCity, setHotelCity] = useState('');
    const [hotelFilterPriority, setHotelFilterPriority] = useState<'PRICE' | 'DISTANCE' | 'RATING'>('PRICE');
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hotelOptions, setHotelOptions] = useState<any[]>([]);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        setAutocomplete(autocomplete);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();

            setHotelAddress(place.formatted_address || '');
        }
    };

    const handleInputChange = async (value: string) => {
        if (value.length > 2) {
            try {
                const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(value)}`);
                const data = await response.json();

                if (data.predictions) {
                    setPredictions(data.predictions);
                    setShowPredictions(true);
                } else {
                    console.error('Unexpected response format:', data);
                    setPredictions([]);
                    setShowPredictions(false);
                }
            } catch (error) {
                console.error('Error fetching predictions:', error);
                setPredictions([]);
                setShowPredictions(false);
            }
        } else {
            setPredictions([]);
            setShowPredictions(false);
        }
    };

    const handlePredictionSelect = (predictionId: string) => {
        const selectedPrediction = predictions.find(p => p.place_id === predictionId);

        if (selectedPrediction) {
            console.log('Selected prediction:', selectedPrediction);

            setHotelAddress(selectedPrediction.description);
        }
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
                                <DropdownItem
                                    key="flight"
                                    onPress={() => {
                                        setNewEventDate(date);
                                        setIsFlightModalOpen(true);
                                    }}
                                >
                                    Flight
                                </DropdownItem>
                                <DropdownItem
                                    key="hotel"
                                    onPress={() => {
                                        setNewEventDate(date);
                                        setIsHotelModalOpen(true);
                                    }}
                                >
                                    Hotel
                                </DropdownItem>
                                <DropdownItem
                                    key="activity"
                                    onPress={() => {
                                        setNewEventDate(date);
                                        setIsActivityModalOpen(true);
                                    }}
                                >
                                    Activity
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            </div>
        );
    };

    const handleAddHotel = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (hotelModalTab === 'specific') {
                await handleSpecificHotelSubmission(hotelAddress);
            } else {
                await handleHotelSearchSubmission(hotelCity, hotelFilterPriority);
            }
        } catch (error) {
            setError('An error occurred while adding the hotel. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpecificHotelSubmission = async (address: string) => {
        try {
            console.log('Submitting specific hotel:', address);
            // Step 1: Get latitude and longitude from address
            const geocodeResponse = await fetch(`/api/addressToCoordinate?address=${encodeURIComponent(address)}`);
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.error) {
                throw new Error(geocodeData.error);
            }
            const { latitude, longitude } = geocodeData;

            // Step 2: Get tomorrow's date for check-in
            const tomorrow = new Date();

            tomorrow.setDate(tomorrow.getDate() + 1);
            const checkInDate = tomorrow.toISOString().split('T')[0];

            // Step 3: Fetch hotel information from Amadeus
            const hotelResponse = await fetch(`/api/getHotelNearestCoordinate?latitude=${latitude}&longitude=${longitude}&checkInDate=${checkInDate}`);
            const hotelData = await hotelResponse.json();

            if (hotelData.error) {
                throw new Error(hotelData.error);
            }

            console.log('Hotel data:', hotelData);
            // Step 4: Process and display hotel information
            if (hotelData.length > 0) {
                setHotelOptions(hotelData);
                setSelectedHotelId(null);
            } else {
                throw new Error('No hotel offers found');
            }
        } catch (error) {
            console.error('Error submitting hotel:', error);
            setError('An error occurred while fetching hotel options. Please try again.');
        }
    };

    const handleHotelSearchSubmission = async (city: string, priority: 'PRICE' | 'DISTANCE' | 'RATING') => {
        // Skeleton handler for hotel search submission
        console.log('Submitting hotel search:', { city, priority });
        // Implement the actual submission logic later
    };

    const handleHotelSelection = () => {
        if (selectedHotelId) {
            const selectedHotel = hotelOptions.find(hotel => hotel.hotelId === selectedHotelId);

            if (selectedHotel) {
                const newEvent: Event = {
                    id: Date.now(),
                    date: newEventDate!,
                    type: 'Hotel',
                    location: {
                        address: hotelAddress,
                        coordinates: [selectedHotel.geoCode.longitude, selectedHotel.geoCode.latitude],
                    },
                    title: selectedHotel.name,
                    description: '',
                };

                setEvents(prevEvents => [...prevEvents, newEvent]);
                setIsHotelModalOpen(false);
                setHotelOptions([]);
                setSelectedHotelId(null);
            }
        }
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

            {/* Flight Modal */}
            <Modal isOpen={isFlightModalOpen} onClose={() => setIsFlightModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Flight</ModalHeader>
                    <ModalBody>
                        <Input readOnly label="Date" value={newEventDate?.toDateString() || ''} />
                        {/* Add more fields here later */}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsFlightModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={() => {
                                // Handle adding flight event
                                setIsFlightModalOpen(false);
                            }}
                        >
                            Add Flight
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Hotel Modal */}
            <Modal isOpen={isHotelModalOpen} onClose={() => setIsHotelModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Hotel</ModalHeader>
                    <ModalBody>
                        <Input readOnly label="Date" value={newEventDate?.toDateString() || ''} />

                        <ButtonGroup>
                            <Button color={hotelModalTab === 'specific' ? 'primary' : 'default'} onPress={() => setHotelModalTab('specific')}>
                                Specific Hotel
                            </Button>
                            <Button color={hotelModalTab === 'search' ? 'primary' : 'default'} onPress={() => setHotelModalTab('search')}>
                                Search Hotels
                            </Button>
                        </ButtonGroup>

                        {hotelModalTab === 'specific' ? (
                            <>
                                <Autocomplete
                                    defaultItems={predictions}
                                    label="Hotel Address"
                                    listboxProps={{ emptyContent: <p>Start typing an address...</p> }}
                                    placeholder="Enter hotel address"
                                    onInputChange={handleInputChange}
                                    onSelectionChange={(key) => {
                                        if (typeof key === 'string') {
                                            handlePredictionSelect(key);
                                        }
                                    }}
                                >
                                    {(prediction) => (
                                        <AutocompleteItem key={prediction.place_id} textValue={prediction.description}>
                                            {prediction.description}
                                        </AutocompleteItem>
                                    )}
                                </Autocomplete>

                                {hotelOptions.length > 0 && (
                                    <RadioGroup
                                        label="Select a hotel"
                                        value={selectedHotelId}
                                        onValueChange={setSelectedHotelId}
                                    >
                                        {hotelOptions.map((hotel) => (
                                            <Radio key={hotel.hotelId} value={hotel.hotelId}>
                                                {hotel.name}
                                            </Radio>
                                        ))}
                                    </RadioGroup>
                                )}
                            </>
                        ) : (
                            <>
                                <Input label="City" placeholder="Enter city name" value={hotelCity} onChange={e => setHotelCity(e.target.value)} />
                                <ButtonGroup>
                                    <Button
                                        color={hotelFilterPriority === 'PRICE' ? 'primary' : 'default'}
                                        onPress={() => setHotelFilterPriority('PRICE')}
                                    >
                                        Price
                                    </Button>
                                    <Button
                                        color={hotelFilterPriority === 'DISTANCE' ? 'primary' : 'default'}
                                        onPress={() => setHotelFilterPriority('DISTANCE')}
                                    >
                                        Distance
                                    </Button>
                                    <Button
                                        color={hotelFilterPriority === 'RATING' ? 'primary' : 'default'}
                                        onPress={() => setHotelFilterPriority('RATING')}
                                    >
                                        Rating
                                    </Button>
                                </ButtonGroup>
                            </>
                        )}

                        {error && <p className="text-red-500">{error}</p>}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsHotelModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            disabled={isLoading || (hotelOptions.length > 0 && !selectedHotelId)}
                            onPress={hotelOptions.length > 0 ? handleHotelSelection : handleAddHotel}
                        >
                            {isLoading ? <Spinner size="sm" /> : hotelOptions.length > 0 ? 'Confirm Hotel' : 'Search Hotels'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Activity Modal */}
            <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)}>
                <ModalContent>
                    <ModalHeader>Add New Activity</ModalHeader>
                    <ModalBody>
                        <Input readOnly label="Date" value={newEventDate?.toDateString() || ''} />
                        {/* Add more fields here later */}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setIsActivityModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={() => {
                                // Handle adding activity event
                                setIsActivityModalOpen(false);
                            }}
                        >
                            Add Activity
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
