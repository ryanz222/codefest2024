// components/navbar.tsx
'use client';
import { Navbar as NextUINavbar, NavbarContent, NavbarBrand, NavbarItem } from '@nextui-org/navbar';
import { Link } from '@nextui-org/link';
import { Input } from '@nextui-org/input';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useTheme } from 'next-themes';

import { siteConfig } from '@/config/site';
import { ThemeSwitch } from '@/components/theme-switch';
import { GithubIcon, Logo, SearchIcon } from '@/components/icons';

const SignInButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignInButton), { ssr: false });
const SignedIn = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedIn), { ssr: false });
const SignedOut = dynamic(() => import('@clerk/nextjs').then(mod => mod.SignedOut), { ssr: false });
const UserButton = dynamic(() => import('@clerk/nextjs').then(mod => mod.UserButton), { ssr: false });

export const Navbar = () => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/trips?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <NextUINavbar maxWidth="xl" position="sticky">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        <img src="/image.png" alt="TripTonic Logo" className="h-10 w-auto" />
                    </NextLink>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="flex-grow" justify="center">
                <NavbarItem className="w-full max-w-2xl">
                    <form className="w-full" onSubmit={handleSearch}>
                        <Input
                            classNames={{
                                base: 'max-w-full h-10',
                                mainWrapper: 'h-full',
                                input: 'text-small text-blue-800',
                                inputWrapper: 'h-full font-normal text-default-500 bg-blue-100/80 dark:bg-blue-50/20 rounded-full',
                            }}
                            placeholder="Search trips..."
                            size="sm"
                            startContent={<SearchIcon size={18} />}
                            type="search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </form>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end">
                <NavbarItem className="flex gap-2">
                    <Link isExternal aria-label="Github" href={siteConfig.links.github}>
                        <GithubIcon className="text-default-500" />
                    </Link>
                    <ThemeSwitch />
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </NavbarItem>
            </NavbarContent>
        </NextUINavbar>
    );
};
