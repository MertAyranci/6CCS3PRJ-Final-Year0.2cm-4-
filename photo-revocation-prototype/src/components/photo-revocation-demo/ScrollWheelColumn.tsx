"use client";

import { useEffect, useRef } from "react";
import { ROW_HEIGHT, WHEEL_VISIBLE_ROWS } from "@/lib/photo-revocation-demo/constants";

export type ScrollWheelColumnProps = {
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  label: string;
};

export function ScrollWheelColumn({ min, max, value, onChange, label }: ScrollWheelColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScroll = useRef(false);

  useEffect(() => {
    if (!scrollRef.current || !isUserScroll.current) {
      const clamped = Math.min(max, Math.max(min, value));
      scrollRef.current?.scrollTo({ top: (clamped - min) * ROW_HEIGHT, behavior: "auto" });
    }
    isUserScroll.current = false;
  }, [min, max, value]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / ROW_HEIGHT);
    const clamped = Math.min(max, Math.max(min, min + index));
    if (clamped !== value) {
      isUserScroll.current = true;
      onChange(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = value <= min ? max : value - 1;
      onChange(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = value >= max ? min : value + 1;
      onChange(next);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div
        className="relative overflow-hidden rounded-xl bg-slate-100"
        style={{ height: ROW_HEIGHT * WHEEL_VISIBLE_ROWS }}
      >
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none border-y border-slate-300/90 bg-white/30"
          style={{ top: ROW_HEIGHT, height: ROW_HEIGHT }}
          aria-hidden
        />
        <div
          ref={scrollRef}
          tabIndex={0}
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={label}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="scrollbar-hide overflow-y-auto overflow-x-hidden scroll-smooth outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-100 rounded-xl"
          style={{
            height: ROW_HEIGHT * WHEEL_VISIBLE_ROWS,
            scrollSnapType: "y mandatory",
            scrollPaddingTop: ROW_HEIGHT,
            scrollPaddingBottom: ROW_HEIGHT,
          }}
        >
          <div style={{ height: ROW_HEIGHT }} />
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
            <div
              key={n}
              className="flex items-center justify-center text-lg font-semibold tabular-nums text-slate-700"
              style={{
                height: ROW_HEIGHT,
                scrollSnapAlign: "center",
              }}
            >
              {n}
            </div>
          ))}
          <div style={{ height: ROW_HEIGHT }} />
        </div>
      </div>
    </div>
  );
}
