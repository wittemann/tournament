'use client';

import { useId } from 'react';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Spoken name when the visible label is short ("3" -> "Halle 3"). */
  ariaLabel?: string;
  /** Short options (hall numbers): condensed 18 px font, shrink before text options do. */
  compact?: boolean;
};

type Props<T extends string> = {
  /** Shared by the radio inputs; defaults to a generated id. */
  name?: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
} & (
  | { label: string; ariaLabel?: string }
  | { label?: undefined; ariaLabel: string }
);

/**
 * Filter switch: a grey track with the selected option as a white pill.
 * Native radio inputs (visually hidden) give a radio group with arrow-key
 * navigation; the optional uppercase label sits in a fixed-width column so
 * several rows line up.
 */
export default function SegmentedControl<T extends string>({
  name,
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: Props<T>) {
  const labelId = useId();
  const groupName = useId();
  // Text options keep their full text (1.4fr); compact ones shrink.
  const columns = options
    .map((o) => (o.compact ? 'minmax(0, 1fr)' : 'minmax(0, 1.4fr)'))
    .join(' ');

  return (
    <div className="flex items-center gap-2.5">
      {label && (
        <span
          id={labelId}
          className="w-[52px] flex-none text-xs font-bold tracking-[0.8px] text-muted uppercase"
        >
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        style={{ gridTemplateColumns: columns }}
        className="grid min-w-0 flex-1 gap-1 rounded-control bg-base-300 p-1"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={`relative flex h-10 min-w-0 cursor-pointer items-center justify-center rounded-[9px] transition-[color,background-color,box-shadow] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                option.compact
                  ? 'font-display text-lg font-bold'
                  : 'text-[15px]'
              } ${
                selected
                  ? 'bg-base-100 font-bold text-base-content shadow-[0_1px_2px_rgba(20,32,25,0.15)]'
                  : `text-muted-2 ${option.compact ? '' : 'font-semibold'}`
              }`}
            >
              <input
                type="radio"
                name={name ?? groupName}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                aria-label={option.ariaLabel}
                className="sr-only"
              />
              <span className="truncate">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
