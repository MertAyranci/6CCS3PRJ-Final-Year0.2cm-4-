/**
 * Pure helpers for photo permission state and time limits.
 * Extracted for unit testing and to keep permission rules explicit.
 */

export type PermissionStatus = "active" | "revoked";

export type TimeLimitDuration = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function durationToMs(d: TimeLimitDuration): number {
  return (d.days * 86400 + d.hours * 3600 + d.minutes * 60 + d.seconds) * 1000;
}

export function hasTimeLimit(d: TimeLimitDuration): boolean {
  return d.days > 0 || d.hours > 0 || d.minutes > 0 || d.seconds > 0;
}

export function formatTimeLimit(d: TimeLimitDuration): string {
  const parts: string[] = [];
  if (d.days > 0) parts.push(`${d.days}d`);
  if (d.hours > 0) parts.push(`${d.hours}h`);
  if (d.minutes > 0) parts.push(`${d.minutes}m`);
  if (d.seconds > 0) parts.push(`${d.seconds}s`);
  return parts.length ? parts.join(" ") : "No limit";
}

/**
 * Effective access status: expiry forces revoked even when stored status is active.
 */
export function computeEffectiveStatus(
  storedStatus: PermissionStatus,
  expiresAt: number | null,
  nowMs: number,
): PermissionStatus {
  if (storedStatus === "revoked") return "revoked";
  if (expiresAt != null && nowMs >= expiresAt) return "revoked";
  return "active";
}

/** True when the recipient may forward under current effective rules. */
export function forwardingAllowed(
  storedStatus: PermissionStatus,
  canForward: boolean,
  expiresAt: number | null,
  nowMs: number,
): boolean {
  return computeEffectiveStatus(storedStatus, expiresAt, nowMs) === "active" && canForward;
}

/** Returns "Expired" or "Expires in …" for a live countdown. */
export function formatExpiryCountdown(expiresAt: number, nowMs: number): string {
  const remainingMs = expiresAt - nowMs;
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
}
