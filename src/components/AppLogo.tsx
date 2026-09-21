import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-label="JobTrack Logo"
      role="img"
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="45%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient id="logoSurfaceGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        <linearGradient id="logoAccentArrow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        <linearGradient id="logoHandleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>

        <linearGradient id="logoCaseHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>

        <linearGradient id="logoGoldBadge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <filter id="logoDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" floodColor="#0F172A" floodOpacity="0.45" />
        </filter>

        <filter id="logoGlowEffect" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="logoBadgeShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#064E3B" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Squircle Base */}
      <rect width="512" height="512" rx="116" fill="url(#logoBgGrad)" />

      {/* Subtle inner border highlight */}
      <rect
        x="2"
        y="2"
        width="508"
        height="508"
        rx="114"
        fill="none"
        stroke="#818CF8"
        strokeWidth="2"
        strokeOpacity="0.3"
      />

      {/* Ambient light glow circle behind briefcase */}
      <circle cx="256" cy="260" r="160" fill="#6366F1" opacity="0.25" filter="url(#logoGlowEffect)" />

      {/* Briefcase Handle */}
      <path
        d="M 200 152 V 118 C 200 98 216 82 236 82 H 276 C 296 82 312 98 312 118 V 152"
        fill="none"
        stroke="url(#logoHandleGrad)"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Briefcase Main Body (With Drop Shadow) */}
      <g filter="url(#logoDropShadow)">
        {/* Base Case */}
        <rect x="96" y="152" width="320" height="236" rx="36" fill="url(#logoSurfaceGrad)" />

        {/* Top Sheen / Inset Highlight */}
        <rect x="96" y="152" width="320" height="236" rx="36" fill="url(#logoCaseHighlight)" />

        {/* Briefcase Upper Flap Divider */}
        <path
          d="M 96 152 H 416 V 212 C 416 224 406 234 394 238 L 268 274 C 260 276 252 276 244 274 L 118 238 C 106 234 96 212 Z"
          fill="#1E1B4B"
          fillOpacity="0.38"
        />

        <path
          d="M 96 212 L 244 254 C 252 256 260 256 268 254 L 416 212"
          fill="none"
          stroke="#C7D2FE"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />

        {/* Briefcase Center Clasp/Latch */}
        <rect x="236" y="244" width="40" height="30" rx="8" fill="#FFFFFF" />
        <rect x="246" y="254" width="20" height="10" rx="3" fill="#4F46E5" />

        {/* Dynamic Career Growth / Trajectory Arrow */}
        <g filter="url(#logoGlowEffect)">
          <path
            d="M 148 330 L 210 278 L 272 298 L 360 196"
            fill="none"
            stroke="url(#logoAccentArrow)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 322 194 H 362 V 234"
            fill="none"
            stroke="#34D399"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Career Star Sparkle at Top Right of Arrow */}
        <path
          d="M 390 168 Q 390 184 406 184 Q 390 184 390 200 Q 390 184 374 184 Q 390 184 390 168 Z"
          fill="#FDE047"
          filter="url(#logoGlowEffect)"
        />
      </g>

      {/* Verified Offer / Hired Checkmark Badge */}
      <g filter="url(#logoBadgeShadow)">
        <circle cx="376" cy="358" r="46" fill="url(#logoGoldBadge)" stroke="#FFFFFF" strokeWidth="6" />
        <path
          d="M 358 358 L 372 372 L 398 344"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
