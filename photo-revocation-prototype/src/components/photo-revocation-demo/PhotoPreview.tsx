"use client";

import type { PhotoAsset } from "@/lib/photo-revocation-demo/types";

export type PhotoPreviewProps = {
  asset: PhotoAsset;
  /** `top`: only top radii (flush above caption). `none`: square grid cells. */
  corners?: "all" | "top" | "none";
  /**
   * `fill` — stretch/crop to the parent (grids, composer, thumbnails).
   * `containMaxWidth` — entire image visible, scaled to bubble width with light padding (message bubbles).
   */
  fit?: "fill" | "containMaxWidth";
};

export function PhotoPreview({
  asset,
  corners = "all",
  fit = "fill",
}: PhotoPreviewProps) {
  const cornerClass =
    corners === "top"
      ? "rounded-t-2xl rounded-b-none"
      : corners === "none"
        ? "rounded-none"
        : "rounded-2xl";

  const presetPlaceholder = (
    <div
      className={`flex h-full min-h-[200px] w-full items-end ${asset.previewClass ?? "bg-slate-600"} p-4`}
    >
      <div className="w-full rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
          Sample photo
        </p>
        <p className="mt-1 text-lg font-semibold text-white">{asset.label}</p>
      </div>
    </div>
  );

  if (asset.kind === "upload" && asset.previewUrl) {
    if (fit === "containMaxWidth") {
      return (
        <div
          className={`relative w-full overflow-hidden ${cornerClass} bg-[#111b21]`}
        >
          <div className="flex justify-center p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.previewUrl}
              alt={asset.label}
              className="h-auto max-h-[min(70dvh,520px)] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative h-full w-full overflow-hidden ${cornerClass} bg-[#dfe5e7]`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.previewUrl}
          alt={asset.label}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (fit === "containMaxWidth") {
    return (
      <div
        className={`relative w-full overflow-hidden ${cornerClass} bg-[#111b21]`}
      >
        <div className="p-1.5">{presetPlaceholder}</div>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${cornerClass} bg-[#dfe5e7]`}
    >
      {presetPlaceholder}
    </div>
  );
}
