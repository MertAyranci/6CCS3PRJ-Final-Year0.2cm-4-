"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  durationToMs,
  formatTimeLimit,
  hasTimeLimit,
} from "@/lib/photoModel";
import type { TimeLimitDuration } from "@/lib/photoModel";
import type {
  ChatMessage,
  ConversationThread,
  MainParticipant,
  Participant,
  PhotoAsset,
  PhotoMessage,
  PhotoPermissions,
} from "@/lib/photo-revocation-demo/types";
import {
  DEFAULT_DRAFT_CAPTION,
  DEFAULT_DRAFT_PERMISSIONS,
  DEFAULT_DRAFT_TIME_LIMIT,
  DEFAULT_PANEL_TIME_LIMIT,
  INITIAL_MAIN_MESSAGES,
  INITIAL_SEND_HISTORY,
} from "@/lib/photo-revocation-demo/initialState";
import {
  formatExpiryCountdown,
  getEffectivePermissions,
  getNextMessageId,
  getStatusLabel,
  getTimeLabel,
  isViewOnceConsumedForSourcePhoto,
  photoMessageDisplayLabel,
} from "@/lib/photo-revocation-demo/helpers";
import { ComposerView } from "./ComposerView";
import { MessageList } from "./MessageList";
import { PrototypeStateSummary } from "./PrototypeStateSummary";
import { PhoneFrame } from "./PhoneFrame";
import { PhotoPreview } from "./PhotoPreview";
import { PickerSheet } from "./PickerSheet";
import { RequestAccessPanel } from "./RequestAccessPanel";
import { RequestRevocationPanel } from "./RequestRevocationPanel";
import { TimeLimitModal } from "./TimeLimitModal";
import { ViewOnceInChatModal } from "./ViewOnceInChatModal";

export function PhotoRevocationDemo() {
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(2);
  const [openPhotoMenu, setOpenPhotoMenu] = useState<import("@/lib/photo-revocation-demo/types").OpenPhotoMenuState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [pickerSelectedPhotos, setPickerSelectedPhotos] = useState<PhotoAsset[]>([]);
  const [openViewOnce, setOpenViewOnce] = useState<import("@/lib/photo-revocation-demo/types").OpenViewOnceState | null>(null);
  const [consumedViewOnce, setConsumedViewOnce] = useState<number[]>([]);
  const [draftPhotos, setDraftPhotos] = useState<PhotoAsset[]>([]);
  const [draftCaption, setDraftCaption] = useState(DEFAULT_DRAFT_CAPTION);
  const [draftPermissions, setDraftPermissions] = useState<PhotoPermissions>(DEFAULT_DRAFT_PERMISSIONS);
  const [accessRequestOpen, setAccessRequestOpen] = useState<import("@/lib/photo-revocation-demo/types").AccessRequestOpenState | null>(null);
  const [accessRequestDraft, setAccessRequestDraft] = useState("");
  const [revocationRequestOpen, setRevocationRequestOpen] = useState<import("@/lib/photo-revocation-demo/types").RevocationRequestOpenState | null>(null);
  const [revocationRequestDraft, setRevocationRequestDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<import("@/lib/photo-revocation-demo/types").ReplyingToState | null>(null);
  const [coOwnerReplyInput, setCoOwnerReplyInput] = useState("");
  const [draftTimeLimit, setDraftTimeLimit] = useState<TimeLimitDuration>(DEFAULT_DRAFT_TIME_LIMIT);
  const [draftTimeLimitOpen, setDraftTimeLimitOpen] = useState(false);
  const [panelTimeLimit, setPanelTimeLimit] = useState<TimeLimitDuration>(DEFAULT_PANEL_TIME_LIMIT);
  const [timeLimitModalOpen, setTimeLimitModalOpen] = useState(false);
  const [senderInput, setSenderInput] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [sendHistory, setSendHistory] = useState(INITIAL_SEND_HISTORY);
  const [mainMessages, setMainMessages] = useState<ChatMessage[]>(INITIAL_MAIN_MESSAGES);
  const [forwardedMessages, setForwardedMessages] = useState<ChatMessage[]>([]);
  const [senderOnlyMessages, setSenderOnlyMessages] = useState<ChatMessage[]>([]);
  const [coSubjectOnlyMessages, setCoSubjectOnlyMessages] = useState<ChatMessage[]>([]);
  const [recipientOnlyMessages, setRecipientOnlyMessages] = useState<ChatMessage[]>([]);
  const [, setCountdownTick] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setCountdownTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const selectedPhotoMessage: PhotoMessage | null =
    selectedPhotoId === null
      ? null
      : mainMessages.find(
          (message): message is PhotoMessage =>
            message.type === "photo" && message.sourcePhotoId === selectedPhotoId,
        ) ?? null;

  const openViewOnceMessage =
    openViewOnce === null
      ? null
      : (openViewOnce.thread === "main" ? mainMessages : forwardedMessages).find(
          (message): message is PhotoMessage =>
            message.id === openViewOnce.messageId && message.type === "photo",
        ) ?? null;

  const updateSelectedPhotoPermissions = (updates: Partial<PhotoPermissions>) => {
    if (selectedPhotoId === null) {
      return;
    }

    setMainMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.type !== "photo" || message.sourcePhotoId !== selectedPhotoId) {
          return message;
        }

        return {
          ...message,
          permissions: {
            ...message.permissions,
            ...updates,
          },
        };
      }),
    );
  };

  const togglePickerPhoto = (asset: PhotoAsset) => {
    setPickerSelectedPhotos((prev) => {
      const index = prev.findIndex((p) => p.id === asset.id);
      if (index >= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return [...prev, asset];
    });
  };

  const openComposerWithPhotos = () => {
    if (pickerSelectedPhotos.length === 0) {
      return;
    }
    setDraftPhotos([...pickerSelectedPhotos]);
    setDraftCaption(DEFAULT_DRAFT_CAPTION);
    setDraftPermissions({
      status: "active",
      canForward: true,
      viewOnce: false,
      expiresAt: null,
      canDownload: true,
      hasCoSubject: false,
    });
    setDraftTimeLimit({ days: 0, hours: 0, minutes: 5, seconds: 0 });
    setDraftTimeLimitOpen(false);
    setPickerOpen(false);
    setComposerOpen(true);
  };

  const handleChosenFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    const list = Array.from(files);
    const base = Date.now();
    list.forEach((selectedFile, fileIndex) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPickerSelectedPhotos((prev) => [
          ...prev,
          {
            id: `upload-${base}-${fileIndex}`,
            kind: "upload",
            label: selectedFile.name,
            previewUrl: String(reader.result ?? ""),
          },
        ]);
      };
      reader.readAsDataURL(selectedFile);
    });
    event.target.value = "";
  };

  const addPhotoMessage = (
    assets: PhotoAsset[],
    permissions: PhotoPermissions,
    caption: string,
    summary: string,
  ) => {
    if (assets.length === 0) {
      return;
    }
    const snapshot = [...assets];

    const nextPhotoId = getNextMessageId(
      mainMessages,
      forwardedMessages,
      senderOnlyMessages,
      coSubjectOnlyMessages,
      recipientOnlyMessages,
    );

    const newPhotoMessage: PhotoMessage = {
      id: nextPhotoId,
      sender: "sender",
      type: "photo",
      assets: snapshot,
      caption: caption.trim() || "Shared photo",
      time: getTimeLabel(),
      permissions,
      sourcePhotoId: nextPhotoId,
    };

    setMainMessages((currentMessages) => [...currentMessages, newPhotoMessage]);
    setSelectedPhotoId(newPhotoMessage.sourcePhotoId);
    setPickerSelectedPhotos([]);
    setDraftPhotos([]);
    setComposerOpen(false);
    setSendHistory((prev) => [
      ...prev,
      {
        sourcePhotoId: newPhotoMessage.sourcePhotoId,
        time: newPhotoMessage.time,
        summary,
      },
    ]);
  };

  const sendConfiguredPhoto = () => {
    if (draftPhotos.length === 0) {
      return;
    }

    const useTimeLimit = draftTimeLimitOpen && hasTimeLimit(draftTimeLimit);
    const permissions: PhotoPermissions = {
      ...draftPermissions,
      expiresAt: useTimeLimit ? Date.now() + durationToMs(draftTimeLimit) : null,
    };

    const expiryText = useTimeLimit
      ? `, expires in ${formatTimeLimit(draftTimeLimit)}`
      : "";
    const downloadText = permissions.canDownload ? ", download allowed" : ", download blocked";
    const labelSummary =
      draftPhotos.length === 1 ? draftPhotos[0].label : `${draftPhotos.length} photos`;

    addPhotoMessage(
      draftPhotos,
      permissions,
      draftCaption,
      `Sent ${labelSummary} with ${
        permissions.status === "active" ? "visible access" : "revoked access"
      }, ${permissions.canForward ? "forwarding allowed" : "forwarding blocked"}${
        draftPermissions.viewOnce ? ", and view once enabled" : ""
      }${downloadText}${expiryText}.`,
    );
  };

  const sendPhotoDirectly = () => {
    if (pickerSelectedPhotos.length === 0) {
      return;
    }

    const labelSummary =
      pickerSelectedPhotos.length === 1
        ? pickerSelectedPhotos[0].label
        : `${pickerSelectedPhotos.length} photos`;

    addPhotoMessage(
      [...pickerSelectedPhotos],
      {
        status: "active",
        canForward: true,
        viewOnce: false,
        expiresAt: null,
        canDownload: true,
        hasCoSubject: false,
      },
      "Shared photo",
      `Sent ${labelSummary} directly with standard photo settings.`,
    );
  };

  const forwardPhotoMessage = (message: PhotoMessage) => {
    const effectivePermissions = getEffectivePermissions(mainMessages, message);

    if (effectivePermissions.status !== "active" || !effectivePermissions.canForward) {
      return;
    }

    const forwardedMessage: PhotoMessage = {
      id: getNextMessageId(
        mainMessages,
        forwardedMessages,
        senderOnlyMessages,
        coSubjectOnlyMessages,
        recipientOnlyMessages,
      ),
      sender: "recipient",
      type: "photo",
      assets: [...message.assets],
      caption: `Forwarded: ${message.caption}`,
      time: getTimeLabel(),
      permissions: effectivePermissions,
      sourcePhotoId: message.sourcePhotoId,
    };

    setForwardedMessages((currentMessages) => [...currentMessages, forwardedMessage]);
  };

  const addReplyMessage = (
    sender: Participant,
    thread: import("@/lib/photo-revocation-demo/types").ConversationThread,
    assetLabel: string,
    customText?: string,
    replyToMessageId?: number,
    replyToAsset?: PhotoAsset,
  ) => {
    const text = (customText?.trim() ?? "") || `Replying to ${assetLabel}.`;
    const replyMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(
        mainMessages,
        forwardedMessages,
        senderOnlyMessages,
        coSubjectOnlyMessages,
        recipientOnlyMessages,
      ),
      sender,
      type: "text",
      text,
      time: getTimeLabel(),
      ...(replyToMessageId != null && {
        replyToMessageId,
        replyToAssetLabel: assetLabel,
        replyToAsset,
      }),
    };

    if (thread === "forwarded") {
      setForwardedMessages((currentMessages) => [...currentMessages, replyMessage]);
      return;
    }

    setMainMessages((currentMessages) => [...currentMessages, replyMessage]);
  };

  const sendReplyIfActive = (owner: Participant): boolean => {
    if (!replyingTo || replyingTo.owner !== owner) return false;
    const text =
      owner === "coOwner"
        ? coOwnerReplyInput.trim()
        : owner === "sender"
          ? senderInput.trim()
          : recipientInput.trim();
    addReplyMessage(
      owner,
      replyingTo.thread,
      replyingTo.assetLabel,
      text || undefined,
      replyingTo.messageId,
      replyingTo.asset,
    );
    setReplyingTo(null);
    if (owner === "sender") setSenderInput("");
    else if (owner === "recipient") setRecipientInput("");
    else setCoOwnerReplyInput("");
    return true;
  };

  const addAccessRequestMessage = (
    assetLabel: string,
    requestingOwner: Participant,
    optionalMessage?: string,
    sourcePhotoId?: number,
  ) => {
    const base = `Requested access to the photo: ${assetLabel}.`;
    const text = optionalMessage?.trim()
      ? `${base} — ${optionalMessage.trim()}`
      : base;
    const requestMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(
        mainMessages,
        forwardedMessages,
        senderOnlyMessages,
        coSubjectOnlyMessages,
        recipientOnlyMessages,
      ),
      sender: requestingOwner,
      type: "text",
      text,
      time: getTimeLabel(),
      ...(requestingOwner === "recipient" && sourcePhotoId != null
        ? {
            accessRequestSourcePhotoId: sourcePhotoId,
            accessRequestAssetLabel: assetLabel,
            accessRequestStatus: "pending" as const,
          }
        : {}),
    };
    setSenderOnlyMessages((current) => [...current, requestMessage]);
  };

  const restorePhotoBySourceId = (sourcePhotoId: number) => {
    setMainMessages((current) =>
      current.map((m) =>
        m.type === "photo" && m.sourcePhotoId === sourcePhotoId
          ? { ...m, permissions: { ...m.permissions, status: "active" as const } }
          : m,
      ),
    );
  };

  const respondToAccessRequest = (
    messageId: number,
    accept: boolean,
    assetLabel: string,
    sourcePhotoId: number | undefined,
  ) => {
    setSenderOnlyMessages((current) =>
      current.map((m) =>
        m.type === "text" &&
        m.id === messageId &&
        m.accessRequestStatus === "pending"
          ? { ...m, accessRequestStatus: accept ? "accepted" : "rejected" }
          : m,
      ),
    );
    if (accept && sourcePhotoId != null) {
      restorePhotoBySourceId(sourcePhotoId);
    } else if (!accept) {
      const rejectionText = `The sender has rejected your access request for the photo: ${assetLabel}.`;
      setRecipientOnlyMessages((current) => [
        ...current,
        {
          id: getNextMessageId(
            mainMessages,
            forwardedMessages,
            senderOnlyMessages,
            coSubjectOnlyMessages,
            recipientOnlyMessages,
          ),
          sender: "sender",
          type: "text",
          text: rejectionText,
          time: getTimeLabel(),
        },
      ]);
    }
  };

  const sendAccessRequestFromModal = () => {
    if (!accessRequestOpen) return;
    addAccessRequestMessage(
      accessRequestOpen.assetLabel,
      accessRequestOpen.owner,
      accessRequestDraft,
      accessRequestOpen.sourcePhotoId,
    );
    setAccessRequestOpen(null);
    setAccessRequestDraft("");
    setOpenPhotoMenu(null);
  };

  const addRevocationRequestMessage = (
    assetLabel: string,
    optionalMessage?: string,
    sourcePhotoId?: number,
  ) => {
    const base = `Requested revocation of the photo: ${assetLabel}.`;
    const text = optionalMessage?.trim()
      ? `${base} — ${optionalMessage.trim()}`
      : base;
    const requestMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(
        mainMessages,
        forwardedMessages,
        senderOnlyMessages,
        coSubjectOnlyMessages,
        recipientOnlyMessages,
      ),
      sender: "coOwner",
      type: "text",
      text,
      time: getTimeLabel(),
      revocationRequestSourcePhotoId: sourcePhotoId,
      revocationRequestAssetLabel: assetLabel,
      revocationRequestStatus: "pending",
    };
    setSenderOnlyMessages((current) => [...current, requestMessage]);
  };

  const revokePhotoBySourceId = (sourcePhotoId: number) => {
    setMainMessages((current) =>
      current.map((m) =>
        m.type === "photo" && m.sourcePhotoId === sourcePhotoId
          ? { ...m, permissions: { ...m.permissions, status: "revoked" as const } }
          : m,
      ),
    );
  };

  const respondToRevocationRequest = (
    messageId: number,
    accept: boolean,
    assetLabel: string,
    sourcePhotoId: number | undefined,
  ) => {
    setSenderOnlyMessages((current) =>
      current.map((m) =>
        m.type === "text" &&
        m.id === messageId &&
        m.revocationRequestStatus === "pending"
          ? { ...m, revocationRequestStatus: accept ? "accepted" : "rejected" }
          : m,
      ),
    );
    if (accept && sourcePhotoId != null) {
      revokePhotoBySourceId(sourcePhotoId);
    } else if (!accept) {
      const rejectionText = `The sender has rejected your revocation request for the photo: ${assetLabel}.`;
      setCoSubjectOnlyMessages((current) => [
        ...current,
        {
          id: getNextMessageId(
            mainMessages,
            forwardedMessages,
            senderOnlyMessages,
            coSubjectOnlyMessages,
            recipientOnlyMessages,
          ),
          sender: "sender",
          type: "text",
          text: rejectionText,
          time: getTimeLabel(),
        },
      ]);
    }
  };

  const sendRevocationRequestFromModal = () => {
    if (!revocationRequestOpen) return;
    addRevocationRequestMessage(
      revocationRequestOpen.assetLabel,
      revocationRequestDraft,
      revocationRequestOpen.sourcePhotoId,
    );
    setRevocationRequestOpen(null);
    setRevocationRequestDraft("");
    setOpenPhotoMenu(null);
  };

  const sendTextMessage = (sender: MainParticipant) => {
    const currentInput = sender === "sender" ? senderInput : recipientInput;
    const trimmedInput = currentInput.trim();

    if (!trimmedInput) {
      return;
    }

    setMainMessages((currentMessages) => [
      ...currentMessages,
      {
        id: getNextMessageId(
          mainMessages,
          forwardedMessages,
          senderOnlyMessages,
          coSubjectOnlyMessages,
          recipientOnlyMessages,
        ),
        sender,
        type: "text",
        text: trimmedInput,
        time: getTimeLabel(),
      },
    ]);

    if (sender === "sender") {
      setSenderInput("");
      return;
    }

    setRecipientInput("");
  };

  const messageListProps = {
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
    onRespondToRevocationRequest: respondToRevocationRequest,
    onRespondToAccessRequest: respondToAccessRequest,
  };

  const senderConversation = [...mainMessages, ...senderOnlyMessages].sort((a, b) => a.id - b.id);
  const recipientConversation = [...mainMessages, ...recipientOnlyMessages].sort((a, b) => a.id - b.id);
  const coOwnerConversation = [
    ...mainMessages.filter((m) => {
      if (m.type !== "photo") return false;
      return m.permissions.hasCoSubject;
    }),
    ...coSubjectOnlyMessages,
  ].sort((a, b) => a.id - b.id);

  const viewOnceConsumedSelected =
    selectedPhotoMessage != null &&
    isViewOnceConsumedForSourcePhoto(
      mainMessages,
      forwardedMessages,
      consumedViewOnce,
      selectedPhotoMessage.sourcePhotoId,
    );

  const viewOnceOverlay = (owner: Participant, thread: ConversationThread) => (
    <ViewOnceInChatModal
      phoneOwner={owner}
      thread={thread}
      openViewOnce={openViewOnce}
      openViewOnceMessage={openViewOnceMessage}
      setOpenViewOnce={setOpenViewOnce}
      setConsumedViewOnce={setConsumedViewOnce}
    />
  );

  return (
    <main className="min-h-screen bg-[#0b141a] px-4 py-8 text-slate-900">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChosenFile}
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChosenFile}
      />

      <div className="mx-auto max-w-[112rem] space-y-6">
        <div className="grid gap-6 xl:grid-cols-4">
          <div className="relative min-h-0">
            <PhoneFrame
              title="Sender"
              subtitle="Sender controls available"
              phoneOwner="sender"
              chatOverlays={viewOnceOverlay("sender", "main")}
              footer={
                <>
                  <div className="space-y-2">
                    {replyingTo?.owner === "sender" ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#2a3942] px-3 py-2">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          {replyingTo && <PhotoPreview asset={replyingTo.asset} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-emerald-200">
                            Replying to {replyingTo?.assetLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                          aria-label="Cancel reply"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3 rounded-full bg-[#2a3942] px-4 py-3 text-sm text-slate-400">
                      <button
                        type="button"
                        onClick={() => setPickerOpen((current) => !current)}
                        className="text-lg text-emerald-300 transition hover:text-emerald-200"
                        aria-label="Open photo actions"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerOpen((current) => !current)}
                        className="text-lg text-emerald-300 transition hover:text-emerald-200"
                        aria-label="Open camera and album"
                      >
                        📷
                      </button>
                      <input
                        value={senderInput}
                        onChange={(event) => setSenderInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            if (sendReplyIfActive("sender")) return;
                            sendTextMessage("sender");
                          }
                        }}
                        placeholder={
                          replyingTo?.owner === "sender"
                            ? "Type your reply..."
                            : "Type as sender..."
                        }
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (sendReplyIfActive("sender")) return;
                          sendTextMessage("sender");
                        }}
                        className="rounded-full bg-[#005c4b] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b7a63]"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                  {pickerOpen ? (
                    <PickerSheet
                      pickerSelectedPhotos={pickerSelectedPhotos}
                      togglePickerPhoto={togglePickerPhoto}
                      onClose={() => setPickerOpen(false)}
                      cameraInputRef={cameraInputRef}
                      albumInputRef={albumInputRef}
                      onSendPhotoDirectly={sendPhotoDirectly}
                      onOpenComposerWithPhotos={openComposerWithPhotos}
                    />
                  ) : null}
                </>
              }
            >
              {composerOpen && draftPhotos.length > 0 ? (
                <ComposerView
                  draftPhotos={draftPhotos}
                  draftCaption={draftCaption}
                  onDraftCaptionChange={setDraftCaption}
                  draftPermissions={draftPermissions}
                  setDraftPermissions={setDraftPermissions}
                  draftTimeLimit={draftTimeLimit}
                  setDraftTimeLimit={setDraftTimeLimit}
                  draftTimeLimitOpen={draftTimeLimitOpen}
                  setDraftTimeLimitOpen={setDraftTimeLimitOpen}
                  onClose={() => {
                    setComposerOpen(false);
                    setDraftPhotos([]);
                  }}
                  onSendConfiguredPhoto={sendConfiguredPhoto}
                />
              ) : senderConversation.length > 0 ? (
                <MessageList
                  conversation={senderConversation}
                  phoneOwner="sender"
                  thread="main"
                  {...messageListProps}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
                    This chat is empty until the recipient forwards a photo.
                  </div>
                </div>
              )}
            </PhoneFrame>
            {timeLimitModalOpen && selectedPhotoMessage ? (
              <TimeLimitModal
                panelTimeLimit={panelTimeLimit}
                setPanelTimeLimit={setPanelTimeLimit}
                onClose={() => setTimeLimitModalOpen(false)}
                onApply={() => setTimeLimitModalOpen(false)}
                updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
              />
            ) : null}
          </div>

          <PhoneFrame
            title="Recipient"
            subtitle={
              selectedPhotoMessage?.permissions.status === "active"
                ? "Recipient view of the chat"
                : "Recipient sees revoked state"
            }
            phoneOwner="recipient"
            chatOverlays={viewOnceOverlay("recipient", "main")}
            footer={
              <>
                {accessRequestOpen?.owner === "recipient" ? (
                  <RequestAccessPanel
                    assetLabel={accessRequestOpen.assetLabel}
                    draft={accessRequestDraft}
                    onDraftChange={setAccessRequestDraft}
                    onCancel={() => {
                      setAccessRequestOpen(null);
                      setAccessRequestDraft("");
                    }}
                    onSendRequest={sendAccessRequestFromModal}
                  />
                ) : (
                  <div className="space-y-2">
                    {replyingTo?.owner === "recipient" ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#2a3942] px-3 py-2">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          {replyingTo && <PhotoPreview asset={replyingTo.asset} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-emerald-200">
                            Replying to {replyingTo?.assetLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                          aria-label="Cancel reply"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3 rounded-full bg-[#2a3942] px-4 py-3 text-sm text-slate-400">
                      <span className="text-lg">+</span>
                      <input
                        value={recipientInput}
                        onChange={(event) => setRecipientInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            if (sendReplyIfActive("recipient")) return;
                            sendTextMessage("recipient");
                          }
                        }}
                        placeholder={
                          replyingTo?.owner === "recipient"
                            ? "Type your reply..."
                            : "Type as recipient..."
                        }
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (sendReplyIfActive("recipient")) return;
                          sendTextMessage("recipient");
                        }}
                        className="rounded-full bg-[#005c4b] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b7a63]"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </>
            }
          >
            {recipientConversation.length > 0 ? (
              <MessageList
                conversation={recipientConversation}
                phoneOwner="recipient"
                thread="main"
                {...messageListProps}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
                  This chat is empty until the recipient forwards a photo.
                </div>
              </div>
            )}
          </PhoneFrame>

          <PhoneFrame
            title="Secondary recipient"
            subtitle="Forwarded-message recipient"
            phoneOwner="forwardedRecipient"
            chatOverlays={viewOnceOverlay("forwardedRecipient", "forwarded")}
            footer={
              <>
                {accessRequestOpen?.owner === "forwardedRecipient" ? (
                  <RequestAccessPanel
                    assetLabel={accessRequestOpen.assetLabel}
                    draft={accessRequestDraft}
                    onDraftChange={setAccessRequestDraft}
                    onCancel={() => {
                      setAccessRequestOpen(null);
                      setAccessRequestDraft("");
                    }}
                    onSendRequest={sendAccessRequestFromModal}
                  />
                ) : (
                  <div className="rounded-3xl bg-[#2a3942] px-4 py-3 text-sm text-slate-300">
                    Forwarded photos from the recipient will appear here.
                  </div>
                )}
              </>
            }
          >
            {forwardedMessages.length > 0 ? (
              <MessageList
                conversation={forwardedMessages}
                phoneOwner="forwardedRecipient"
                thread="forwarded"
                {...messageListProps}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
                  This chat is empty until the recipient forwards a photo.
                </div>
              </div>
            )}
          </PhoneFrame>

          <PhoneFrame
            title="Co-subject"
            subtitle="Co-subject view of the chat"
            phoneOwner="coOwner"
            chatOverlays={viewOnceOverlay("coOwner", "main")}
            footer={
              <>
                {revocationRequestOpen ? (
                  <RequestRevocationPanel
                    assetLabel={revocationRequestOpen.assetLabel}
                    draft={revocationRequestDraft}
                    onDraftChange={setRevocationRequestDraft}
                    onCancel={() => {
                      setRevocationRequestOpen(null);
                      setRevocationRequestDraft("");
                    }}
                    onSendRequest={sendRevocationRequestFromModal}
                  />
                ) : replyingTo?.owner === "coOwner" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#2a3942] px-3 py-2">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                        {replyingTo && <PhotoPreview asset={replyingTo.asset} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-emerald-200">
                          Replying to {replyingTo?.assetLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                        aria-label="Cancel reply"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-3 rounded-full bg-[#2a3942] px-4 py-3 text-sm text-slate-400">
                      <input
                        value={coOwnerReplyInput}
                        onChange={(e) => setCoOwnerReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (sendReplyIfActive("coOwner")) e.preventDefault();
                          }
                        }}
                        placeholder="Type your reply..."
                        className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => sendReplyIfActive("coOwner")}
                        className="rounded-full bg-[#005c4b] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b7a63]"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-[#2a3942] px-4 py-3 text-sm text-slate-300">
                    Co-subject view of the conversation.
                  </div>
                )}
              </>
            }
          >
            {coOwnerConversation.length > 0 ? (
              <MessageList
                conversation={coOwnerConversation}
                phoneOwner="coOwner"
                thread="main"
                {...messageListProps}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
                  No messages in this conversation yet.
                </div>
              </div>
            )}
          </PhoneFrame>
        </div>

        <PrototypeStateSummary
          selectedPhotoMessage={selectedPhotoMessage}
          sendHistory={sendHistory}
          mainMessages={mainMessages}
          forwardedMessages={forwardedMessages}
          consumedViewOnce={consumedViewOnce}
          isViewOnceConsumedForSelectedPhoto={viewOnceConsumedSelected}
        />
      </div>

      {accessRequestOpen && accessRequestOpen.owner !== "recipient" && accessRequestOpen.owner !== "forwardedRecipient" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#202c33] p-5 shadow-2xl text-white">
            <h3 className="text-lg font-semibold">Request access to photo</h3>
            <p className="mt-1 text-sm text-slate-300">
              {accessRequestOpen.assetLabel}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Add a message to the sender (optional):
            </p>
            <textarea
              value={accessRequestDraft}
              onChange={(e) => setAccessRequestDraft(e.target.value)}
              placeholder="e.g. I need this for the report, can you restore access?"
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#172229] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAccessRequestOpen(null);
                  setAccessRequestDraft("");
                }}
                className="flex-1 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendAccessRequestFromModal}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
