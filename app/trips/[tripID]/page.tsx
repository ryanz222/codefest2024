// app/trips/[tripID]/page.tsx
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

export default function Trip({ params }: { params: Params }) {
    const { tripID } = params;

    return (
        <div>
            <h1>Trip Details</h1>
            <p>Trip ID: {tripID}</p>
        </div>
    );
}
