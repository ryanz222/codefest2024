// app/page.tsx
'use client';

import { Link } from '@nextui-org/link';
import { button as buttonStyles } from '@nextui-org/theme';
import { useTheme } from 'next-themes';

import { title, subtitle } from '@/components/primitives';
import FeatureBox from '@/app/featureBox';

export default function Home() {
    const { theme } = useTheme();

    return (
        <div className="min-h-screen flex flex-col">
            <section className="flex-grow flex flex-col items-center justify-center gap-4 py-8 md:py-10 overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                    <video autoPlay loop muted playsInline className="object-cover w-full h-full">
                        <source src="/homepage-video.mp4" type="video/mp4" />
                        <a href="https://www.vecteezy.com/free-videos/hotel-exterior">Hotel Exterior Stock Videos by Vecteezy</a>
                    </video>
                    <div className="absolute inset-0 bg-blue-900 opacity-60" />
                </div>
                <div className="relative z-10 text-left w-full max-w-4xl px-6">
                    <div className="mb-4">
                        <span className={title({ class: 'text-white' })}>Your platform for </span>
                        <span className={title({ color: 'cyan' })}>planning</span>
                        <br />
                        <span className={title({ class: 'text-white' })}>and sharing long trips</span>
                    </div>

                    <div className={subtitle({ class: 'mt-4 text-gray-200' })}>
                        Experience <span className="text-cyan-400">seamless travel planning</span> with our intuitive tools that help you organize and
                        share your long trips effortlessly.
                    </div>

                    <div className="mt-8">
                        <Link
                            className={buttonStyles({
                                color: 'primary',
                                radius: 'full',
                                variant: 'shadow',
                                size: 'lg',
                            })}
                            href="/trips"
                        >
                            Start Planning
                        </Link>
                    </div>
                </div>
            </section>

            <div className="w-full bg-white dark:bg-gray-900 py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureBox
                            description="Plan your trips together with friends and family, synchronizing itineraries and preferences in real-time."
                            theme={theme}
                            title="Collaborative Trip Planning"
                        />
                        <FeatureBox
                            description="Organize all aspects of your journey, from accommodations to activities, in one centralized platform."
                            theme={theme}
                            title="Comprehensive Travel Management"
                        />
                        <FeatureBox
                            description="Get personalized recommendations and travel tips based on your preferences and past trips."
                            theme={theme}
                            title="Smart Travel Insights"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
