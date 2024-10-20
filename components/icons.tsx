import * as React from 'react';
import { SVGProps } from 'react';

import { IconSvgProps } from '@/types';

export const GithubIcon: React.FC<IconSvgProps> = ({ size = 24, width, height, ...props }) => {
    return (
        <svg height={size || height} viewBox="0 0 24 24" width={size || width} {...props}>
            <path
                clipRule="evenodd"
                d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </svg>
    );
};

export const MoonFilledIcon = ({ size = 24, width, height, ...props }: IconSvgProps) => (
    <svg aria-hidden="true" focusable="false" height={size || height} role="presentation" viewBox="0 0 24 24" width={size || width} {...props}>
        <path
            d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
            fill="currentColor"
        />
    </svg>
);

export const SunFilledIcon = ({ size = 24, width, height, ...props }: IconSvgProps) => (
    <svg aria-hidden="true" focusable="false" height={size || height} role="presentation" viewBox="0 0 24 24" width={size || width} {...props}>
        <g fill="currentColor">
            <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
            <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
        </g>
    </svg>
);

export const SearchIcon = (props: IconSvgProps) => (
    <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
        <path
            d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
        />
        <path d="M22 22L20 20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
);

export const UpArrow = (props: SVGProps<SVGSVGElement>) => (
    <svg
        className="feather feather-arrow-up"
        fill="none"
        height={24}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        width={24}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

export const DownArrow = (props: SVGProps<SVGSVGElement>) => (
    <svg
        className="feather feather-arrow-down"
        fill="none"
        height={24}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        width={24}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
);

export const PlaneIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#5f6368" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="m397-115-99-184-184-99 71-70 145 25 102-102-317-135 84-86 385 68 124-124q23-23 57-23t57 23q23 23 23 56.5T822-709L697-584l68 384-85 85-136-317-102 102 26 144-71 71Z" />
    </svg>
);

export const DarkModePlaneIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#F3F3F3" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="m397-115-99-184-184-99 71-70 145 25 102-102-317-135 84-86 385 68 124-124q23-23 57-23t57 23q23 23 23 56.5T822-709L697-584l68 384-85 85-136-317-102 102 26 144-71 71Z" />
    </svg>
);

export const HotelIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#5f6368" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M40-200v-600h80v400h320v-320h320q66 0 113 47t47 113v360h-80v-120H120v120H40Zm240-240q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm240 40h320v-160q0-33-23.5-56.5T760-640H520v240ZM280-520q17 0 28.5-11.5T320-560q0-17-11.5-28.5T280-600q-17 0-28.5 11.5T240-560q0 17 11.5 28.5T280-520Zm0-40Zm240-80v240-240Z" />
    </svg>
);

export const DarkModeHotelIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#F3F3F3" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M40-200v-600h80v400h320v-320h320q66 0 113 47t47 113v360h-80v-120H120v120H40Zm240-240q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm240 40h320v-160q0-33-23.5-56.5T760-640H520v240ZM280-520q17 0 28.5-11.5T320-560q0-17-11.5-28.5T280-600q-17 0-28.5 11.5T240-560q0 17 11.5 28.5T280-520Zm0-40Zm240-80v240-240Z" />
    </svg>
);

export const ActivityIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#5f6368" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M200-160v-80h80v-160L40-760h560L360-400v160h80v80H200Zm36-440h168l56-80H180l56 80Zm404 440q-50 0-85-35t-35-85q0-50 35-85t85-35q11 0 21 1.5t19 6.5v-368h200v120H760v360q0 50-35 85t-85 35Z" />
    </svg>
);

export const DarkModeActivityIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#F3F3F3" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M200-160v-80h80v-160L40-760h560L360-400v160h80v80H200Zm36-440h168l56-80H180l56 80Zm404 440q-50 0-85-35t-35-85q0-50 35-85t85-35q11 0 21 1.5t19 6.5v-368h200v120H760v360q0 50-35 85t-85 35Z" />
    </svg>
);

export const MoreIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#5f6368" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
    </svg>
);

export const DarkModeMoreIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg fill="#F3F3F3" height={24} viewBox="0 -960 960 960" width={24} xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
    </svg>
);

export const Logo = ({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg
        className="svg-icon"
        style={{
            width: `${size}px`,
            height: `${size}px`,
            verticalAlign: 'middle',
            fill: 'currentColor',
            overflow: 'hidden',
        }}
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M717.62 477.491c-37.735 0-74.753-10.137-107.06-29.337-14.592-8.653-19.405-27.546-10.7-42.087 8.652-14.592 27.545-19.405 42.086-10.7 22.784 13.567 48.947 20.684 75.673 20.684 81.818 0 148.378-66.56 148.378-148.377s-66.56-148.378-148.378-148.378c-76.544 0-141.517 59.7-147.865 135.885a30.746 30.746 0 0 1-33.178 28.057c-16.896-1.433-29.491-16.281-28.058-33.177C517.53 142.285 609.331 57.856 717.62 57.856c115.712 0 209.818 94.106 209.818 209.818.051 115.712-94.106 209.817-209.818 209.817z"
            fill="#F8B62D"
        />
        <path
            d="M726.784 313.651c11.827-15.513 13.824-35.993 5.171-53.453a50.596 50.596 0 0 0-45.619-28.313H152.218c-19.508 0-36.967 10.854-45.62 28.313a50.575 50.575 0 0 0 5.172 53.453l276.787 362.957V901.99h-173.21c-16.947 0-30.72 13.773-30.72 30.72s13.773 30.72 30.72 30.72h405.914c16.947 0 30.72-13.772 30.72-30.72s-13.773-30.72-30.72-30.72H449.997V676.608l276.787-362.957zm-61.747-20.377L419.226 615.578l-245.76-322.304h491.57z"
            fill="#424242"
        />
    </svg>
);
