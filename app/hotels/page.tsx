// app/hotels/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, ModalHeader, ModalBody, ModalFooter, ModalContent } from '@nextui-org/react';

import { HotelOffer } from '@/app/api/getHotelOffers/route';

// Marriott chain codes except Marriott = "MC"
enum MarriottChains {
    EDITION = 'EB',
    FAIRFIELD_INN = 'FN',
    SHERATON = 'SI',
    TOWNEPLACE_SUITES = 'TO',
    MARRIOTT_VACATION_CLUB = 'VC',
    COURTYARD = 'CY',
    DELTA_HOTELS = 'DE',
    ELEMENT = 'EL',
    LUXURY_COLLECTION = 'LC',
    PROTEA_HOTELS = 'PR',
    W_HOTELS = 'WH',
    WESTIN = 'WI',
    ST_REGIS = 'XR',
    SPRINGHILL_SUITES = 'XV',
    RENAISSANCE = 'BR',
    GAYLORD_ENTERTAINMENT = 'GE',
    LE_MERIDIEN = 'MD',
    RESIDENCE_INN = 'RC',
    RITZ_CARLTON = 'RZ',
    AUTOGRAPH_COLLECTION = 'AK',
    ALOFT = 'AL',
    AC_HOTELES = 'AR',
    MOXY = 'OX',
    TRIBUTE_PORTFOLIO = 'TX',
    DESIGN_PARTNER = 'DP',
    FOUR_POINTS = 'FP',
}

export default function Home() {
    const [cityCode, setCityCode] = useState('PAR');
    const [hotels, setHotels] = useState<HotelOffer[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filteredHotels, setFilteredHotels] = useState<any[]>([]);

    const cityOptions = [
        { code: 'PAR', name: 'Paris' },
        { code: 'LON', name: 'London' },
        { code: 'NYC', name: 'New York' },
    ];

    const fetchHotelsAndOffers = async (selectedCityCode: string) => {
        setLoading(true);
        try {
            const hotelsResponse = await fetch(`/api/getHotelListByIATACode?cityCode=${selectedCityCode}`);
            const hotelsData = await hotelsResponse.json();

            const filteredHotels = hotelsData.filter((hotel: any) => Object.values(MarriottChains).includes(hotel.chainCode));

            setFilteredHotels(filteredHotels);

            const hotelIds = filteredHotels.map((hotel: any) => hotel.hotelId).join(',');
            const offersResponse = await fetch(`/api/getHotelOffers?hotelIds=${hotelIds}`);
            const offersData: HotelOffer[] = await offersResponse.json();

            setHotels(offersData);
        } catch (error) {
            console.error('Error fetching hotels and offers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotelsAndOffers(cityCode);
    }, [cityCode]);

    const openModal = (hotel: HotelOffer) => {
        setSelectedHotel(hotel);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedHotel(null);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Hotel Finder</h1>
            <div className="mb-4">
                <select className="mr-2 p-2 border rounded" value={cityCode} onChange={e => setCityCode(e.target.value)}>
                    {cityOptions.map(city => (
                        <option key={city.code} value={city.code}>
                            {city.name}
                        </option>
                    ))}
                </select>
            </div>
            {loading ? (
                <p>Loading hotels...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotels.map((hotel: HotelOffer) => (
                        <div
                            key={hotel.hotelId}
                            className="border rounded-lg p-4 shadow-md cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => openModal(hotel)}
                            onKeyDown={e => e.key === 'Enter' && openModal(hotel)}
                        >
                            <h2 className="text-xl font-bold mb-2">{hotel.hotelName}</h2>
                            <p className="mb-2">
                                Chain:{' '}
                                {Object.keys(MarriottChains).find(key => MarriottChains[key as keyof typeof MarriottChains] === hotel.chainCode)}
                            </p>
                            <p className="mb-2">
                                Price: {hotel.totalPrice} {hotel.currency}
                            </p>
                            <p className="mb-2">Room: {hotel.description}</p>
                            <p className="mb-2">Check-in: {hotel.checkInDate}</p>
                            <p className="mb-2">Check-out: {hotel.checkOutDate}</p>
                        </div>
                    ))}
                </div>
            )}
            <Modal isOpen={isModalOpen} scrollBehavior="inside" size="xl" onClose={closeModal}>
                <ModalContent>
                    <ModalHeader>
                        <div className="text-xl font-bold">{selectedHotel?.hotelName}</div>
                    </ModalHeader>
                    <ModalBody>
                        <h3 className="text-lg font-semibold mb-2">Hotel Offer Data:</h3>
                        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded mb-4">{JSON.stringify(selectedHotel, null, 2)}</pre>
                        <h3 className="text-lg font-semibold mb-2">Hotel Description:</h3>
                        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
                            {JSON.stringify(
                                filteredHotels.find(hotel => hotel.hotelId === selectedHotel?.hotelId),
                                null,
                                2
                            )}
                        </pre>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={closeModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
