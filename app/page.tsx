// app/page.tsx
'use client';
import { Button } from '@nextui-org/react';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center p-4 h-[calc(100vh-64px)]">
            <h1 className="text-4xl font-bold text-center mb-10">Plan and share long trips with ease</h1>
            <div className="flex gap-4">
                <Link passHref href="/trips">
                    <Button color="primary" size="lg">
                        Manage Trips
                    </Button>
                </Link>
                <Link passHref href="/hotels">
                    <Button color="secondary" size="lg">
                        Find Hotels
                    </Button>
                </Link>
            </div>
        </div>
    );
}
