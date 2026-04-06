import {
  computeEffectiveStatus,
  formatExpiryCountdown as formatExpiryCountdownAt,
} from "@/lib/photoModel";
import type {
  ChatMessage,
  PermissionStatus,
  PhotoAsset,
  PhotoMessage,
  PhotoPermissions,
} from "./types";

export function getTimeLabel(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getStatusLabel(status: PermissionStatus): string {
  return status === "revoked" ? "Revoked" : "Visible";
}

export function getNextMessageId(...arrays: ChatMessage[][]): number {
  const flat = arrays.flat();
  return flat.reduce((highestId, message) => Math.max(highestId, message.id), 0) + 1;
}

export function getEffectivePermissions(
  mainMessages: ChatMessage[],
  message: PhotoMessage,
): PhotoPermissions & { canDownload: boolean; hasCoSubject: boolean } {
  const raw =
    mainMessages.find(
      (entry): entry is PhotoMessage =>
        entry.type === "photo" && entry.sourcePhotoId === message.sourcePhotoId,
    )?.permissions ?? message.permissions;
  const expiresAt = raw.expiresAt ?? null;
  const now = Date.now();
  const canDownload = raw.canDownload ?? true;
  const hasCoSubject = raw.hasCoSubject ?? false;
  return {
    ...raw,
    expiresAt,
    canDownload,
    hasCoSubject,
    status: computeEffectiveStatus(raw.status, expiresAt, now),
  };
}

export function getSourcePolicyPermissions(
  mainMessages: ChatMessage[],
  message: PhotoMessage,
) {
  const raw =
    mainMessages.find(
      (entry): entry is PhotoMessage =>
        entry.type === "photo" && entry.sourcePhotoId === message.sourcePhotoId,
    )?.permissions ?? message.permissions;
  return {
    canForward: raw.canForward ?? true,
    canDownload: raw.canDownload ?? true,
    viewOnce: raw.viewOnce ?? false,
    expiresAt: raw.expiresAt ?? null,
    hasCoSubject: raw.hasCoSubject ?? false,
  };
}

export function isPhotoExpired(permissions: PhotoPermissions): boolean {
  return permissions.expiresAt != null && Date.now() >= permissions.expiresAt;
}

export function formatExpiryCountdown(expiresAt: number): string {
  return formatExpiryCountdownAt(expiresAt, Date.now());
}

export function photoMessageDisplayLabel(message: PhotoMessage): string {
  const { assets } = message;
  if (assets.length === 1) {
    return assets[0].label;
  }
  return `${assets.length} photos`;
}

export function triggerPhotoDownload(asset: PhotoAsset): void {
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
}

export function triggerPhotoDownloads(assets: PhotoAsset[]): void {
  for (const asset of assets) {
    triggerPhotoDownload(asset);
  }
}

export function isViewOnceConsumedForSourcePhoto(
  mainMessages: ChatMessage[],
  forwardedMessages: ChatMessage[],
  consumedViewOnce: number[],
  sourcePhotoId: number,
): boolean {
  return [...mainMessages, ...forwardedMessages].some(
    (m) =>
      m.type === "photo" &&
      m.sourcePhotoId === sourcePhotoId &&
      consumedViewOnce.includes(m.id),
  );
}
