"use client";

import { useState } from "react";
import type {
  ChatMessage,
  ConversationThread,
  OpenPhotoMenuState,
  Participant,
  PhotoMessage,
  PhotoPermissions,
  ReplyingToState,
  RevocationRequestOpenState,
  AccessRequestOpenState,
} from "@/lib/photo-revocation-demo/types";
import {
  formatExpiryCountdown,
  getEffectivePermissions,
  getSourcePolicyPermissions,
  getStatusLabel,
  isViewOnceConsumedForSourcePhoto,
  photoMessageDisplayLabel,
  triggerPhotoDownloads,
} from "@/lib/photo-revocation-demo/helpers";
import { PhotoPreview } from "./PhotoPreview";
import { PhotoStackGrid } from "./PhotoStackGrid";
import { PhotoStackLightbox } from "./PhotoStackLightbox";
import { ViewOnceSingleTick } from "./ViewOnceSingleTick";

export type PhotoMessageBubbleProps = {
  message: PhotoMessage;
  phoneOwner: Participant;
  timestampTone: string;
  thread: ConversationThread;
  mainMessages: ChatMessage[];
  forwardedMessages: ChatMessage[];
  consumedViewOnce: number[];
  openPhotoMenu: OpenPhotoMenuState | null;
  setOpenPhotoMenu: (v: OpenPhotoMenuState | null) => void;
  setSelectedPhotoId: (id: number | null) => void;
  setOpenViewOnce: (v: { owner: Participant; thread: ConversationThread; messageId: number } | null) => void;
  forwardPhotoMessage: (message: PhotoMessage) => void;
  updateSelectedPhotoPermissions: (updates: Partial<PhotoPermissions>) => void;
  setTimeLimitModalOpen: (v: boolean) => void;
  setReplyingTo: (v: ReplyingToState | null) => void;
  setRevocationRequestOpen: (v: RevocationRequestOpenState | null) => void;
  setRevocationRequestDraft: (v: string) => void;
  setAccessRequestOpen: (v: AccessRequestOpenState | null) => void;
  setAccessRequestDraft: (v: string) => void;
};

export function PhotoMessageBubble({
  message,
  phoneOwner,
  timestampTone,
  thread,
  mainMessages,
  forwardedMessages,
  consumedViewOnce,
  openPhotoMenu,
  setOpenPhotoMenu,
  setSelectedPhotoId,
  setOpenViewOnce,
  forwardPhotoMessage,
  updateSelectedPhotoPermissions,
  setTimeLimitModalOpen,
  setReplyingTo,
  setRevocationRequestOpen,
  setRevocationRequestDraft,
  setAccessRequestOpen,
  setAccessRequestDraft,
}: PhotoMessageBubbleProps) {
  const [permissionDetailsOpen, setPermissionDetailsOpen] = useState(false);
  const [stackGalleryIndex, setStackGalleryIndex] = useState<number | null>(null);

  const effectivePermissions = getEffectivePermissions(mainMessages, message);
  const policyForChips = getSourcePolicyPermissions(mainMessages, message);
  const accessActive = effectivePermissions.status === "active";
  const canViewPhoto = phoneOwner === "sender" || accessActive;
  const recipientSideViewer =
    phoneOwner === "recipient" || phoneOwner === "forwardedRecipient" || phoneOwner === "coOwner";
  const hasRecipientConsumed =
    recipientSideViewer && consumedViewOnce.includes(message.id);

  const recipientOpenedViewOnce =
    phoneOwner === "sender" &&
    message.sender === "sender" &&
    thread === "main" &&
    policyForChips.viewOnce &&
    isViewOnceConsumedForSourcePhoto(
      mainMessages,
      forwardedMessages,
      consumedViewOnce,
      message.sourcePhotoId,
    );

  const forwardChipPositive = accessActive && policyForChips.canForward;
  const downloadChipPositive = accessActive && policyForChips.canDownload;

  const statusChipText = getStatusLabel(effectivePermissions.status);
  const forwardChipText = !accessActive
    ? "No forwarding"
    : policyForChips.canForward
      ? "Forwarding allowed"
      : "No forwarding";
  const downloadChipText = !accessActive
    ? "Download blocked"
    : policyForChips.canDownload
      ? "Download allowed"
      : "Download blocked";
  const reviewChipLabel = !accessActive
    ? policyForChips.viewOnce
      ? "View once unavailable"
      : "Not reviewable"
    : policyForChips.viewOnce
      ? "View once"
      : "Reviewable later";
  const reviewChipPositive = accessActive;

  const openFullScreenViewOnce = () => {
    if (!accessActive || !canViewPhoto || hasRecipientConsumed) {
      return;
    }

    setOpenViewOnce({
      owner: phoneOwner,
      thread,
      messageId: message.id,
    });
  };

  const isCurrentMenuOpen =
    openPhotoMenu?.messageId === message.id &&
    openPhotoMenu.thread === thread &&
    openPhotoMenu.owner === phoneOwner;
  const forwardAvailable =
    accessActive &&
    effectivePermissions.canForward &&
    ((phoneOwner === "recipient" &&
      thread === "main" &&
      message.sender !== phoneOwner &&
      !hasRecipientConsumed) ||
      (phoneOwner === "sender" && thread === "main") ||
      (phoneOwner === "forwardedRecipient" &&
        thread === "forwarded" &&
        message.sender !== phoneOwner &&
        !hasRecipientConsumed));

  const isCoSubjectCard = phoneOwner === "coOwner" && policyForChips.hasCoSubject;

  const openCoSubjectPhoto = () => {
    if (!accessActive) return;
    setOpenViewOnce({
      owner: "coOwner",
      thread,
      messageId: message.id,
    });
  };

  const photoContent = isCoSubjectCard ? (
    <div className="space-y-2 px-3 pb-3 pt-3">
      <button
        type="button"
        onClick={openCoSubjectPhoto}
        disabled={!accessActive}
        className={`flex w-full flex-col items-center justify-center rounded-2xl border border-white/15 px-4 py-6 text-left transition ${
          accessActive
            ? "bg-amber-500/20 hover:bg-amber-500/30"
            : "cursor-not-allowed bg-white/5 opacity-70"
        }`}
      >
        <span className="rounded-full bg-amber-400/30 px-4 py-2 text-2xl" aria-hidden>
          👤
        </span>
        <p className="mt-3 text-sm font-semibold text-white">
          You are depicted in this photo
        </p>
        <p className="mt-1 text-xs text-emerald-100/90">
          {accessActive
            ? "Tap to view the photo."
            : "Access has been revoked."}
        </p>
      </button>
      <p className="text-xs text-slate-400">
        You have been notified that you appear in this photo. You can request the sender
        to revoke it.
      </p>
      <p className="text-[11px] text-slate-500" role="note">
        Protection is in-app only; screenshots and prior viewing cannot be fully undone.
      </p>
    </div>
  ) : policyForChips.viewOnce ? (
    <div className="w-full px-3 pt-3">
      {recipientOpenedViewOnce ? (
      <button
        type="button"
        onClick={openFullScreenViewOnce}
        className="w-full overflow-hidden rounded-xl border border-white/25 bg-black/18 px-4 py-4 text-left shadow-inner shadow-black/10 transition hover:border-white/35 hover:bg-black/24"
        aria-label="View once photo was opened; tap to preview your copy"
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/95">Photo was viewed by recipient.</p>
          <p className="text-xs text-white/70">Tap to preview your copy.</p>
        </div>
      </button>
    ) : hasRecipientConsumed && recipientSideViewer ? (
      <div
        className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#222d34] px-4 py-4 text-center"
        role="group"
        aria-label="View once photo already opened"
      >
        <p className="text-sm font-medium text-slate-300">Opened once</p>
        <p className="text-xs text-slate-500">This photo can no longer be viewed.</p>
      </div>
    ) : !canViewPhoto && recipientSideViewer ? (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#08352d] p-6 text-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/70">
            Access changed
          </p>
          <p className="mt-2 text-lg font-semibold">This photo is no longer visible.</p>
          <p className="mt-2 text-[11px] text-emerald-100/60">
            Screenshots, saved copies, or prior viewing may already exist.
          </p>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={openFullScreenViewOnce}
        disabled={!canViewPhoto || hasRecipientConsumed}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
          !canViewPhoto || hasRecipientConsumed
            ? "cursor-not-allowed border-white/10 bg-white/5 opacity-60"
            : "border-emerald-500/30 bg-white/10 hover:border-emerald-400/45 hover:bg-white/[0.12]"
        }`}
      >
        <span className="text-sm font-medium text-white">View once</span>
        <span className="rounded-lg bg-emerald-500/35 px-3 py-1 text-xs font-semibold text-emerald-100">
          Open
        </span>
      </button>
    )}
    </div>
  ) : canViewPhoto ? (
    message.assets.length > 1 ? (
      <PhotoStackGrid
        assets={message.assets}
        roundedTop
        onPhotoClick={(i) => setStackGalleryIndex(i)}
      />
    ) : (
      <button
        type="button"
        onClick={() => setStackGalleryIndex(0)}
        className="w-full min-w-0 cursor-zoom-in rounded-t-2xl p-0 text-left outline-none ring-emerald-500/50 focus-visible:ring-2"
        aria-label="View photo full size"
      >
        <PhotoPreview
          asset={message.assets[0]}
          corners="top"
          fit="containMaxWidth"
        />
      </button>
    )
  ) : (
    <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#08352d] p-6 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/70">
          Access changed
        </p>
        <p className="mt-2 text-lg font-semibold">This photo is no longer visible.</p>
        <p className="mt-2 text-[11px] text-emerald-100/60">
          Screenshots, saved copies, or prior viewing may already exist.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="group relative">
        {photoContent}
        <div
          className={
            isCurrentMenuOpen
              ? "absolute left-2 top-2 z-20 opacity-100 transition-opacity duration-200"
              : "pointer-events-none absolute left-2 top-2 z-20 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
          }
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isCurrentMenuOpen) {
                  setOpenPhotoMenu(null);
                  return;
                }

                setSelectedPhotoId(message.sourcePhotoId);
                setOpenPhotoMenu({
                  messageId: message.id,
                  thread,
                  owner: phoneOwner,
                  mode: "actions",
                });
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-[10px] font-semibold leading-none text-white shadow-sm backdrop-blur-sm transition hover:bg-black/55"
              aria-label="Open photo options"
              aria-expanded={isCurrentMenuOpen}
            >
              ▾
            </button>

            {isCurrentMenuOpen ? (
              <div className="absolute left-0 top-8 z-30 w-56 rounded-2xl border border-white/10 bg-[#4d4f55]/95 p-2 text-sm text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
                {openPhotoMenu.mode === "actions" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo({
                          owner: phoneOwner,
                          messageId: message.id,
                          thread,
                          assetLabel: photoMessageDisplayLabel(message),
                          asset: message.assets[0],
                        });
                        setOpenPhotoMenu(null);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (forwardAvailable) {
                          forwardPhotoMessage(message);
                        }
                        setOpenPhotoMenu(null);
                      }}
                      disabled={!forwardAvailable}
                      className={`w-full rounded-xl px-3 py-2 text-left transition ${
                        forwardAvailable
                          ? "hover:bg-white/10"
                          : "cursor-not-allowed text-white/45"
                      }`}
                    >
                      Forward
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerPhotoDownloads(message.assets);
                        setOpenPhotoMenu(null);
                      }}
                      disabled={
                        !accessActive ||
                        !effectivePermissions.canDownload ||
                        (phoneOwner !== "sender" && !canViewPhoto)
                      }
                      className={`w-full rounded-xl px-3 py-2 text-left transition ${
                        accessActive &&
                        effectivePermissions.canDownload &&
                        (phoneOwner === "sender" || canViewPhoto)
                          ? "hover:bg-white/10"
                          : "cursor-not-allowed text-white/45"
                      }`}
                    >
                      Download
                    </button>
                    {phoneOwner === "sender" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPhotoMenu({
                            messageId: message.id,
                            thread,
                            owner: phoneOwner,
                            mode: "revoke",
                          })
                        }
                        className="w-full whitespace-nowrap rounded-xl px-3 py-2 text-left text-[13px] transition hover:bg-white/10"
                      >
                        Revocation permissions
                      </button>
                    ) : phoneOwner === "coOwner" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRevocationRequestOpen({
                            assetLabel: photoMessageDisplayLabel(message),
                            sourcePhotoId: message.sourcePhotoId,
                          });
                          setRevocationRequestDraft("");
                          setOpenPhotoMenu(null);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                      >
                        Request revocation
                      </button>
                    ) : phoneOwner === "recipient" && !accessActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAccessRequestOpen({
                            messageId: message.id,
                            thread,
                            owner: phoneOwner,
                            assetLabel: photoMessageDisplayLabel(message),
                            sourcePhotoId: message.sourcePhotoId,
                          });
                          setAccessRequestDraft("");
                          setOpenPhotoMenu(null);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                      >
                        Request access
                      </button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const isExpired =
                          effectivePermissions.expiresAt != null &&
                          Date.now() >= effectivePermissions.expiresAt;
                        updateSelectedPhotoPermissions({
                          status: accessActive ? "revoked" : "active",
                          ...(isExpired ? { expiresAt: null } : {}),
                        });
                        setOpenPhotoMenu(null);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      {accessActive
                        ? "Revoke photo access"
                        : "Restore photo access"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSelectedPhotoPermissions({
                          canForward: !effectivePermissions.canForward,
                        });
                        setOpenPhotoMenu(null);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      {effectivePermissions.canForward
                        ? "Block forwarding"
                        : "Allow forwarding"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSelectedPhotoPermissions({
                          canDownload: !effectivePermissions.canDownload,
                        });
                        setOpenPhotoMenu(null);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      {effectivePermissions.canDownload ? "Block download" : "Allow download"}
                    </button>
                    {effectivePermissions.expiresAt != null ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedPhotoPermissions({ expiresAt: null });
                          setOpenPhotoMenu(null);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                      >
                        Remove time limit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPhotoMenu(null);
                        setTimeLimitModalOpen(true);
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                    >
                      Set time limit
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2 px-3">
        <button
          type="button"
          onClick={() => setPermissionDetailsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left transition hover:bg-white/10"
          aria-expanded={permissionDetailsOpen}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className="inline-flex shrink-0 gap-0.5 font-mono text-[10px] leading-none text-emerald-100/90"
              aria-hidden
            >
              <span
                title={statusChipText}
                className={accessActive ? "text-emerald-300" : "text-red-400"}
              >
                {accessActive ? "✓" : "✗"}
              </span>
              <span
                title={forwardChipText}
                className={forwardChipPositive ? "text-emerald-300" : "text-red-400"}
              >
                {forwardChipPositive ? "✓" : "✗"}
              </span>
              <span
                title={reviewChipLabel}
                className={reviewChipPositive ? "text-emerald-300" : "text-red-400"}
              >
                {reviewChipPositive ? "✓" : "✗"}
              </span>
              <span
                title={downloadChipText}
                className={downloadChipPositive ? "text-emerald-300" : "text-red-400"}
              >
                {downloadChipPositive ? "✓" : "✗"}
              </span>
              {policyForChips.expiresAt != null ? (
                <span
                  title={formatExpiryCountdown(policyForChips.expiresAt)}
                  className="text-emerald-300"
                >
                  ⏱
                </span>
              ) : null}
            </span>
            <span className="truncate text-[11px] text-emerald-100/85">
              {permissionDetailsOpen
                ? "Hide permission details"
                : "Show permission details"}
            </span>
          </span>
          <span className="shrink-0 text-[11px] text-emerald-200/70" aria-hidden>
            {permissionDetailsOpen ? "▾" : "▸"}
          </span>
        </button>

        {permissionDetailsOpen ? (
          <div className="flex flex-wrap gap-1.5 text-[10px] leading-tight">
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              {statusChipText}
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              {forwardChipText}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
                accessActive &&
                (recipientOpenedViewOnce || hasRecipientConsumed) &&
                policyForChips.viewOnce
                  ? "border border-[#53bdeb]/35 bg-[#53bdeb]/10 text-[10px] font-medium text-sky-200/90"
                  : "bg-white/15"
              }`}
            >
              {!accessActive ? (
                policyForChips.viewOnce ? (
                  "View once unavailable"
                ) : (
                  "Not reviewable"
                )
              ) : policyForChips.viewOnce ? (
                recipientOpenedViewOnce || hasRecipientConsumed ? (
                  <>
                    <span>View once</span>
                    <ViewOnceSingleTick />
                  </>
                ) : (
                  "View once"
                )
              ) : (
                "Reviewable later"
              )}
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              {downloadChipText}
            </span>
            {policyForChips.expiresAt != null ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5">
                {formatExpiryCountdown(policyForChips.expiresAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-3 px-3 text-sm text-emerald-50">
        {accessActive
          ? message.caption
          : "Access has been revoked for the recipient device."}
      </p>
      <p className="mt-1 px-3 text-[11px] text-emerald-100/60">
        Screenshots, saved copies, or prior viewing may already exist.
      </p>

      <div className="mt-4 flex items-center gap-1.5 px-3 pb-3">
        <p className={`text-xs ${timestampTone}`}>{message.time}</p>
      </div>

      {stackGalleryIndex !== null ? (
        <PhotoStackLightbox
          assets={message.assets}
          initialIndex={stackGalleryIndex}
          onClose={() => setStackGalleryIndex(null)}
        />
      ) : null}
    </>
  );
}
