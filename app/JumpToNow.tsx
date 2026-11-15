'use client';

import { useEffect, useState } from 'react';
import { jumpDirection, type JumpDirection } from '@/lib/jumpToNow';

/**
 * Small floating "Jetzt" pill that scrolls to the "Jetzt" line. Shown only
 * while the line element exists and is outside the viewport; the arrow points
 * toward it. Never scrolls on its own.
 */
export default function JumpToNow({ target }: { target: HTMLElement | null }) {
  // Tagged with the element it was observed on, so a stale value from a
  // previous target is never shown.
  const [seen, setSeen] = useState<{
    el: HTMLElement;
    dir: JumpDirection;
  } | null>(null);

  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      setSeen({
        el: target,
        dir: jumpDirection({
          isIntersecting: entry.isIntersecting,
          top: entry.boundingClientRect.top,
        }),
      });
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  const direction = seen?.el === target ? seen.dir : null;
  if (!target || !direction) return null;

  function jump() {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    target?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'center',
    });
    // Move keyboard / screen-reader focus to the line without another scroll.
    target?.focus({ preventScroll: true });
  }

  return (
    // Fixed to the viewport bottom, but centred inside the phone column.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 pb-4">
      <div className="mx-auto flex max-w-[480px] justify-center px-4">
        <button
          type="button"
          onClick={jump}
          aria-label={`Jetzt – nach ${direction === 'up' ? 'oben' : 'unten'} zum aktuellen Spiel`}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-live px-5 text-[15px] font-bold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-live"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className={`size-4 ${direction === 'down' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
          </svg>
          Jetzt
        </button>
      </div>
    </div>
  );
}
