"use client";

import { ChangeEvent, useRef, useState } from "react";

type PermissionStatus = "active" | "revoked";
type MainParticipant = "sender" | "recipient";
type Participant = MainParticipant | "forwardedRecipient";
type ConversationThread = "main" | "forwarded";
type PhotoAssetKind = "preset" | "upload";

type PhotoAsset = {
  id: string;
  kind: PhotoAssetKind;
  label: string;
  previewClass?: string;
  previewUrl?: string;
};

type PhotoPermissions = {
  status: PermissionStatus;
  canForward: boolean;
  viewOnce: boolean;
};

type ChatMessage =
  | {
      id: number;
      sender: Participant;
      type: "text";
      text: string;
      time: string;
    }
  | {
      id: number;
      sender: Participant;
      type: "photo";
      asset: PhotoAsset;
      caption: string;
      time: string;
      permissions: PhotoPermissions;
      sourcePhotoId: number;
    };

const presetAlbum: PhotoAsset[] = [
  {
    id: "preset-beach",
    kind: "preset",
    label: "Beach night",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#fcd34d_0%,#f59e0b_24%,#0f766e_64%,#164e63_100%)]",
  },
  {
    id: "preset-city",
    kind: "preset",
    label: "City lights",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#f472b6_0%,#8b5cf6_35%,#1d4ed8_72%,#0f172a_100%)]",
  },
  {
    id: "preset-cafe",
    kind: "preset",
    label: "Cafe table",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#f5d0a9_0%,#fb923c_30%,#7c3aed_70%,#312e81_100%)]",
  },
  {
    id: "preset-garden",
    kind: "preset",
    label: "Garden walk",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#86efac_0%,#22c55e_28%,#0f766e_68%,#134e4a_100%)]",
  },
];

const initialPhotoAsset = presetAlbum[0];

export default function Home() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(2);
  const [openPhotoMenu, setOpenPhotoMenu] = useState<{
    messageId: number;
    thread: ConversationThread;
    owner: Participant;
    mode: "actions" | "revoke";
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [pickerSelectedPhoto, setPickerSelectedPhoto] = useState<PhotoAsset | null>(null);
  const [openViewOnce, setOpenViewOnce] = useState<{
    owner: Participant;
    thread: ConversationThread;
    messageId: number;
  } | null>(null);
  const [consumedViewOnce, setConsumedViewOnce] = useState<number[]>([]);
  const [draftPhoto, setDraftPhoto] = useState<PhotoAsset | null>(null);
  const [draftCaption, setDraftCaption] = useState("Shared with revocable permissions.");
  const [draftPermissions, setDraftPermissions] = useState<PhotoPermissions>({
    status: "active",
    canForward: false,
    viewOnce: false,
  });
  const [senderInput, setSenderInput] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [lastSendSummary, setLastSendSummary] = useState(
    "Sent Beach night with visible access and forwarding blocked.",
  );
  const [lastForwardSummary, setLastForwardSummary] = useState(
    "No forwarded photo has been shared yet.",
  );
  const [mainMessages, setMainMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "recipient",
      type: "text",
      text: "Can you send me the photo from last night?",
      time: "09:12",
    },
    {
      id: 2,
      sender: "sender",
      type: "photo",
      asset: initialPhotoAsset,
      caption: "Shared with revocable permissions.",
      time: "09:14",
      permissions: {
        status: "active",
        canForward: false,
        viewOnce: false,
      },
      sourcePhotoId: 2,
    },
    {
      id: 3,
      sender: "recipient",
      type: "text",
      text: "I can see it now. Let me know if you want me to keep it private.",
      time: "09:15",
    },
  ]);
  const [forwardedMessages, setForwardedMessages] = useState<ChatMessage[]>([]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);

  const selectedPhotoMessage =
    selectedPhotoId === null
      ? null
      : mainMessages.find(
          (message): message is Extract<ChatMessage, { type: "photo" }> =>
            message.type === "photo" && message.sourcePhotoId === selectedPhotoId,
        ) ?? null;

  const openViewOnceMessage =
    openViewOnce === null
      ? null
      : (openViewOnce.thread === "main" ? mainMessages : forwardedMessages).find(
          (message): message is Extract<ChatMessage, { type: "photo" }> =>
            message.id === openViewOnce.messageId && message.type === "photo",
        ) ?? null;

  const getTimeLabel = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const getStatusLabel = (status: PermissionStatus) =>
    status === "revoked" ? "Revoked" : "Visible";

  const getNextMessageId = () =>
    [...mainMessages, ...forwardedMessages].reduce(
      (highestId, message) => Math.max(highestId, message.id),
      0,
    ) + 1;

  const getEffectivePermissions = (message: Extract<ChatMessage, { type: "photo" }>) =>
    mainMessages.find(
      (entry): entry is Extract<ChatMessage, { type: "photo" }> =>
        entry.type === "photo" && entry.sourcePhotoId === message.sourcePhotoId,
    )?.permissions ?? message.permissions;

  const renderPhotoPreview = (asset: PhotoAsset) => {
    const preview =
      asset.kind === "upload" && asset.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.previewUrl}
          alt={asset.label}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-end ${asset.previewClass ?? "bg-slate-600"} p-4`}
        >
          <div className="w-full rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
              Sample photo
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{asset.label}</p>
          </div>
        </div>
      );

    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#dfe5e7]">
        {preview}
      </div>
    );
  };

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

  const openComposerForPhoto = (asset: PhotoAsset) => {
    setPickerSelectedPhoto(asset);
    setDraftPhoto(asset);
    setDraftCaption("Shared with revocable permissions.");
    setDraftPermissions({
      status: "active",
      canForward: false,
      viewOnce: false,
    });
    setPickerOpen(false);
    setComposerOpen(true);
  };

  const handleChosenFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPickerSelectedPhoto({
        id: `upload-${Date.now()}`,
        kind: "upload",
        label: selectedFile.name,
        previewUrl: String(reader.result ?? ""),
      });
    };
    reader.readAsDataURL(selectedFile);
    event.target.value = "";
  };

  const addPhotoMessage = (
    asset: PhotoAsset,
    permissions: PhotoPermissions,
    caption: string,
    summary: string,
  ) => {
    const nextPhotoId = getNextMessageId();

    const newPhotoMessage: Extract<ChatMessage, { type: "photo" }> = {
      id: nextPhotoId,
      sender: "sender",
      type: "photo",
      asset,
      caption: caption.trim() || "Shared photo",
      time: getTimeLabel(),
      permissions,
      sourcePhotoId: nextPhotoId,
    };

    setMainMessages((currentMessages) => [...currentMessages, newPhotoMessage]);
    setSelectedPhotoId(newPhotoMessage.sourcePhotoId);
    setPanelOpen(false);
    setPickerSelectedPhoto(null);
    setComposerOpen(false);
    setLastSendSummary(summary);
  };

  const sendConfiguredPhoto = () => {
    if (!draftPhoto) {
      return;
    }

    addPhotoMessage(
      draftPhoto,
      draftPermissions,
      draftCaption,
      `Sent ${draftPhoto.label} with ${
        draftPermissions.status === "active" ? "visible access" : "revoked access"
      }, ${draftPermissions.canForward ? "forwarding allowed" : "forwarding blocked"}${
        draftPermissions.viewOnce ? ", and view once enabled" : ""
      }.`,
    );
  };

  const sendPhotoDirectly = () => {
    if (!pickerSelectedPhoto) {
      return;
    }

    addPhotoMessage(
      pickerSelectedPhoto,
      {
        status: "active",
        canForward: true,
        viewOnce: false,
      },
      "Shared photo",
      `Sent ${pickerSelectedPhoto.label} directly with standard photo settings.`,
    );
  };

  const forwardPhotoMessage = (message: Extract<ChatMessage, { type: "photo" }>) => {
    const effectivePermissions = getEffectivePermissions(message);

    if (effectivePermissions.status !== "active" || !effectivePermissions.canForward) {
      return;
    }

    const forwardedMessage: Extract<ChatMessage, { type: "photo" }> = {
      id: getNextMessageId(),
      sender: "recipient",
      type: "photo",
      asset: message.asset,
      caption: `Forwarded: ${message.caption}`,
      time: getTimeLabel(),
      permissions: effectivePermissions,
      sourcePhotoId: message.sourcePhotoId,
    };

    setForwardedMessages((currentMessages) => [...currentMessages, forwardedMessage]);
    setLastForwardSummary(`Recipient forwarded ${message.asset.label} to the third phone.`);
  };

  const addReplyMessage = (
    sender: Participant,
    thread: ConversationThread,
    assetLabel: string,
  ) => {
    const replyMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(),
      sender,
      type: "text",
      text: `Replying to ${assetLabel}.`,
      time: getTimeLabel(),
    };

    if (thread === "forwarded") {
      setForwardedMessages((currentMessages) => [...currentMessages, replyMessage]);
      return;
    }

    setMainMessages((currentMessages) => [...currentMessages, replyMessage]);
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
        id: getNextMessageId(),
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

  const renderPhotoMessage = (
    message: Extract<ChatMessage, { type: "photo" }>,
    phoneOwner: Participant,
    isOwnMessage: boolean,
    timestampTone: string,
    thread: ConversationThread,
  ) => {
    const effectivePermissions = getEffectivePermissions(message);
    const canViewPhoto = phoneOwner === "sender" || effectivePermissions.status === "active";
    const recipientSideViewer =
      phoneOwner === "recipient" || phoneOwner === "forwardedRecipient";
    const hasRecipientConsumed =
      recipientSideViewer && consumedViewOnce.includes(message.id);

    const openFullScreenViewOnce = () => {
      if (!canViewPhoto || hasRecipientConsumed) {
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
      phoneOwner === "recipient" &&
      thread === "main" &&
      !isOwnMessage &&
      effectivePermissions.canForward &&
      effectivePermissions.status === "active" &&
      !hasRecipientConsumed;

    const photoContent = effectivePermissions.viewOnce ? (
      <button
        type="button"
        onClick={openFullScreenViewOnce}
        disabled={hasRecipientConsumed || !canViewPhoto}
        className={`flex w-full items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-left transition ${
          hasRecipientConsumed || !canViewPhoto
            ? "cursor-not-allowed bg-white/5 opacity-70"
            : "bg-white/10 hover:bg-white/15"
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-white">View once photo</p>
          <p className="text-xs text-emerald-100/80">
            {hasRecipientConsumed
              ? "Already opened. Tap is disabled."
              : "Opens full-screen. Closing returns to chat."}
          </p>
        </div>
        <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white">
          {hasRecipientConsumed ? "Viewed" : "Open"}
        </span>
      </button>
    ) : canViewPhoto ? (
      <div className="aspect-[4/5]">
        {renderPhotoPreview(message.asset)}
      </div>
    ) : (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#08352d] p-6 text-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/70">
            Access changed
          </p>
          <p className="mt-2 text-lg font-semibold">This photo is no longer visible.</p>
          <p className="mt-2 text-sm text-emerald-50/80">
            The sender has revoked access in the current chat.
          </p>
        </div>
      </div>
    );

    return (
      <>
        <div className="relative">
          {photoContent}
          <div className="absolute right-3 top-3">
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/20 text-sm font-semibold text-white transition hover:bg-black/30"
                aria-label="Open photo options"
              >
                ▾
              </button>

              {isCurrentMenuOpen ? (
                <div className="absolute right-0 top-10 z-20 w-56 rounded-2xl border border-white/10 bg-[#4d4f55]/95 p-2 text-sm text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
                  {openPhotoMenu.mode === "actions" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          addReplyMessage(phoneOwner, thread, message.asset.label);
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
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedPhotoPermissions({
                            status: effectivePermissions.status === "active" ? "revoked" : "active",
                          });
                          setPanelOpen(true);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                      >
                        {effectivePermissions.status === "active"
                          ? "Revoke photo access"
                          : "Restore photo access"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedPhotoPermissions({
                            canForward: !effectivePermissions.canForward,
                          });
                          setPanelOpen(true);
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
                            viewOnce: !effectivePermissions.viewOnce,
                          });
                          setPanelOpen(true);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                      >
                        {effectivePermissions.viewOnce ? "Disable view once" : "Enable view once"}
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">
            {getStatusLabel(effectivePermissions.status)}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1">
            {effectivePermissions.canForward ? "Forwarding allowed" : "No forwarding"}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1">
            {effectivePermissions.viewOnce ? "View once" : "Reviewable later"}
          </span>
        </div>

        <p className="mt-3 text-sm text-emerald-50">
          {effectivePermissions.status === "active"
            ? message.caption
            : "Access has been revoked for the recipient device."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className={`text-xs ${timestampTone}`}>{message.time}</p>
          <span className="text-[11px] text-emerald-100/70">Photo options in chat</span>
        </div>
      </>
    );
  };

  const renderMessage = (
    message: ChatMessage,
    phoneOwner: Participant,
    thread: ConversationThread,
  ) => {
    const isOwnMessage = message.sender === phoneOwner;
    const alignClass = isOwnMessage
      ? "ml-auto rounded-tr-sm bg-[#005c4b]"
      : "rounded-tl-sm bg-[#202c33]";
    const textTone = isOwnMessage ? "text-white" : "text-slate-100";
    const timestampTone = isOwnMessage ? "text-emerald-100/70" : "text-slate-400";

    if (message.type === "text") {
      return (
        <div
          key={message.id}
          className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${alignClass} ${textTone}`}
        >
          <p>{message.text}</p>
          <p className={`mt-2 text-right text-xs ${timestampTone}`}>{message.time}</p>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`max-w-[82%] rounded-2xl p-3 text-sm shadow-lg ${alignClass} ${textTone}`}
      >
        {renderPhotoMessage(message, phoneOwner, isOwnMessage, timestampTone, thread)}
      </div>
    );
  };

  const renderPhone = (
    phoneOwner: Participant,
    title: string,
    subtitle: string,
    conversation: ChatMessage[],
    inputValue?: string,
    setInputValue?: (value: string) => void,
  ) => (
    <section className="flex h-[820px] min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111b21] shadow-2xl shadow-black/30">
      <header className="flex items-center justify-between border-b border-white/5 bg-[#202c33] px-5 py-4 text-white">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-[#2a3942] px-3 py-1">
            {phoneOwner === "sender"
              ? "Sender phone"
              : phoneOwner === "recipient"
                ? "Recipient phone"
                : "Forwarded chat"}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#0b141a_0%,#0f171d_100%)] px-4 py-6">
        {conversation.length > 0 ? (
          conversation.map((message) =>
            renderMessage(
              message,
              phoneOwner,
              phoneOwner === "forwardedRecipient" ? "forwarded" : "main",
            ),
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
              This chat is empty until the recipient forwards a photo.
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 bg-[#202c33] px-4 py-3">
        {phoneOwner === "forwardedRecipient" ? (
          <div className="rounded-3xl bg-[#2a3942] px-4 py-3 text-sm text-slate-300">
            Forwarded photos from the recipient will appear here.
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-full bg-[#2a3942] px-4 py-3 text-sm text-slate-400">
            {phoneOwner === "sender" ? (
              <>
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
              </>
            ) : (
              <span className="text-lg">+</span>
            )}
            <input
              value={inputValue ?? ""}
              onChange={(event) => setInputValue?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendTextMessage(phoneOwner);
                }
              }}
              placeholder={phoneOwner === "sender" ? "Type as sender..." : "Type as recipient..."}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => sendTextMessage(phoneOwner)}
              className="rounded-full bg-[#005c4b] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b7a63]"
            >
              Send
            </button>
          </div>
        )}

        {phoneOwner === "sender" && pickerOpen ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-[#172229] p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Camera and album</p>
                <p className="text-xs text-slate-300">
                  Choose a photo, then configure permissions before sending.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 rounded-2xl bg-[#005c4b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b7a63]"
              >
                Open camera
              </button>
              <button
                type="button"
                onClick={() => albumInputRef.current?.click()}
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Choose from files
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Preset album
              </p>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {presetAlbum.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setPickerSelectedPhoto(asset)}
                    className="text-left"
                  >
                    <div
                      className={`aspect-square overflow-hidden rounded-2xl border ${
                        pickerSelectedPhoto?.id === asset.id
                          ? "border-emerald-400"
                          : "border-white/10"
                      }`}
                    >
                      {renderPhotoPreview(asset)}
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{asset.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {pickerSelectedPhoto ? (
              <div className="mt-4 rounded-3xl border border-white/10 bg-[#111b21] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Selected photo
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10">
                    {renderPhotoPreview(pickerSelectedPhoto)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {pickerSelectedPhoto.label}
                    </p>
                    <p className="text-xs text-slate-300">
                      Send directly or open revocable permissions first.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={sendPhotoDirectly}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => openComposerForPhoto(pickerSelectedPhoto)}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Send with revocable permissions
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </footer>
    </section>
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
        className="hidden"
        onChange={handleChosenFile}
      />

      <div className="mx-auto grid max-w-[112rem] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6 xl:grid-cols-3">
          {renderPhone(
            "sender",
            "You",
            "Sender controls available",
            mainMessages,
            senderInput,
            setSenderInput,
          )}
          {renderPhone(
            "recipient",
            "Aisha",
            selectedPhotoMessage?.permissions.status === "active"
              ? "Recipient view of the chat"
              : "Recipient sees revoked state",
            mainMessages,
            recipientInput,
            setRecipientInput,
          )}
          {renderPhone(
            "forwardedRecipient",
            "Omar",
            "Forwarded-message recipient",
            forwardedMessages,
          )}
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-black/15">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Interactive prototype screen
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Photo message with revocation controls
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This version shows three devices at once: the sender, the original recipient,
            and a third phone that only receives content when the recipient forwards an
            allowed photo.
          </p>

          <div className="mt-6 rounded-3xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Current prototype state</p>
            <dl className="mt-3 space-y-3 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-slate-900">Photo status</dt>
                <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedPhotoMessage
                    ? getStatusLabel(selectedPhotoMessage.permissions.status)
                    : "no photo selected"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-slate-900">Forwarding</dt>
                <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedPhotoMessage
                    ? selectedPhotoMessage.permissions.canForward
                      ? "allowed"
                      : "blocked"
                    : "n/a"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-slate-900">View once</dt>
                <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedPhotoMessage?.permissions.viewOnce ? "enabled" : "off"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-slate-900">Last send</dt>
                <dd className="max-w-[160px] text-right text-xs leading-5 text-slate-500">
                  {lastSendSummary}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-slate-900">Forwarded chat</dt>
                <dd className="max-w-[160px] text-right text-xs leading-5 text-slate-500">
                  {lastForwardSummary}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-4">
            <p className="text-sm font-semibold text-slate-900">Permissions panel</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This panel manages the currently selected sent photo. Use the camera icon on
              the sender phone to add new photo messages.
            </p>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setPanelOpen((current) => !current)}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!selectedPhotoMessage}
              >
                {panelOpen ? "Close controls" : "Open controls"}
              </button>

              {panelOpen && selectedPhotoMessage ? (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Photo visibility</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateSelectedPhotoPermissions({ status: "active" })}
                        className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                          selectedPhotoMessage.permissions.status === "active"
                            ? "bg-emerald-500 text-[#03130f]"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedPhotoPermissions({ status: "revoked" })}
                        className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                          selectedPhotoMessage.permissions.status === "revoked"
                            ? "bg-rose-500 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Forwarding permission
                        </p>
                        <p className="text-xs text-slate-500">
                          Controls whether the recipient can send this photo to the third
                          phone.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedPhotoPermissions({
                            canForward: !selectedPhotoMessage.permissions.canForward,
                          })
                        }
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          selectedPhotoMessage.permissions.canForward
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {selectedPhotoMessage.permissions.canForward ? "Allowed" : "Blocked"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">View once</p>
                        <p className="text-xs text-slate-500">
                          Mirrors WhatsApp-style single-view media controls.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedPhotoPermissions({
                            viewOnce: !selectedPhotoMessage.permissions.viewOnce,
                          })
                        }
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          selectedPhotoMessage.permissions.viewOnce
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {selectedPhotoMessage.permissions.viewOnce ? "Enabled" : "Off"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    This is intentionally scoped as platform-level visibility control, not a
                    guarantee of universal deletion.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {composerOpen && draftPhoto ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="grid w-full max-w-5xl gap-6 rounded-[2rem] bg-[#111b21] p-5 text-white shadow-2xl shadow-black/40 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#202c33]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Photo composer</p>
                  <p className="text-xs text-slate-300">
                    Choose permissions before sending the photo as a message.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="p-4">
                <div className="aspect-[4/5]">
                  {renderPhotoPreview(draftPhoto)}
                </div>
                <input
                  value={draftCaption}
                  onChange={(event) => setDraftCaption(event.target.value)}
                  placeholder="Add a caption..."
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-[#172229] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 text-slate-900">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Before sending
              </p>
              <h2 className="mt-3 text-2xl font-semibold">Photo tools and permissions</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This mirrors the stage where WhatsApp lets users configure media behaviour
                before sending. The buttons below control the actual photo message that
                will be added to the chat.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setDraftPermissions((current) => ({
                      ...current,
                      viewOnce: !current.viewOnce,
                    }))
                  }
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    draftPermissions.viewOnce
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {draftPermissions.viewOnce ? "View once enabled" : "View once"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraftPermissions((current) => ({
                      ...current,
                      canForward: !current.canForward,
                    }))
                  }
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    draftPermissions.canForward
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {draftPermissions.canForward ? "Forwarding allowed" : "No forwarding"}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftPermissions((current) => ({
                        ...current,
                        status: "active",
                      }))
                    }
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      draftPermissions.status === "active"
                        ? "bg-emerald-500 text-[#03130f]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftPermissions((current) => ({
                        ...current,
                        status: "revoked",
                      }))
                    }
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      draftPermissions.status === "revoked"
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Send revoked demo
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Selected photo</p>
                <p className="mt-2 text-sm text-slate-600">{draftPhoto.label}</p>
              </div>

              <button
                type="button"
                onClick={sendConfiguredPhoto}
                className="mt-6 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Send photo message
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openViewOnce && openViewOnceMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close full-screen photo"
            onClick={() => {
              if (openViewOnce.owner === "recipient" || openViewOnce.owner === "forwardedRecipient") {
                setConsumedViewOnce((current) =>
                  current.includes(openViewOnce.messageId)
                    ? current
                    : [...current, openViewOnce.messageId],
                );
              }
              setOpenViewOnce(null);
            }}
          />
          <div className="relative z-10 flex h-full w-full max-w-4xl flex-col">
            <div className="flex items-center justify-between px-2 py-4 text-white">
              <div>
                <p className="text-sm font-semibold">
                  {openViewOnce.owner === "sender" ? "Sender preview" : "Recipient view once"}
                </p>
                <p className="text-xs text-slate-300">
                  {openViewOnce.owner === "recipient" ||
                  openViewOnce.owner === "forwardedRecipient"
                    ? "Close the photo to continue messaging. It will not reopen."
                    : "Close the photo to return to the chat."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    openViewOnce.owner === "recipient" ||
                    openViewOnce.owner === "forwardedRecipient"
                  ) {
                    setConsumedViewOnce((current) =>
                      current.includes(openViewOnce.messageId)
                        ? current
                        : [...current, openViewOnce.messageId],
                    );
                  }
                  setOpenViewOnce(null);
                }}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111b21]">
              {renderPhotoPreview(openViewOnceMessage.asset)}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
