"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PhotoAsset, PhotoPermissions } from "@/lib/photo-revocation-demo/types";
import type { TimeLimitDuration } from "@/lib/photoModel";
import { PhotoPreview } from "./PhotoPreview";
import { PhotoStackGrid } from "./PhotoStackGrid";
import { ScrollWheelColumn } from "./ScrollWheelColumn";

export type ComposerViewProps = {
  draftPhotos: PhotoAsset[];
  draftCaption: string;
  onDraftCaptionChange: (value: string) => void;
  draftPermissions: PhotoPermissions;
  setDraftPermissions: Dispatch<SetStateAction<PhotoPermissions>>;
  draftTimeLimit: TimeLimitDuration;
  setDraftTimeLimit: Dispatch<SetStateAction<TimeLimitDuration>>;
  draftTimeLimitOpen: boolean;
  setDraftTimeLimitOpen: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  onSendConfiguredPhoto: () => void;
};

export function ComposerView({
  draftPhotos,
  draftCaption,
  onDraftCaptionChange,
  draftPermissions,
  setDraftPermissions,
  draftTimeLimit,
  setDraftTimeLimit,
  draftTimeLimitOpen,
  setDraftTimeLimitOpen,
  onClose,
  onSendConfiguredPhoto,
}: ComposerViewProps) {
  return (
    <div className="flex h-full flex-col bg-black -mx-4 -my-6 text-white">
      <div className="flex items-start gap-2 border-b border-white/10 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>
        <div role="alert" className="min-w-0 flex-1 pr-1">
          <p className="text-[13px] font-semibold leading-snug text-amber-300">
            Screenshots and saved copies cannot be undone.
          </p>
          <p className="mt-0.5 text-[12px] font-medium leading-snug text-amber-200/85">
            Revocation only limits future access in this chat. Another device can still photograph the screen.
          </p>
        </div>
      </div>

      <div className="flex max-h-[42vh] min-h-0 flex-1 items-center justify-center overflow-y-auto px-3 pt-2">
        <div className="w-full overflow-hidden rounded-lg border border-white/10">
          {draftPhotos.length > 1 ? (
            <PhotoStackGrid assets={draftPhotos} roundedTop={false} />
          ) : draftPhotos[0] ? (
            <PhotoPreview asset={draftPhotos[0]} />
          ) : null}
        </div>
      </div>

      <div className="space-y-2 px-3 pb-1 pt-3">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setDraftPermissions((p) => ({ ...p, viewOnce: !p.viewOnce }))} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${draftPermissions.viewOnce ? "bg-[#00a884] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
            {draftPermissions.viewOnce ? "① View once" : "View once"}
          </button>
          <button type="button" onClick={() => setDraftPermissions((p) => ({ ...p, canForward: !p.canForward }))} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${draftPermissions.canForward ? "bg-[#00a884] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
            {draftPermissions.canForward ? "↗ Forward" : "↗ No forward"}
          </button>
          <button type="button" onClick={() => setDraftPermissions((p) => ({ ...p, canDownload: !p.canDownload }))} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${draftPermissions.canDownload ? "bg-[#00a884] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
            {draftPermissions.canDownload ? "⬇ Download" : "⬇ No download"}
          </button>
          <button type="button" onClick={() => setDraftPermissions((p) => ({ ...p, hasCoSubject: !p.hasCoSubject }))} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${draftPermissions.hasCoSubject ? "bg-[#00a884] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
            {draftPermissions.hasCoSubject ? "👤 Co-subject" : "👤 Co-subject"}
          </button>
          <button type="button" onClick={() => setDraftTimeLimitOpen((o) => !o)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${draftTimeLimitOpen ? "bg-[#00a884] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
            {draftTimeLimitOpen ? "⏱ Time limit" : "⏱ No expiry"}
          </button>
        </div>
        {draftTimeLimitOpen ? (
          <div className="flex justify-center gap-1 pt-1">
            <ScrollWheelColumn min={0} max={99} value={draftTimeLimit.days} onChange={(d) => setDraftTimeLimit((p) => ({ ...p, days: d }))} label="D" />
            <ScrollWheelColumn min={0} max={23} value={draftTimeLimit.hours} onChange={(h) => setDraftTimeLimit((p) => ({ ...p, hours: h }))} label="H" />
            <ScrollWheelColumn min={0} max={59} value={draftTimeLimit.minutes} onChange={(m) => setDraftTimeLimit((p) => ({ ...p, minutes: m }))} label="M" />
            <ScrollWheelColumn min={0} max={59} value={draftTimeLimit.seconds} onChange={(s) => setDraftTimeLimit((p) => ({ ...p, seconds: s }))} label="S" />
          </div>
        ) : null}
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center rounded-full border border-white/20 bg-[#1a1a1a] px-4 py-2.5">
          <input
            value={draftCaption}
            onChange={(e) => onDraftCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 pb-3">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/50">
          {draftPhotos.length > 1 ? `${draftPhotos.length} photos` : "Recipient"}
        </span>
        <button
          type="button"
          onClick={onSendConfiguredPhoto}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] transition hover:bg-[#00c49a]"
          aria-label="Send photo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}
