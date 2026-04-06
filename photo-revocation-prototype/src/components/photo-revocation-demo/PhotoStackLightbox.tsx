"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import type { PhotoAsset } from "@/lib/photo-revocation-demo/types";
import { useChatPanelOverlay } from "./chatPanelPortalContext";
import { PhotoPreview } from "./PhotoPreview";

export type PhotoStackLightboxProps = {
  assets: PhotoAsset[];
  initialIndex: number;
  onClose: () => void;
};

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  return Math.min(len - 1, Math.max(0, i));
}

export function PhotoStackLightbox({
  assets,
  initialIndex,
  onClose,
}: PhotoStackLightboxProps) {
  const overlay = useChatPanelOverlay();
  const portalEl = overlay?.portalEl.current ?? null;
  const inPanel = portalEl != null;

  const [index, setIndex] = useState(() => clampIndex(initialIndex, assets.length));
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(clampIndex(initialIndex, assets.length));
  }, [initialIndex, assets.length]);

  useEffect(() => {
    if (overlay?.scrollEl.current) {
      const el = overlay.scrollEl.current;
      const prev = el.style.overflow;
      el.style.overflow = "hidden";
      return () => {
        el.style.overflow = prev;
      };
    }
    const prevBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
    };
  }, [overlay]);

  const go = useCallback(
    (delta: -1 | 1) => {
      setIndex((i) => clampIndex(i + delta, assets.length));
    },
    [assets.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowLeft") {
        go(-1);
      }
      if (e.key === "ArrowRight") {
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, go]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > 56) go(-1);
    else if (dx < -56) go(1);
  };

  if (assets.length === 0) {
    return null;
  }

  const current: PhotoAsset = assets[index];

  const rootClass = inPanel
    ? "absolute inset-0 z-0 flex flex-col bg-black/93 text-white pointer-events-auto"
    : "fixed inset-0 z-[200] flex flex-col bg-black/93 text-white";

  const imageShellClass = inPanel
    ? "max-h-full min-h-0 w-full flex-1 overflow-auto"
    : "max-h-[min(85dvh,820px)] w-full overflow-auto";

  const node = (
    <div
      className={rootClass}
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={onClose}
    >
      <div
        className="relative z-10 flex flex-shrink-0 items-center justify-between border-b border-white/10 px-3 py-3 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/10"
        >
          Close
        </button>
        <p className="text-sm font-medium text-white/80">
          {index + 1} / {assets.length}
        </p>
        <span className="w-[4.5rem] sm:w-20" aria-hidden />
      </div>

      <div
        className="relative z-10 flex min-h-0 flex-1 touch-pan-y items-center justify-center px-1 sm:px-4"
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative mx-10 flex min-h-0 w-full max-w-full flex-1 items-center justify-center sm:mx-16"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={index <= 0}
            onClick={() => go(-1)}
            className="absolute -left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl font-light text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-25 sm:-left-2 sm:h-11 sm:w-11"
            aria-label="Previous photo"
          >
            ‹
          </button>

          <div className={imageShellClass}>
            <PhotoPreview asset={current} fit="containMaxWidth" corners="all" />
          </div>

          <button
            type="button"
            disabled={index >= assets.length - 1}
            onClick={() => go(1)}
            className="absolute -right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl font-light text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-25 sm:-right-2 sm:h-11 sm:w-11"
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      </div>

      <p
        className="relative z-10 flex-shrink-0 px-4 pb-4 pt-2 text-center text-xs text-white/50"
        onClick={onClose}
      >
        Tap outside the photo, or swipe, or use the arrows. Press Esc to close.
      </p>
    </div>
  );

  if (portalEl) {
    return createPortal(node, portalEl);
  }

  return node;
}
