// app/layout.tsx
'use client';

import '@/styles/globals.css';
import clsx from 'clsx';

import { Providers } from './providers';

import { fontSans } from '@/config/fonts';
import { Navbar } from '@/components/navbar';
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html suppressHydrationWarning lang="en">
            <head />
            <body suppressHydrationWarning className={clsx('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
                <Providers themeProps={{ attribute: 'class', defaultTheme: 'light' }}>
                    <Navbar />
                    <main>{children}</main>
                </Providers>
            </body>
        </html>
    );
}
