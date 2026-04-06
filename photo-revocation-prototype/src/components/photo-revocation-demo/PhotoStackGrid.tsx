"use client";

import type { PhotoAsset } from "@/lib/photo-revocation-demo/types";
import { PhotoPreview } from "./PhotoPreview";

function StackSquare({
  asset,
  assetIndex,
  onPhotoClick,
}: {
  asset: PhotoAsset;
  assetIndex: number;
  onPhotoClick?: (index: number) => void;
}) {
  const inner = (
    <div className="pointer-events-none relative aspect-square w-full min-h-0 overflow-hidden bg-[#111b21]">
      <PhotoPreview asset={asset} fit="fill" corners="none" />
    </div>
  );

  if (!onPhotoClick) {
    return inner;
  }

  return (
    <button
      type="button"
      onClick={() => onPhotoClick(assetIndex)}
      className="block w-full cursor-zoom-in p-0 text-left outline-none ring-emerald-500/50 focus-visible:ring-2"
      aria-label={`View photo ${assetIndex + 1} full size`}
    >
      {inner}
    </button>
  );
}

export type PhotoStackGridProps = {
  assets: PhotoAsset[];
  /** Rounded top to align with message bubble (chat). Omit for composer inset. */
  roundedTop?: boolean;
  /** When set, each tile opens the in-chat gallery at that index. */
  onPhotoClick?: (index: number) => void;
};

/**
 * WhatsApp-style collage: 2×2 when there are at least four items, with +N on the last tile when there are more than four.
 */
export function PhotoStackGrid({
  assets,
  roundedTop = true,
  onPhotoClick,
}: PhotoStackGridProps) {
  const n = assets.length;
  if (n < 2) {
    return null;
  }

  const shell = `w-full min-w-0 overflow-hidden bg-[#111b21] ${roundedTop ? "rounded-t-2xl" : "rounded-lg"}`;

  if (n === 2) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 ${shell}`}>
        <StackSquare asset={assets[0]} assetIndex={0} onPhotoClick={onPhotoClick} />
        <StackSquare asset={assets[1]} assetIndex={1} onPhotoClick={onPhotoClick} />
      </div>
    );
  }

  if (n === 3) {
    const wide = onPhotoClick ? (
      <button
        type="button"
        onClick={() => onPhotoClick(2)}
        className="relative block aspect-[2/1] w-full cursor-zoom-in overflow-hidden bg-[#111b21] p-0 text-left outline-none ring-emerald-500/50 focus-visible:ring-2"
        aria-label="View photo 3 full size"
      >
        <div className="pointer-events-none h-full w-full">
          <PhotoPreview asset={assets[2]} fit="fill" corners="none" />
        </div>
      </button>
    ) : (
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#111b21]">
        <PhotoPreview asset={assets[2]} fit="fill" corners="none" />
      </div>
    );

    return (
      <div className={`grid grid-cols-2 gap-0.5 ${shell}`}>
        <StackSquare asset={assets[0]} assetIndex={0} onPhotoClick={onPhotoClick} />
        <StackSquare asset={assets[1]} assetIndex={1} onPhotoClick={onPhotoClick} />
        <div className="col-span-2 min-h-0">{wide}</div>
      </div>
    );
  }

  const extraOverFour = n - 4;

  const fourth = onPhotoClick ? (
    <button
      type="button"
      onClick={() => onPhotoClick(3)}
      className="relative aspect-square w-full min-h-0 cursor-zoom-in overflow-hidden bg-[#111b21] p-0 text-left outline-none ring-emerald-500/50 focus-visible:ring-2"
      aria-label="View photo 4 full size"
    >
      <div className="pointer-events-none h-full w-full">
        <PhotoPreview asset={assets[3]} fit="fill" corners="none" />
      </div>
      {extraOverFour > 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55">
          <span className="text-xl font-semibold text-white drop-shadow-sm sm:text-2xl">
            +{extraOverFour}
          </span>
        </div>
      ) : null}
    </button>
  ) : (
    <div className="relative aspect-square w-full min-h-0 overflow-hidden bg-[#111b21]">
      <PhotoPreview asset={assets[3]} fit="fill" corners="none" />
      {extraOverFour > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55">
          <span className="text-xl font-semibold text-white drop-shadow-sm sm:text-2xl">
            +{extraOverFour}
          </span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={`grid grid-cols-2 gap-0.5 ${shell}`}>
      <StackSquare asset={assets[0]} assetIndex={0} onPhotoClick={onPhotoClick} />
      <StackSquare asset={assets[1]} assetIndex={1} onPhotoClick={onPhotoClick} />
      <StackSquare asset={assets[2]} assetIndex={2} onPhotoClick={onPhotoClick} />
      {fourth}
    </div>
  );
}
