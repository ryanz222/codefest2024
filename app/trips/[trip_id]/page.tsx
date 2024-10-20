// app/trips/[trip_id]/page.tsx
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

import MapComponent from './map';
import AboutTrip from './aboutTrip';

export default function Trip({ params }: { params: Params }) {
    const { trip_id } = params;

    return (
        <div className="relative w-full h-[calc(100vh-64px)]">
            {/* Map Component */}
            <MapComponent trip_id={trip_id} />

            {/* Floating left panel */}
            <div className="absolute flex gap-4 top-0 left-0 w-1/3 h-full p-4 overflow-auto">
                {/* About Trip */}
                <AboutTrip trip_id={trip_id} />
            </div>
        </div>
    );
}
