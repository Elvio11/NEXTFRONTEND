'use client'

// Talvix Premium Icon Suite — Ice-Glass Aesthetic (Colored Edition)
// Each icon has its own signature color palette baked in.

// ─────────────────────────────────────────────────────────────
// 1. THE SECURE VAULT — Teal / Emerald Ice
// ─────────────────────────────────────────────────────────────
export function SecureVault({ size = 24, className = "", ...props }: { size?: number, className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="sv-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CF5E0" />
          <stop offset="100%" stopColor="#0F6E56" />
        </linearGradient>
        <linearGradient id="sv-rings" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A5F3E8" />
          <stop offset="100%" stopColor="#1D9E75" />
        </linearGradient>
      </defs>

      <path
        d="M12 2L20.5 6.5V13C20.5 17.1 16.8 20.6 12 22C7.2 20.6 3.5 17.1 3.5 13V6.5L12 2Z"
        stroke="url(#sv-shield)"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      <circle cx="12" cy="13" r="5"   stroke="url(#sv-rings)" strokeWidth="1.5" opacity="0.45" />
      <circle cx="12" cy="13" r="3"   stroke="url(#sv-rings)" strokeWidth="1.5" opacity="0.75" />
      <line x1="12"  y1="7.5"  x2="12"  y2="8.5"  stroke="#7CF5E0" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="12"  y1="17.5" x2="12"  y2="18.5" stroke="#7CF5E0" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="6.5" y1="13"   x2="7.5" y2="13"   stroke="#7CF5E0" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="16.5" y1="13"  x2="17.5" y2="13"  stroke="#7CF5E0" strokeWidth="1.5" strokeLinecap="square" />
      <circle cx="12" cy="13" r="1.25" fill="#7CF5E0" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. THE NEURAL SWARM — Electric Blue / Cyan
// ─────────────────────────────────────────────────────────────
export function NeuralSwarm({ size = 24, className = "", ...props }: { size?: number, className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="ns-hub" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B5D4F4" />
          <stop offset="100%" stopColor="#185FA5" />
        </linearGradient>
        <linearGradient id="ns-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#85B7EB" />
          <stop offset="100%" stopColor="#378ADD" />
        </linearGradient>
      </defs>

      {/* Cross-mesh (dim) */}
      <line x1="12"    y1="5"    x2="18.06" y2="15.5" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="square" opacity="0.18" />
      <line x1="18.06" y1="8.5"  x2="12"    y2="19"   stroke="#378ADD" strokeWidth="1.5" strokeLinecap="square" opacity="0.18" />
      <line x1="18.06" y1="15.5" x2="5.94"  y2="8.5"  stroke="#378ADD" strokeWidth="1.5" strokeLinecap="square" opacity="0.18" />
      <line x1="12"    y1="19"   x2="5.94"  y2="8.5"  stroke="#378ADD" strokeWidth="1.5" strokeLinecap="square" opacity="0.18" />

      {/* Hub spokes */}
      <line x1="12" y1="12" x2="12"    y2="5"    stroke="url(#ns-line)" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="12" y1="12" x2="18.06" y2="8.5"  stroke="url(#ns-line)" strokeWidth="1.5" strokeLinecap="square" opacity="0.5" />
      <line x1="12" y1="12" x2="18.06" y2="15.5" stroke="url(#ns-line)" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="12" y1="12" x2="12"    y2="19"   stroke="url(#ns-line)" strokeWidth="1.5" strokeLinecap="square" opacity="0.5" />
      <line x1="12" y1="12" x2="5.94"  y2="15.5" stroke="url(#ns-line)" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="12" y1="12" x2="5.94"  y2="8.5"  stroke="url(#ns-line)" strokeWidth="1.5" strokeLinecap="square" opacity="0.5" />

      {/* Satellite nodes */}
      <circle cx="12"    cy="5"    r="1.25"  fill="#7CC4F5" />
      <circle cx="18.06" cy="8.5"  r="0.875" fill="#5BADD9" />
      <circle cx="18.06" cy="15.5" r="1.25"  fill="#7CC4F5" />
      <circle cx="12"    cy="19"   r="0.875" fill="#5BADD9" />
      <circle cx="5.94"  cy="15.5" r="1.25"  fill="#7CC4F5" />
      <circle cx="5.94"  cy="8.5"  r="0.875" fill="#5BADD9" />

      <circle cx="12" cy="12" r="2.25"  stroke="url(#ns-hub)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="0.875" fill="#B5D4F4" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. THE CAREER GURU — Violet / Periwinkle
// ─────────────────────────────────────────────────────────────
export function CareerGuru({ size = 24, className = "", ...props }: { size?: number, className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="cg-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4ACFF" />
          <stop offset="100%" stopColor="#534AB7" />
        </linearGradient>
        <linearGradient id="cg-crown" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7F77DD" />
          <stop offset="100%" stopColor="#DDD8FF" />
        </linearGradient>
      </defs>

      {/* Crown trace */}
      <line x1="9" y1="5.5" x2="15" y2="5.5" stroke="url(#cg-crown)" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="10" y1="5.5" x2="10" y2="3.5" stroke="#AFA9EC" strokeWidth="1.5" strokeLinecap="square" opacity="0.65" />
      <line x1="12" y1="5.5" x2="12" y2="2.5" stroke="#C4BCFF" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="14" y1="5.5" x2="14" y2="3.5" stroke="#AFA9EC" strokeWidth="1.5" strokeLinecap="square" opacity="0.65" />
      <circle cx="10" cy="3.5" r="0.875" fill="#AFA9EC" opacity="0.7" />
      <circle cx="12" cy="2.5" r="1.1"   fill="#DDD8FF" />
      <circle cx="14" cy="3.5" r="0.875" fill="#AFA9EC" opacity="0.7" />

      {/* Head */}
      <path
        d="M7.5 19V10.5C7.5 7.5 9.5 5.5 12 5.5C14.5 5.5 16.5 7.5 16.5 10.5V19H7.5Z"
        stroke="url(#cg-head)"
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      <line x1="6" y1="19" x2="18" y2="19" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="square" />

      {/* Eyes */}
      <rect x="9.25" y="11.5" width="1.75" height="1.75" fill="#C4BCFF" />
      <rect x="13"   y="11.5" width="1.75" height="1.75" fill="#C4BCFF" />

      {/* Mouth */}
      <line x1="10.25" y1="15.5" x2="13.75" y2="15.5" stroke="#9490E0" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
