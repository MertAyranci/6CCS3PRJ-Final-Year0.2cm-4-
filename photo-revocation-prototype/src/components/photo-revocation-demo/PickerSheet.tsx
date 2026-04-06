"use client";

import type { RefObject } from "react";
import type { PhotoAsset } from "@/lib/photo-revocation-demo/types";
import { presetAlbum } from "@/lib/photo-revocation-demo/constants";
import { PhotoPreview } from "./PhotoPreview";

export type PickerSheetProps = {
  pickerSelectedPhotos: PhotoAsset[];
  togglePickerPhoto: (asset: PhotoAsset) => void;
  onClose: () => void;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  albumInputRef: RefObject<HTMLInputElement | null>;
  onSendPhotoDirectly: () => void;
  onOpenComposerWithPhotos: () => void;
};

function selectionIndex(photos: PhotoAsset[], asset: PhotoAsset): number {
  return photos.findIndex((p) => p.id === asset.id);
}

export function PickerSheet({
  pickerSelectedPhotos,
  togglePickerPhoto,
  onClose,
  cameraInputRef,
  albumInputRef,
  onSendPhotoDirectly,
  onOpenComposerWithPhotos,
}: PickerSheetProps) {
  const count = pickerSelectedPhotos.length;
  const hasSelection = count > 0;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black text-white">
      <div className="flex items-center justify-between bg-[#1b1b1b] px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] text-white/80 hover:text-white"
        >
          Cancel
        </button>
        <div className="flex overflow-hidden rounded-full bg-white/10 text-[12px]">
          <span className="bg-white/20 px-3 py-0.5 font-medium text-white">Photos</span>
          <span className="px-3 py-0.5 text-white/50">Albums</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label="Open camera"
          >
            📷
          </button>
          <button
            type="button"
            onClick={() => albumInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm hover:bg-white/20"
            aria-label="Choose from files"
          >
            📁
          </button>
        </div>
      </div>

      <p className="border-b border-white/5 bg-[#1b1b1b] px-3 pb-2 text-[11px] text-white/50">
        Tap photos to select several, then send as one message.
      </p>

      <div className="max-h-[340px] overflow-y-auto">
        <div className="grid grid-cols-3 gap-[2px]">
          {presetAlbum.map((asset) => {
            const idx = selectionIndex(pickerSelectedPhotos, asset);
            const selected = idx >= 0;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => togglePickerPhoto(asset)}
                className="relative aspect-square overflow-hidden"
              >
                <PhotoPreview asset={asset} />
                {selected ? (
                  <div className="absolute inset-0 border-[3px] border-[#00a884]" />
                ) : null}
                {selected ? (
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00a884] px-1 text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {hasSelection ? (
        <div className="border-t border-white/10 bg-[#1b1b1b] px-3 py-2.5">
          <p className="text-xs font-medium text-white/70">
            {count === 1 ? "1 photo selected" : `${count} photos selected`}
          </p>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {pickerSelectedPhotos.map((p) => (
              <div
                key={p.id}
                className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10"
              >
                <PhotoPreview asset={p} />
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={onSendPhotoDirectly}
              className="flex-1 rounded-full border border-white/15 bg-white/5 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              Send
            </button>
            <button
              type="button"
              onClick={onOpenComposerWithPhotos}
              className="flex-1 rounded-full bg-[#00a884] py-2 text-[13px] font-semibold text-white transition hover:bg-[#00c49a]"
            >
              Send with revocable permissions
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
