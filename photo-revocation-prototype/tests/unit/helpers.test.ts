import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, PhotoMessage } from "@/lib/photo-revocation-demo/types";
import {
  formatExpiryCountdown,
  getEffectivePermissions,
  getNextMessageId,
  getSourcePolicyPermissions,
  getStatusLabel,
  getTimeLabel,
  isPhotoExpired,
  isViewOnceConsumedForSourcePhoto,
  photoMessageDisplayLabel,
  triggerPhotoDownload,
  triggerPhotoDownloads,
} from "@/lib/photo-revocation-demo/helpers";

function mkPhoto(
  partial: Partial<PhotoMessage> & Pick<PhotoMessage, "id" | "sourcePhotoId">,
): PhotoMessage {
  return {
    id: partial.id,
    sender: partial.sender ?? "sender",
    type: "photo",
    assets:
      partial.assets ?? [{ id: "asset-1", kind: "preset", label: "Beach", previewClass: "bg-slate-500" }],
    caption: partial.caption ?? "Caption",
    time: partial.time ?? "10:00",
    permissions: partial.permissions ?? {
      status: "active",
      canForward: true,
      viewOnce: false,
      expiresAt: null,
      canDownload: true,
      hasCoSubject: false,
    },
    sourcePhotoId: partial.sourcePhotoId,
  };
}

describe("photo-revocation-demo helpers", () => {
  it("maps status labels", () => {
    expect(getStatusLabel("active")).toBe("Visible");
    expect(getStatusLabel("revoked")).toBe("Revoked");
  });

  it("returns next message id across multiple arrays", () => {
    const a: ChatMessage[] = [{ id: 2, sender: "sender", type: "text", text: "a", time: "10:00" }];
    const b: ChatMessage[] = [{ id: 9, sender: "recipient", type: "text", text: "b", time: "10:01" }];
    expect(getNextMessageId(a, b, [], [], [])).toBe(10);
    expect(getNextMessageId([], [], [], [], [])).toBe(1);
  });

  it("formats photo labels for single and stacked messages", () => {
    expect(photoMessageDisplayLabel(mkPhoto({ id: 1, sourcePhotoId: 1 }))).toBe("Beach");
    expect(
      photoMessageDisplayLabel(
        mkPhoto({
          id: 2,
          sourcePhotoId: 2,
          assets: [
            { id: "a", kind: "preset", label: "A", previewClass: "bg-red-400" },
            { id: "b", kind: "preset", label: "B", previewClass: "bg-blue-400" },
          ],
        }),
      ),
    ).toBe("2 photos");
  });

  describe("time-aware helpers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-10T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("computes effective permissions using canonical source photo policy", () => {
      const source = mkPhoto({
        id: 2,
        sourcePhotoId: 42,
        permissions: {
          status: "active",
          canForward: false,
          viewOnce: true,
          expiresAt: Date.now() - 1_000,
          canDownload: false,
          hasCoSubject: true,
        },
      });
      const forwardedCopy = mkPhoto({
        id: 7,
        sender: "recipient",
        sourcePhotoId: 42,
        permissions: {
          status: "active",
          canForward: true,
          viewOnce: false,
          expiresAt: null,
          canDownload: true,
          hasCoSubject: false,
        },
      });
      const main: ChatMessage[] = [source];

      const effective = getEffectivePermissions(main, forwardedCopy);
      expect(effective.status).toBe("revoked");
      expect(effective.canForward).toBe(false);
      expect(effective.canDownload).toBe(false);
      expect(effective.hasCoSubject).toBe(true);
      expect(effective.viewOnce).toBe(true);
    });

    it("returns source policy flags without effective-status mutation", () => {
      const source = mkPhoto({
        id: 3,
        sourcePhotoId: 3,
        permissions: {
          status: "active",
          canForward: false,
          viewOnce: true,
          expiresAt: Date.now() + 60_000,
          canDownload: false,
          hasCoSubject: true,
        },
      });
      const policy = getSourcePolicyPermissions([source], source);
      expect(policy).toMatchObject({
        canForward: false,
        canDownload: false,
        viewOnce: true,
        hasCoSubject: true,
      });
    });

    it("flags expired permissions and generates countdown text", () => {
      expect(
        isPhotoExpired({
          status: "active",
          canForward: true,
          viewOnce: false,
          expiresAt: Date.now() - 1,
          canDownload: true,
          hasCoSubject: false,
        }),
      ).toBe(true);

      const countdown = formatExpiryCountdown(Date.now() + 90_000);
      expect(countdown.startsWith("Expires in ")).toBe(true);
    });
  });

  it("detects consumed view-once photos in main and forwarded threads", () => {
    const main = [mkPhoto({ id: 10, sourcePhotoId: 10 })];
    const forwarded = [mkPhoto({ id: 21, sender: "recipient", sourcePhotoId: 10 })];

    expect(isViewOnceConsumedForSourcePhoto(main, forwarded, [10], 10)).toBe(true);
    expect(isViewOnceConsumedForSourcePhoto(main, forwarded, [21], 10)).toBe(true);
    expect(isViewOnceConsumedForSourcePhoto(main, forwarded, [], 10)).toBe(false);
  });

  it("uses the message copy when the canonical source is not present on the main thread", () => {
    const standalone = mkPhoto({
      id: 5,
      sourcePhotoId: 5,
      permissions: {
        status: "active",
        canForward: false,
        viewOnce: false,
        expiresAt: null,
        canDownload: true,
        hasCoSubject: false,
      },
    });
    expect(getEffectivePermissions([], standalone).canForward).toBe(false);
    expect(getSourcePolicyPermissions([], standalone).canForward).toBe(false);
  });

  it("returns a locale time label", () => {
    expect(getTimeLabel()).toMatch(/^\d{1,2}:\d{2}$/);
  });

  describe("triggerPhotoDownload", () => {
    it("anchors an upload asset to the preview URL and triggers download", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((n) => n);
      const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((n) => n);

      triggerPhotoDownload({
        id: "u1",
        kind: "upload",
        label: "Holiday photo!",
        previewUrl: "data:image/png;base64,xx",
      });

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("builds a canvas data URL for preset assets", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const toDataURLSpy = vi
        .spyOn(HTMLCanvasElement.prototype, "toDataURL")
        .mockReturnValue("data:image/png;base64,abc");
      const ctx = {
        fillStyle: "",
        fillRect: vi.fn(),
        font: "",
        textAlign: "center" as CanvasTextAlign,
        fillText: vi.fn(),
      };
      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, "getContext")
        .mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

      triggerPhotoDownload({
        id: "p1",
        kind: "preset",
        label: "Beach",
        previewClass: "bg-slate-600",
      });

      expect(ctx.fillRect).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalledWith("Beach", 50, 55);
      expect(toDataURLSpy).toHaveBeenCalledWith("image/png");
      expect(clickSpy).toHaveBeenCalledTimes(1);

      clickSpy.mockRestore();
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
    });

    it("still downloads when canvas getContext is unavailable", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
      const toDataURLSpy = vi
        .spyOn(HTMLCanvasElement.prototype, "toDataURL")
        .mockReturnValue("data:image/png;base64,empty");

      triggerPhotoDownload({
        id: "p2",
        kind: "preset",
        label: "Solo",
        previewClass: "bg-slate-700",
      });

      expect(toDataURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalledTimes(1);

      clickSpy.mockRestore();
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
    });

    it("iterates triggerPhotoDownloads over every asset", () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const ctx = {
        fillStyle: "",
        fillRect: vi.fn(),
        font: "",
        textAlign: "center" as CanvasTextAlign,
        fillText: vi.fn(),
      };
      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, "getContext")
        .mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
      const toDataURLSpy = vi
        .spyOn(HTMLCanvasElement.prototype, "toDataURL")
        .mockReturnValue("data:image/png;base64,x");

      triggerPhotoDownloads([
        {
          id: "a",
          kind: "preset",
          label: "A",
          previewClass: "bg-red-500",
        },
        {
          id: "b",
          kind: "preset",
          label: "B",
          previewClass: "bg-blue-500",
        },
      ]);
      expect(clickSpy).toHaveBeenCalledTimes(2);

      clickSpy.mockRestore();
      getContextSpy.mockRestore();
      toDataURLSpy.mockRestore();
    });
  });
});
