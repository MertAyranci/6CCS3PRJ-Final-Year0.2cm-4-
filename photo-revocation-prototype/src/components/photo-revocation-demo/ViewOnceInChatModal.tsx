"use client";

import { createPortal } from "react-dom";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import type {
  ConversationThread,
  OpenViewOnceState,
  Participant,
  PhotoMessage,
} from "@/lib/photo-revocation-demo/types";
import { useChatPanelOverlay } from "./chatPanelPortalContext";
import { PhotoPreview } from "./PhotoPreview";

export type ViewOnceInChatModalProps = {
  phoneOwner: Participant;
  thread: ConversationThread;
  openViewOnce: OpenViewOnceState | null;
  openViewOnceMessage: PhotoMessage | null;
  setOpenViewOnce: Dispatch<SetStateAction<OpenViewOnceState | null>>;
  setConsumedViewOnce: Dispatch<SetStateAction<number[]>>;
};

function shouldMarkConsumed(owner: Participant): boolean {
  return (
    owner === "recipient" || owner === "forwardedRecipient" || owner === "coOwner"
  );
}

export function ViewOnceInChatModal({
  phoneOwner,
  thread,
  openViewOnce,
  openViewOnceMessage,
  setOpenViewOnce,
  setConsumedViewOnce,
}: ViewOnceInChatModalProps) {
  const overlay = useChatPanelOverlay();
  const portalTarget = overlay?.portalEl.current ?? null;
  const inPanel = portalTarget != null;

  const show =
    openViewOnce != null &&
    openViewOnce.owner === phoneOwner &&
    openViewOnce.thread === thread &&
    openViewOnceMessage != null;

  useEffect(() => {
    if (!show) return;
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
  }, [show, overlay]);

  if (!show || !openViewOnce || !openViewOnceMessage) {
    return null;
  }

  const close = () => {
    if (shouldMarkConsumed(openViewOnce.owner)) {
      setConsumedViewOnce((current) =>
        current.includes(openViewOnce.messageId)
          ? current
          : [...current, openViewOnce.messageId],
      );
    }
    setOpenViewOnce(null);
  };

  const title =
    openViewOnce.owner === "sender"
      ? "Sender preview"
      : openViewOnce.owner === "coOwner"
        ? "Co-subject view once"
        : "Recipient view once";

  const subtitle =
    openViewOnce.owner === "recipient" ||
    openViewOnce.owner === "forwardedRecipient" ||
    openViewOnce.owner === "coOwner"
      ? "Close the photo to continue messaging. It will not reopen."
      : "Close the photo to return to the chat.";

  const rootClass = inPanel
    ? "absolute inset-0 z-0 flex flex-col bg-black/93 pointer-events-auto"
    : "fixed inset-0 z-[200] flex flex-col bg-black/93";

  const node = (
    <div
      className={rootClass}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={close}
    >
      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col px-2 py-2 sm:px-4 sm:py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-1 py-2 text-white sm:px-2 sm:py-4">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-slate-300">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>

        <div className="relative mt-1 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#111b21] p-2 sm:rounded-[2rem]">
          {openViewOnceMessage.assets.length > 1 ? (
            <div className="flex flex-col gap-3">
              {openViewOnceMessage.assets.map((a) => (
                <PhotoPreview key={a.id} asset={a} fit="containMaxWidth" corners="all" />
              ))}
            </div>
          ) : (
            <PhotoPreview
              asset={openViewOnceMessage.assets[0]}
              fit="containMaxWidth"
              corners="all"
            />
          )}
        </div>
      </div>
    </div>
  );

  if (portalTarget) {
    return createPortal(node, portalTarget);
  }

  return createPortal(node, document.body);
}
