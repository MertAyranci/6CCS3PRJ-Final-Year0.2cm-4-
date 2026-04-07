import { describe, expect, it } from "vitest";
import {
  computeEffectiveStatus,
  durationToMs,
  formatExpiryCountdown,
  formatTimeLimit,
  forwardingAllowed,
  hasTimeLimit,
} from "@/lib/photoModel";

describe("photoModel", () => {
  it("computeEffectiveStatus treats past expiry as revoked for stored active", () => {
    const now = 1_700_000_000_000;
    expect(computeEffectiveStatus("active", now - 1000, now)).toBe("revoked");
    expect(computeEffectiveStatus("active", now + 60_000, now)).toBe("active");
    expect(computeEffectiveStatus("active", null, now)).toBe("active");
  });

  it("computeEffectiveStatus keeps stored revoked regardless of expiry", () => {
    const now = 1_700_000_000_000;
    expect(computeEffectiveStatus("revoked", null, now)).toBe("revoked");
    expect(computeEffectiveStatus("revoked", now + 99_000, now)).toBe("revoked");
  });

  it("forwardingAllowed requires active effective access and canForward", () => {
    const now = 1_700_000_000_000;
    expect(forwardingAllowed("active", true, null, now)).toBe(true);
    expect(forwardingAllowed("active", false, null, now)).toBe(false);
    expect(forwardingAllowed("revoked", true, null, now)).toBe(false);
    expect(forwardingAllowed("active", true, now - 1, now)).toBe(false);
  });

  it("durationToMs and hasTimeLimit", () => {
    expect(durationToMs({ days: 0, hours: 0, minutes: 1, seconds: 0 })).toBe(60_000);
    expect(hasTimeLimit({ days: 0, hours: 0, minutes: 0, seconds: 0 })).toBe(false);
    expect(hasTimeLimit({ days: 0, hours: 0, minutes: 0, seconds: 1 })).toBe(true);
  });

  it("formatTimeLimit joins non-zero parts", () => {
    expect(formatTimeLimit({ days: 1, hours: 2, minutes: 0, seconds: 3 })).toBe("1d 2h 3s");
  });

  it("formatExpiryCountdown returns Expired or a countdown label", () => {
    const now = 1_700_000_000_000;
    expect(formatExpiryCountdown(now - 1000, now)).toBe("Expired");
    const label = formatExpiryCountdown(now + 90_500, now);
    expect(label.startsWith("Expires in ")).toBe(true);
  });
});
