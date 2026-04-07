import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/lib/photo-revocation-demo/types";
import { PrototypeStateSummary } from "@/components/photo-revocation-demo/PrototypeStateSummary";

const mainMessages: ChatMessage[] = [
  {
    id: 2,
    sender: "sender",
    type: "photo",
    assets: [{ id: "beach", kind: "preset", label: "Beach", previewClass: "bg-slate-500" }],
    caption: "Beach",
    time: "09:14",
    permissions: {
      status: "active",
      canForward: true,
      viewOnce: false,
      expiresAt: null,
      canDownload: true,
      hasCoSubject: false,
    },
    sourcePhotoId: 2,
  },
  {
    id: 6,
    sender: "sender",
    type: "photo",
    assets: [{ id: "city", kind: "preset", label: "City", previewClass: "bg-slate-700" }],
    caption: "City",
    time: "09:20",
    permissions: {
      status: "active",
      canForward: false,
      viewOnce: true,
      expiresAt: null,
      canDownload: false,
      hasCoSubject: true,
    },
    sourcePhotoId: 6,
  },
];

describe("PrototypeStateSummary", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders permission table headers and per-photo forwarding status", () => {
    render(
      <PrototypeStateSummary
        selectedPhotoMessage={mainMessages[0]}
        sendHistory={[
          { sourcePhotoId: 2, time: "09:14", summary: "Sent Beach" },
          { sourcePhotoId: 6, time: "09:20", summary: "Sent City" },
        ]}
        mainMessages={mainMessages}
        forwardedMessages={[
          {
            id: 11,
            sender: "recipient",
            type: "photo",
            assets: [{ id: "beach", kind: "preset", label: "Beach", previewClass: "bg-slate-500" }],
            caption: "Forwarded: Beach",
            time: "09:25",
            permissions: mainMessages[0].permissions,
            sourcePhotoId: 2,
          },
        ]}
        consumedViewOnce={[]}
        isViewOnceConsumedForSelectedPhoto={false}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Forwarding" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Download" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Forwarded thread" })).toBeInTheDocument();
    expect(screen.getByText("Not forwarded")).toBeInTheDocument();
    expect(screen.getByText(/09:25/)).toBeInTheDocument();
  });

  it("shows view-once opened, download blocked, and expiry text for the matching row", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    const futureExpiry = Date.now() + 120_000;
    const cityPhoto = mainMessages[1];
    const cityWithExpiry = {
      ...cityPhoto,
      permissions: {
        ...cityPhoto.permissions,
        expiresAt: futureExpiry,
      },
    };
    const extendedMain: ChatMessage[] = [mainMessages[0], cityWithExpiry];

    render(
      <PrototypeStateSummary
        selectedPhotoMessage={cityWithExpiry}
        sendHistory={[{ sourcePhotoId: 6, time: "09:20", summary: "Sent City" }]}
        mainMessages={extendedMain}
        forwardedMessages={[]}
        consumedViewOnce={[6]}
        isViewOnceConsumedForSelectedPhoto
      />,
    );

    expect(screen.getByText("Opened")).toBeInTheDocument();
    expect(screen.getAllByText("Blocked").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/expires in/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders unknown photo when history references a missing source id", () => {
    render(
      <PrototypeStateSummary
        selectedPhotoMessage={mainMessages[0]}
        sendHistory={[{ sourcePhotoId: 999, time: "12:00", summary: "Orphan entry" }]}
        mainMessages={mainMessages}
        forwardedMessages={[]}
        consumedViewOnce={[]}
        isViewOnceConsumedForSelectedPhoto={false}
      />,
    );

    expect(screen.getByText("Unknown photo")).toBeInTheDocument();
  });
});
