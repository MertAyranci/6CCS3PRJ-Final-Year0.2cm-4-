"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type PermissionStatus = "active" | "revoked";
type MainParticipant = "sender" | "recipient";
type Participant = MainParticipant | "forwardedRecipient" | "coOwner";
type ConversationThread = "main" | "forwarded";
type PhotoAssetKind = "preset" | "upload";

type PhotoAsset = {
  id: string;
  kind: PhotoAssetKind;
  label: string;
  previewClass?: string;
  previewUrl?: string;
};

type TimeLimitDuration = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type PhotoPermissions = {
  status: PermissionStatus;
  canForward: boolean;
  viewOnce: boolean;
  expiresAt: number | null;
  canDownload: boolean;
  hasCoSubject: boolean;
};

type ChatMessage =
  | {
      id: number;
      sender: Participant;
      type: "text";
      text: string;
      time: string;
      replyToMessageId?: number;
      replyToAssetLabel?: string;
      replyToAsset?: PhotoAsset;
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

const ROW_HEIGHT = 36;
const WHEEL_VISIBLE_ROWS = 3;

function ScrollWheelColumn({
  min,
  max,
  value,
  onChange,
  label,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
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
    expiresAt: null,
    canDownload: true,
    hasCoSubject: false,
  });
  const [accessRequestOpen, setAccessRequestOpen] = useState<{
    messageId: number;
    thread: ConversationThread;
    owner: Participant;
    assetLabel: string;
  } | null>(null);
  const [accessRequestDraft, setAccessRequestDraft] = useState("");
  const [revocationRequestOpen, setRevocationRequestOpen] = useState<{
    assetLabel: string;
  } | null>(null);
  const [revocationRequestDraft, setRevocationRequestDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    owner: Participant;
    messageId: number;
    thread: ConversationThread;
    assetLabel: string;
    asset: PhotoAsset;
  } | null>(null);
  const [coOwnerReplyInput, setCoOwnerReplyInput] = useState("");
  const [draftTimeLimit, setDraftTimeLimit] = useState<TimeLimitDuration>({
    days: 0,
    hours: 0,
    minutes: 5,
    seconds: 0,
  });
  const [draftTimeLimitOpen, setDraftTimeLimitOpen] = useState(false);
  const [panelTimeLimit, setPanelTimeLimit] = useState<TimeLimitDuration>({
    days: 0,
    hours: 1,
    minutes: 0,
    seconds: 0,
  });
  const [panelTimeLimitOpen, setPanelTimeLimitOpen] = useState(false);
  const [timeLimitModalOpen, setTimeLimitModalOpen] = useState(false);
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
        expiresAt: null,
        canDownload: true,
        hasCoSubject: false,
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
  const [senderOnlyMessages, setSenderOnlyMessages] = useState<ChatMessage[]>([]);
  const [, setCountdownTick] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const permissionsPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setCountdownTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
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
    [...mainMessages, ...forwardedMessages, ...senderOnlyMessages].reduce(
      (highestId, message) => Math.max(highestId, message.id),
      0,
    ) + 1;

  const getEffectivePermissions = (message: Extract<ChatMessage, { type: "photo" }>) => {
    const raw =
      mainMessages.find(
        (entry): entry is Extract<ChatMessage, { type: "photo" }> =>
          entry.type === "photo" && entry.sourcePhotoId === message.sourcePhotoId,
      )?.permissions ?? message.permissions;
    const expiresAt = raw.expiresAt ?? null;
    const isExpired = expiresAt !== null && Date.now() >= expiresAt;
    const canDownload = raw.canDownload ?? true;
    const hasCoSubject = raw.hasCoSubject ?? false;
    return {
      ...raw,
      expiresAt,
      canDownload,
      hasCoSubject,
      status: isExpired ? ("revoked" as const) : raw.status,
    };
  };

  const durationToMs = (d: TimeLimitDuration) =>
    (d.days * 86400 + d.hours * 3600 + d.minutes * 60 + d.seconds) * 1000;

  const isPhotoExpired = (permissions: PhotoPermissions) =>
    permissions.expiresAt != null && Date.now() >= permissions.expiresAt;

  const hasTimeLimit = (d: TimeLimitDuration) =>
    d.days > 0 || d.hours > 0 || d.minutes > 0 || d.seconds > 0;

  const formatTimeLimit = (d: TimeLimitDuration) => {
    const parts: string[] = [];
    if (d.days > 0) parts.push(`${d.days}d`);
    if (d.hours > 0) parts.push(`${d.hours}h`);
    if (d.minutes > 0) parts.push(`${d.minutes}m`);
    if (d.seconds > 0) parts.push(`${d.seconds}s`);
    return parts.length ? parts.join(" ") : "No limit";
  };

  /** Returns "Expired" or "Expires in Xd Xh Xm Xs" for a live countdown. */
  const formatExpiryCountdown = (expiresAt: number) => {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) return "Expired";
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return `Expires in ${parts.join(" ")}`;
  };

  const triggerPhotoDownload = (asset: PhotoAsset) => {
    const filename = `${asset.label.replace(/[^a-zA-Z0-9.-]/g, "_")}.png`;
    if (asset.kind === "upload" && asset.previewUrl) {
      const a = document.createElement("a");
      a.href = asset.previewUrl;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(asset.label, 50, 55);
      }
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

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

    const useTimeLimit = draftTimeLimitOpen && hasTimeLimit(draftTimeLimit);
    const permissions: PhotoPermissions = {
      ...draftPermissions,
      expiresAt: useTimeLimit ? Date.now() + durationToMs(draftTimeLimit) : null,
    };

    const expiryText = useTimeLimit
      ? `, expires in ${formatTimeLimit(draftTimeLimit)}`
      : "";
    const downloadText = permissions.canDownload ? ", download allowed" : ", download blocked";

    addPhotoMessage(
      draftPhoto,
      permissions,
      draftCaption,
      `Sent ${draftPhoto.label} with ${
        permissions.status === "active" ? "visible access" : "revoked access"
      }, ${permissions.canForward ? "forwarding allowed" : "forwarding blocked"}${
        draftPermissions.viewOnce ? ", and view once enabled" : ""
      }${downloadText}${expiryText}.`,
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
        expiresAt: null,
        canDownload: true,
        hasCoSubject: false,
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
    customText?: string,
    replyToMessageId?: number,
    replyToAsset?: PhotoAsset,
  ) => {
    const text = (customText?.trim() ?? "") || `Replying to ${assetLabel}.`;
    const replyMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(),
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

  /** Sends a request-for-access message so only the sender sees it (not the recipient or co-subject). */
  const addAccessRequestMessage = (
    assetLabel: string,
    requestingOwner: Participant,
    optionalMessage?: string,
  ) => {
    const base = `Requested access to the photo: ${assetLabel}.`;
    const text = optionalMessage?.trim()
      ? `${base} — ${optionalMessage.trim()}`
      : base;
    const requestMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(),
      sender: requestingOwner,
      type: "text",
      text,
      time: getTimeLabel(),
    };
    setSenderOnlyMessages((current) => [...current, requestMessage]);
  };

  const sendAccessRequestFromModal = () => {
    if (!accessRequestOpen) return;
    addAccessRequestMessage(
      accessRequestOpen.assetLabel,
      accessRequestOpen.owner,
      accessRequestDraft,
    );
    setAccessRequestOpen(null);
    setAccessRequestDraft("");
    setOpenPhotoMenu(null);
  };

  /** Sends a co-subject revocation request so only the sender sees it (not the recipient or co-owner). */
  const addRevocationRequestMessage = (assetLabel: string, optionalMessage?: string) => {
    const base = `Requested revocation of the photo: ${assetLabel}.`;
    const text = optionalMessage?.trim()
      ? `${base} — ${optionalMessage.trim()}`
      : base;
    const requestMessage: Extract<ChatMessage, { type: "text" }> = {
      id: getNextMessageId(),
      sender: "coOwner",
      type: "text",
      text,
      time: getTimeLabel(),
    };
    setSenderOnlyMessages((current) => [...current, requestMessage]);
  };

  const sendRevocationRequestFromModal = () => {
    if (!revocationRequestOpen) return;
    addRevocationRequestMessage(revocationRequestOpen.assetLabel, revocationRequestDraft);
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
      phoneOwner === "recipient" || phoneOwner === "forwardedRecipient" || phoneOwner === "coOwner";
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

    const isCoSubjectCard = phoneOwner === "coOwner" && effectivePermissions.hasCoSubject;

    const openCoSubjectPhoto = () => {
      if (effectivePermissions.status !== "active") return;
      setOpenViewOnce({
        owner: "coOwner",
        thread,
        messageId: message.id,
      });
    };

    const photoContent = isCoSubjectCard ? (
      <div className="space-y-2">
        <button
          type="button"
          onClick={openCoSubjectPhoto}
          disabled={effectivePermissions.status !== "active"}
          className={`flex w-full flex-col items-center justify-center rounded-2xl border border-white/15 px-4 py-6 text-left transition ${
            effectivePermissions.status === "active"
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
            {effectivePermissions.status === "active"
              ? "Tap to view the photo."
              : "Access has been revoked."}
          </p>
        </button>
        <p className="text-xs text-slate-400">
          You have been notified that you appear in this photo. You can request the sender
          to revoke it.
        </p>
      </div>
    ) : effectivePermissions.viewOnce ? (
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
                          setReplyingTo({
                            owner: phoneOwner,
                            messageId: message.id,
                            thread,
                            assetLabel: message.asset.label,
                            asset: message.asset,
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
                          triggerPhotoDownload(message.asset);
                          setOpenPhotoMenu(null);
                        }}
                        disabled={!canViewPhoto || !effectivePermissions.canDownload}
                        className={`w-full rounded-xl px-3 py-2 text-left transition ${
                          canViewPhoto && effectivePermissions.canDownload
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
                            setRevocationRequestOpen({ assetLabel: message.asset.label });
                            setRevocationRequestDraft("");
                            setOpenPhotoMenu(null);
                          }}
                          className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/10"
                        >
                          Request revocation
                        </button>
                      ) : phoneOwner === "recipient" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAccessRequestOpen({
                              messageId: message.id,
                              thread,
                              owner: phoneOwner,
                              assetLabel: message.asset.label,
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
                            status: effectivePermissions.status === "active" ? "revoked" : "active",
                            ...(isExpired ? { expiresAt: null } : {}),
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
                            canDownload: !effectivePermissions.canDownload,
                          });
                          setPanelOpen(true);
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
                            setPanelOpen(true);
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
          <span className="rounded-full bg-white/15 px-3 py-1">
            {effectivePermissions.canDownload ? "Download allowed" : "Download blocked"}
          </span>
          {effectivePermissions.expiresAt != null ? (
            <span className="rounded-full bg-white/15 px-3 py-1">
              {formatExpiryCountdown(effectivePermissions.expiresAt)}
            </span>
          ) : null}
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
      const hasReply = message.replyToMessageId != null && message.replyToAssetLabel;
      return (
        <div
          key={message.id}
          className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${alignClass} ${textTone}`}
        >
          {hasReply ? (
            <div className="flex gap-2 border-l-2 border-white/30 pl-2">
              {message.replyToAsset ? (
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-white/20">
                  {renderPhotoPreview(message.replyToAsset)}
                </div>
              ) : null}
              <p className="truncate text-xs text-white/80">
                Replying to {message.replyToAssetLabel}
              </p>
            </div>
          ) : null}
          <p className={hasReply ? "mt-2" : ""}>{message.text}</p>
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
              ? "Sender"
              : phoneOwner === "recipient"
                ? "Recipient"
                : phoneOwner === "forwardedRecipient"
                  ? "Secondary recipient"
                  : "Co-subject"}
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
        ) : phoneOwner === "coOwner" ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
              No messages in this conversation yet.
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-6 text-center text-sm text-slate-300">
              This chat is empty until the recipient forwards a photo.
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 bg-[#202c33] px-4 py-3">
        {phoneOwner === "forwardedRecipient" && accessRequestOpen?.owner === "forwardedRecipient" ? (
          <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-[#172229] p-3">
            <p className="text-xs font-semibold text-emerald-200">Request access to photo</p>
            <p className="truncate text-[11px] text-slate-400">
              {accessRequestOpen.assetLabel}
            </p>
            <p className="text-[11px] text-slate-500">
              Add a message to the sender (optional):
            </p>
            <textarea
              value={accessRequestDraft}
              onChange={(e) => setAccessRequestDraft(e.target.value)}
              placeholder="e.g. I need this for the report, can you restore access?"
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b141a] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccessRequestOpen(null);
                  setAccessRequestDraft("");
                }}
                className="flex-1 rounded-xl border border-white/15 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendAccessRequestFromModal}
                className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Send request
              </button>
            </div>
          </div>
        ) : phoneOwner === "forwardedRecipient" ? (
          <div className="rounded-3xl bg-[#2a3942] px-4 py-3 text-sm text-slate-300">
            Forwarded photos from the recipient will appear here.
          </div>
        ) : phoneOwner === "recipient" && accessRequestOpen?.owner === "recipient" ? (
          <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-[#172229] p-3">
            <p className="text-xs font-semibold text-emerald-200">Request access to photo</p>
            <p className="truncate text-[11px] text-slate-400">
              {accessRequestOpen.assetLabel}
            </p>
            <p className="text-[11px] text-slate-500">
              Add a message to the sender (optional):
            </p>
            <textarea
              value={accessRequestDraft}
              onChange={(e) => setAccessRequestDraft(e.target.value)}
              placeholder="e.g. I need this for the report, can you restore access?"
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b141a] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccessRequestOpen(null);
                  setAccessRequestDraft("");
                }}
                className="flex-1 rounded-xl border border-white/15 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendAccessRequestFromModal}
                className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Send request
              </button>
            </div>
          </div>
        ) : phoneOwner === "coOwner" && revocationRequestOpen ? (
          <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-[#172229] p-3">
            <p className="text-xs font-semibold text-amber-200">Request revocation</p>
            <p className="truncate text-[11px] text-slate-400">
              {revocationRequestOpen.assetLabel}
            </p>
            <p className="text-[11px] text-slate-500">
              Add a message to the sender (optional):
            </p>
            <textarea
              value={revocationRequestDraft}
              onChange={(e) => setRevocationRequestDraft(e.target.value)}
              placeholder="e.g. I'd prefer this photo not to be shared."
              rows={2}
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b141a] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRevocationRequestOpen(null);
                  setRevocationRequestDraft("");
                }}
                className="flex-1 rounded-xl border border-white/15 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendRevocationRequestFromModal}
                className="flex-1 rounded-xl bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
              >
                Send request
              </button>
            </div>
          </div>
        ) : phoneOwner === "coOwner" && !revocationRequestOpen && replyingTo?.owner === "coOwner" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#2a3942] px-3 py-2">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                {replyingTo && renderPhotoPreview(replyingTo.asset)}
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
        ) : phoneOwner === "coOwner" && !revocationRequestOpen ? (
          <div className="rounded-3xl bg-[#2a3942] px-4 py-3 text-sm text-slate-300">
            Co-subject view of the conversation.
          </div>
        ) : (
          <div className="space-y-2">
            {replyingTo?.owner === phoneOwner ? (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#2a3942] px-3 py-2">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                  {replyingTo && renderPhotoPreview(replyingTo.asset)}
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
                    if (sendReplyIfActive(phoneOwner)) return;
                    if (phoneOwner === "sender" || phoneOwner === "recipient")
                      sendTextMessage(phoneOwner);
                  }
                }}
                placeholder={
                  replyingTo?.owner === phoneOwner
                    ? "Type your reply..."
                    : phoneOwner === "sender"
                      ? "Type as sender..."
                      : "Type as recipient..."
                }
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (sendReplyIfActive(phoneOwner)) return;
                  if (phoneOwner === "sender" || phoneOwner === "recipient")
                    sendTextMessage(phoneOwner);
                }}
                className="rounded-full bg-[#005c4b] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0b7a63]"
              >
                Send
              </button>
            </div>
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

      <div className="mx-auto max-w-[112rem] space-y-6">
        <div className="grid gap-6 xl:grid-cols-4">
          <div className="relative min-h-0">
            {renderPhone(
              "sender",
              "Sender",
              "Sender controls available",
              [...mainMessages, ...senderOnlyMessages].sort((a, b) => a.id - b.id),
              senderInput,
              setSenderInput,
            )}
            {timeLimitModalOpen && selectedPhotoMessage ? (
              <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[2rem] bg-black/75 p-3 backdrop-blur-sm">
                <div className="w-full max-w-[260px] rounded-2xl border border-white/10 bg-[#202c33] p-3 shadow-xl text-white">
                  <h3 className="text-sm font-semibold">Set time limit</h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Access will expire after this duration.
                  </p>
                  <div className="mt-2 flex justify-center gap-1">
                    <ScrollWheelColumn
                      min={0}
                      max={99}
                      value={panelTimeLimit.days}
                      onChange={(days) =>
                        setPanelTimeLimit((prev) => ({ ...prev, days }))
                      }
                      label="Days"
                    />
                    <ScrollWheelColumn
                      min={0}
                      max={23}
                      value={panelTimeLimit.hours}
                      onChange={(hours) =>
                        setPanelTimeLimit((prev) => ({ ...prev, hours }))
                      }
                      label="Hours"
                    />
                    <ScrollWheelColumn
                      min={0}
                      max={59}
                      value={panelTimeLimit.minutes}
                      onChange={(minutes) =>
                        setPanelTimeLimit((prev) => ({ ...prev, minutes }))
                      }
                      label="Min"
                    />
                    <ScrollWheelColumn
                      min={0}
                      max={59}
                      value={panelTimeLimit.seconds}
                      onChange={(seconds) =>
                        setPanelTimeLimit((prev) => ({ ...prev, seconds }))
                      }
                      label="Sec"
                    />
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-medium text-slate-400">
                    {formatTimeLimit(panelTimeLimit)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeLimitModalOpen(false)}
                      className="flex-1 rounded-xl border border-white/15 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasTimeLimit(panelTimeLimit)) return;
                        updateSelectedPhotoPermissions({
                          expiresAt: Date.now() + durationToMs(panelTimeLimit),
                          status: "active",
                        });
                        setTimeLimitModalOpen(false);
                      }}
                      disabled={!hasTimeLimit(panelTimeLimit)}
                      className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-500 disabled:text-slate-300"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {renderPhone(
            "recipient",
            "Recipient",
            selectedPhotoMessage?.permissions.status === "active"
              ? "Recipient view of the chat"
              : "Recipient sees revoked state",
            mainMessages,
            recipientInput,
            setRecipientInput,
          )}
          {renderPhone(
            "forwardedRecipient",
            "Secondary recipient",
            "Forwarded-message recipient",
            forwardedMessages,
          )}
          {renderPhone(
            "coOwner",
            "Co-subject",
            "Co-subject view of the chat",
            mainMessages.filter((m) => {
              if (m.type !== "photo") return true;
              return m.permissions.hasCoSubject;
            }),
          )}
        </div>

        <aside
          ref={permissionsPanelRef}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-black/15"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Interactive prototype screen
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Photo message with revocation controls
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This version shows four devices: the sender, the original recipient, a third
            phone for forwarded content, and the co-owner. Use the panel below to inspect
            and manage the selected photo.
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
                <dt className="font-medium text-slate-900">Download</dt>
                <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedPhotoMessage?.permissions.canDownload !== false
                    ? "allowed"
                    : "blocked"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-slate-900">Time limit</dt>
                <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedPhotoMessage?.permissions.expiresAt != null
                    ? formatExpiryCountdown(selectedPhotoMessage.permissions.expiresAt).toLowerCase()
                    : "none"}
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
                    <p className="mt-1 text-xs text-slate-500">
                      {isPhotoExpired(selectedPhotoMessage.permissions)
                        ? "Photo access has expired. Restore permanently or set a new time limit below."
                        : "Active: visible. Revoke: hide from recipient."}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedPhotoPermissions({
                            status: "active",
                            ...(isPhotoExpired(selectedPhotoMessage.permissions)
                              ? { expiresAt: null }
                              : {}),
                          })
                        }
                        className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                          selectedPhotoMessage.permissions.status === "active" &&
                          !isPhotoExpired(selectedPhotoMessage.permissions)
                            ? "bg-emerald-500 text-[#03130f]"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isPhotoExpired(selectedPhotoMessage.permissions)
                          ? "Restore access (permanent)"
                          : "Active"}
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
                        <p className="text-sm font-semibold text-slate-900">Download</p>
                        <p className="text-xs text-slate-500">
                          Whether the recipient can download this photo.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSelectedPhotoPermissions({
                            canDownload: !selectedPhotoMessage.permissions.canDownload,
                          })
                        }
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          selectedPhotoMessage.permissions.canDownload
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {selectedPhotoMessage.permissions.canDownload ? "Allowed" : "Blocked"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Time limit</p>
                      <p className="text-xs text-slate-500">
                        {selectedPhotoMessage.permissions.expiresAt != null
                          ? isPhotoExpired(selectedPhotoMessage.permissions)
                            ? "Photo access has expired. Set a new time limit or restore access permanently above."
                            : "Photo access expires at a set time. Remove to allow access until revoked."
                          : "No expiry set; access remains until you revoke it."}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {selectedPhotoMessage.permissions.expiresAt != null ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedPhotoPermissions({ expiresAt: null })
                          }
                          className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-200"
                        >
                          Remove time limit
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setPanelTimeLimitOpen((open) => !open)
                        }
                        className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200"
                      >
                        {panelTimeLimitOpen
                          ? "Cancel"
                          : selectedPhotoMessage.permissions.expiresAt != null
                            ? "Set new time limit"
                            : "Add time limit"}
                      </button>
                    </div>
                    {panelTimeLimitOpen ? (
                      <>
                        <p className="mt-3 text-xs text-slate-500">
                          Set duration from now. Access will expire after this time.
                        </p>
                        <div className="mt-2 flex justify-center gap-2 sm:gap-4">
                          <ScrollWheelColumn
                            min={0}
                            max={99}
                            value={panelTimeLimit.days}
                            onChange={(days) =>
                              setPanelTimeLimit((prev) => ({ ...prev, days }))
                            }
                            label="Days"
                          />
                          <ScrollWheelColumn
                            min={0}
                            max={23}
                            value={panelTimeLimit.hours}
                            onChange={(hours) =>
                              setPanelTimeLimit((prev) => ({ ...prev, hours }))
                            }
                            label="Hours"
                          />
                          <ScrollWheelColumn
                            min={0}
                            max={59}
                            value={panelTimeLimit.minutes}
                            onChange={(minutes) =>
                              setPanelTimeLimit((prev) => ({ ...prev, minutes }))
                            }
                            label="Min"
                          />
                          <ScrollWheelColumn
                            min={0}
                            max={59}
                            value={panelTimeLimit.seconds}
                            onChange={(seconds) =>
                              setPanelTimeLimit((prev) => ({ ...prev, seconds }))
                            }
                            label="Sec"
                          />
                        </div>
                        <p className="mt-2 text-center text-xs font-medium text-slate-500">
                          {formatTimeLimit(panelTimeLimit)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasTimeLimit(panelTimeLimit)) return;
                            updateSelectedPhotoPermissions({
                              expiresAt: Date.now() + durationToMs(panelTimeLimit),
                              status: "active",
                            });
                            setPanelTimeLimitOpen(false);
                          }}
                          disabled={!hasTimeLimit(panelTimeLimit)}
                          className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          Apply time limit
                        </button>
                      </>
                    ) : null}
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
              <h2 className="mt-3 text-2xl font-semibold">Photo permissions</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This mirrors the stage where WhatsApp lets users configure media behaviour
                before sending. The buttons below control the actual photo message that
                will be added to the chat.
              </p>

              <div className="mt-6 max-h-[min(50vh,28rem)] overflow-y-auto space-y-3">
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
                  {draftPermissions.viewOnce ? "View once allowed" : "View once disabled"}
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
                  {draftPermissions.canForward ? "Forwarding allowed" : "Forwarding disabled"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraftPermissions((current) => ({
                      ...current,
                      canDownload: !current.canDownload,
                    }))
                  }
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    draftPermissions.canDownload
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {draftPermissions.canDownload ? "Downloading allowed" : "Downloading disabled"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraftPermissions((current) => ({
                      ...current,
                      hasCoSubject: !current.hasCoSubject,
                    }))
                  }
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    draftPermissions.hasCoSubject
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {draftPermissions.hasCoSubject
                    ? "Co-subject in photo (depicted person will be notified)"
                    : "Co-subject in photo"}
                </button>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setDraftTimeLimitOpen((open) => !open)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      draftTimeLimitOpen
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {draftTimeLimitOpen ? "Time limit (set)" : "Time limit (no expiry)"}
                  </button>
                  {draftTimeLimitOpen ? (
                    <>
                      <p className="mt-2 text-xs text-slate-500">
                        Photo access expires after this duration. Set all to 0 for no expiry.
                      </p>
                      <div className="mt-3 flex justify-center gap-2 sm:gap-4">
                        <ScrollWheelColumn
                          min={0}
                          max={99}
                          value={draftTimeLimit.days}
                          onChange={(days) =>
                            setDraftTimeLimit((prev) => ({ ...prev, days }))
                          }
                          label="Days"
                        />
                        <ScrollWheelColumn
                          min={0}
                          max={23}
                          value={draftTimeLimit.hours}
                          onChange={(hours) =>
                            setDraftTimeLimit((prev) => ({ ...prev, hours }))
                          }
                          label="Hours"
                        />
                        <ScrollWheelColumn
                          min={0}
                          max={59}
                          value={draftTimeLimit.minutes}
                          onChange={(minutes) =>
                            setDraftTimeLimit((prev) => ({ ...prev, minutes }))
                          }
                          label="Min"
                        />
                        <ScrollWheelColumn
                          min={0}
                          max={59}
                          value={draftTimeLimit.seconds}
                          onChange={(seconds) =>
                            setDraftTimeLimit((prev) => ({ ...prev, seconds }))
                          }
                          label="Sec"
                        />
                      </div>
                      <p className="mt-2 text-center text-xs font-medium text-slate-500">
                        {formatTimeLimit(draftTimeLimit)}
                      </p>
                    </>
                  ) : null}
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

      {openViewOnce && openViewOnceMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close full-screen photo"
            onClick={() => {
              if (openViewOnce.owner === "recipient" || openViewOnce.owner === "forwardedRecipient" || openViewOnce.owner === "coOwner") {
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
                  {openViewOnce.owner === "sender" ? "Sender preview" : openViewOnce.owner === "coOwner" ? "Co-subject view once" : "Recipient view once"}
                </p>
                <p className="text-xs text-slate-300">
                  {openViewOnce.owner === "recipient" ||
                  openViewOnce.owner === "forwardedRecipient" ||
                  openViewOnce.owner === "coOwner"
                    ? "Close the photo to continue messaging. It will not reopen."
                    : "Close the photo to return to the chat."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    openViewOnce.owner === "recipient" ||
                    openViewOnce.owner === "forwardedRecipient" ||
                    openViewOnce.owner === "coOwner"
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
