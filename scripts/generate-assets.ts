import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312E81" />
      <stop offset="45%" stop-color="#4338CA" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    
    <linearGradient id="surfaceGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>

    <linearGradient id="accentArrow" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <linearGradient id="handleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#C7D2FE" />
    </linearGradient>

    <linearGradient id="caseHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <linearGradient id="goldBadge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <!-- Filters & Glows -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#0F172A" flood-opacity="0.45" />
    </filter>

    <filter id="glowEffect" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#064E3B" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect width="512" height="512" rx="116" fill="url(#bgGrad)" />
  
  <!-- Subtle inner border highlight -->
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="#818CF8" stroke-width="2" stroke-opacity="0.3" />

  <!-- Ambient light glow circle behind briefcase -->
  <circle cx="256" cy="260" r="160" fill="#6366F1" opacity="0.25" filter="url(#glowEffect)" />

  <!-- Briefcase Handle -->
  <path d="M 200 152 V 118 C 200 98 216 82 236 82 H 276 C 296 82 312 98 312 118 V 152" 
        fill="none" 
        stroke="url(#handleGrad)" 
        stroke-width="22" 
        stroke-linecap="round" 
        stroke-linejoin="round" />

  <!-- Briefcase Main Body (With Drop Shadow) -->
  <g filter="url(#dropShadow)">
    <!-- Base Case -->
    <rect x="96" y="152" width="320" height="236" rx="36" fill="url(#surfaceGrad)" />
    
    <!-- Top Sheen / Inset Highlight -->
    <rect x="96" y="152" width="320" height="236" rx="36" fill="url(#caseHighlight)" />

    <!-- Briefcase Upper Flap Divider -->
    <path d="M 96 152 H 416 V 212 C 416 224 406 234 394 238 L 268 274 C 260 276 252 276 244 274 L 118 238 C 106 234 96 224 96 212 Z" 
          fill="#1E1B4B" 
          fill-opacity="0.38" />

    <path d="M 96 212 L 244 254 C 252 256 260 256 268 254 L 416 212" 
          fill="none" 
          stroke="#C7D2FE" 
          stroke-width="3.5" 
          stroke-linecap="round" 
          stroke-opacity="0.55" />

    <!-- Briefcase Center Clasp/Latch (Pill) -->
    <rect x="236" y="244" width="40" height="30" rx="8" fill="#FFFFFF" />
    <rect x="246" y="254" width="20" height="10" rx="3" fill="#4F46E5" />

    <!-- Dynamic Career Growth / Trajectory Arrow (Ascending across the case) -->
    <g filter="url(#glowEffect)">
      <!-- Motion trail dash -->
      <path d="M 148 330 L 210 278 L 272 298 L 360 196" 
            fill="none" 
            stroke="url(#accentArrow)" 
            stroke-width="14" 
            stroke-linecap="round" 
            stroke-linejoin="round" />

      <!-- Arrowhead -->
      <path d="M 322 194 H 362 V 234" 
            fill="none" 
            stroke="#34D399" 
            stroke-width="14" 
            stroke-linecap="round" 
            stroke-linejoin="round" />
    </g>

    <!-- Career Star Sparkle at Top Right of Arrow -->
    <path d="M 390 168 Q 390 184 406 184 Q 390 184 390 200 Q 390 184 374 184 Q 390 184 390 168 Z" 
          fill="#FDE047" 
          filter="url(#glowEffect)" />
  </g>

  <!-- Verified Offer / Hired Checkmark Badge (Bottom Right) -->
  <g filter="url(#badgeShadow)">
    <circle cx="376" cy="358" r="46" fill="url(#goldBadge)" stroke="#FFFFFF" stroke-width="6" />
    <!-- Crisp Checkmark -->
    <path d="M 358 358 L 372 372 L 398 344" 
          fill="none" 
          stroke="#FFFFFF" 
          stroke-width="7.5" 
          stroke-linecap="round" 
          stroke-linejoin="round" />
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write public/logo.svg and public/favicon.svg
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('Saved SVG logos to /public');

  // 2. Render 512x512 high-resolution PNG
  const resvg512 = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 512 },
  });
  const png512 = resvg512.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'logo.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), png512);
  console.log('Saved 512x512 PNG icons to /public');

  // 3. Render 180x180 Apple Touch Icon
  const resvg180 = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 180 },
  });
  const png180 = resvg180.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
  console.log('Saved 180x180 Apple Touch icon to /public');

  // 4. Render 64x64 favicon.png
  const resvg64 = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 64 },
  });
  const png64 = resvg64.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), png64);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png64);
  console.log('Saved 64x64 favicons to /public');

  // Also write into src/assets or assets for bundling if needed
  const assetsDir = path.resolve(process.cwd(), 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(assetsDir, 'logo.svg'), svgContent, 'utf-8');
  fs.writeFileSync(path.join(assetsDir, 'logo.png'), png512);
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
