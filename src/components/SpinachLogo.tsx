import React from 'react';

interface SpinachLogoProps {
  className?: string;
  size?: number;
}

export const SpinachLogo: React.FC<SpinachLogoProps> = ({ className = '', size = 44 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Spinach Leaf Logo"
    >
      <defs>
        {/* Rich vibrant spinach leaf gradient */}
        <linearGradient id="spinachGradient" x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="45%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        {/* Soft leaf surface highlight */}
        <linearGradient id="spinachHighlight" x1="20" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Curved Stem */}
      <path
        d="M20 54C23 48 26 40 28 32"
        stroke="#047857"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Main Spinach Leaf Body */}
      <path
        d="M28 32C22 35 15 32 14 24C13 16 22 10 32 8C43 6 52 14 51 25C50 34 42 42 32 44C29 44.5 25 43 23 40L28 32Z"
        fill="url(#spinachGradient)"
      />

      {/* Surface Light Contour */}
      <path
        d="M28 14C35 12 43 16 44 23C45 30 39 37 31 38"
        stroke="url(#spinachHighlight)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Main Central Leaf Vein */}
      <path
        d="M24 41C27 34 33 24 37 12"
        stroke="#6EE7B7"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Secondary Veins */}
      <path
        d="M29 32C34 30 41 32 44 31"
        stroke="#6EE7B7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M27 28C22 26 18 24 16 21"
        stroke="#6EE7B7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M32 24C38 21 43 20 46 18"
        stroke="#6EE7B7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <path
        d="M30 20C25 18 21 16 19 14"
        stroke="#6EE7B7"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <path
        d="M34 17C38 15 42 14 43 13"
        stroke="#6EE7B7"
        strokeWidth="1"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
    </svg>
  );
};
