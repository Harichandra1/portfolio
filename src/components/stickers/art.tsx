/**
 * Original sticker artwork.
 *
 * Drawn here rather than sourced, for two reasons: the stickers on the site
 * that inspired this (a Nike Dunk, Chrome's dinosaur) are other people's
 * trademarked artwork and can't be reproduced — and a sticker lifted from
 * someone else's site says nothing about whose site this is. These are about
 * the person: the eval joke, the chai, the duck, the shell.
 *
 * Each draws into a 100×100 box. The die-cut edge and lift come from the
 * `.sticker` class in globals.css, applied by the wrapper — not from
 * anything in here — so the silhouette outline follows whatever shape the
 * art happens to be.
 */

/** The n=4 joke: the sample size from the agent's own honest benchmark. */
export function NEqualsFour() {
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      <rect
        x="8"
        y="26"
        width="84"
        height="48"
        rx="10"
        fill="var(--sticker-red)"
        transform="rotate(-2 50 50)"
      />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-hand"
        fontSize="34"
        fontWeight="700"
        fill="var(--sticker-edge)"
        transform="rotate(-2 50 50)"
      >
        n=4
      </text>
    </svg>
  );
}

/** Cutting chai, the Hyderabad desk default. */
export function Chai() {
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      {/* steam */}
      <g
        fill="none"
        stroke="var(--sticker-ink)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.55"
      >
        <path d="M42 30c-4-5 4-8 0-13" />
        <path d="M56 28c-4-5 4-9 0-14" />
      </g>
      {/* glass */}
      <path
        d="M31 40h38l-6 42a5 5 0 0 1-5 4H42a5 5 0 0 1-5-4z"
        fill="var(--sticker-cream)"
        stroke="var(--sticker-ink)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* tea */}
      <path
        d="M33 45h34l-5 35a4 4 0 0 1-4 3H42a4 4 0 0 1-4-3z"
        fill="var(--sticker-amber)"
      />
      {/* rim */}
      <path
        d="M31 40h38"
        stroke="var(--sticker-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The debugging duck. */
export function Duck() {
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      {/* tail */}
      <path d="M22 58L6 48l18 22z" fill="var(--sticker-yellow)" />
      {/* body */}
      <ellipse cx="44" cy="66" rx="26" ry="16" fill="var(--sticker-yellow)" />
      {/* head, overlapping the body just enough to read as one silhouette */}
      <circle cx="66" cy="40" r="13" fill="var(--sticker-yellow)" />
      {/* beak */}
      <path d="M77 36l16 4-16 5z" fill="var(--sticker-orange)" />
      {/* wing */}
      <path d="M32 64q12-9 24 0-12 8-24 0z" fill="var(--sticker-amber)" opacity="0.75" />
      {/* eye */}
      <circle cx="69" cy="36" r="2.8" fill="var(--sticker-ink)" />
    </svg>
  );
}

/** A shell prompt, blinking cursor and all. */
export function Terminal() {
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      <rect x="10" y="24" width="80" height="54" rx="8" fill="var(--sticker-ink)" />
      <g fill="var(--sticker-cream)" opacity="0.5">
        <circle cx="21" cy="34" r="2.6" />
        <circle cx="30" cy="34" r="2.6" />
        <circle cx="39" cy="34" r="2.6" />
      </g>
      <path
        d="M14 42h72"
        stroke="var(--sticker-cream)"
        strokeWidth="1.5"
        opacity="0.25"
      />
      <text
        x="22"
        y="62"
        className="font-mono"
        fontSize="21"
        fontWeight="700"
        fill="var(--sticker-green)"
      >
        $
      </text>
      <rect x="38" y="50" width="13" height="16" rx="1.5" fill="var(--sticker-green)" />
    </svg>
  );
}

/** A book, for the shelf. */
export function BookSticker() {
  return (
    <svg viewBox="0 0 100 100" className="size-full">
      <path
        d="M18 24h27a8 8 0 0 1 5 2 8 8 0 0 1 5-2h27v52H55a5 5 0 0 0-5 4 5 5 0 0 0-5-4H18z"
        fill="var(--sticker-cream)"
        stroke="var(--sticker-ink)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M50 28v52" stroke="var(--sticker-ink)" strokeWidth="4" />
      <g
        stroke="var(--sticker-ink)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      >
        <path d="M26 40h16M26 48h16M26 56h11" />
        <path d="M58 40h16M58 48h16M58 56h11" />
      </g>
    </svg>
  );
}
