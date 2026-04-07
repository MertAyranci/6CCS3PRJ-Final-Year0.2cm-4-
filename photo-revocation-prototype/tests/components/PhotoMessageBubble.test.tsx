import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OpenPhotoMenuState, PhotoMessage } from "@/lib/photo-revocation-demo/types";
import { PhotoMessageBubble } from "@/components/photo-revocation-demo/PhotoMessageBubble";

function buildMessage(overrides?: Partial<PhotoMessage>): PhotoMessage {
  return {
    id: 2,
    sender: "sender",
    type: "photo",
    assets: [{ id: "a", kind: "preset", label: "Beach", previewClass: "bg-slate-600" }],
    caption: "Shared photo",
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
    ...overrides,
  };
}

type HarnessProps = {
  phoneOwner: "sender" | "recipient";
  message?: PhotoMessage;
  consumedViewOnce?: number[];
  updateSelectedPhotoPermissions?: ReturnType<typeof vi.fn>;
  forwardPhotoMessage?: ReturnType<typeof vi.fn>;
  setTimeLimitModalOpen?: ReturnType<typeof vi.fn>;
  setAccessRequestOpen?: ReturnType<typeof vi.fn>;
  setAccessRequestDraft?: ReturnType<typeof vi.fn>;
};

function BubbleHarness({
  phoneOwner,
  message = buildMessage(),
  consumedViewOnce = [],
  updateSelectedPhotoPermissions = vi.fn(),
  forwardPhotoMessage = vi.fn(),
  setTimeLimitModalOpen = vi.fn(),
  setAccessRequestOpen = vi.fn(),
  setAccessRequestDraft = vi.fn(),
}: HarnessProps) {
  const [openPhotoMenu, setOpenPhotoMenu] = useState<OpenPhotoMenuState | null>(null);
  const mainMessages = [message];

  return (
    <PhotoMessageBubble
      message={message}
      phoneOwner={phoneOwner}
      timestampTone="text-slate-400"
      thread="main"
      mainMessages={mainMessages}
      forwardedMessages={[]}
      consumedViewOnce={consumedViewOnce}
      openPhotoMenu={openPhotoMenu}
      setOpenPhotoMenu={setOpenPhotoMenu}
      setSelectedPhotoId={vi.fn()}
      setOpenViewOnce={vi.fn()}
      forwardPhotoMessage={forwardPhotoMessage}
      updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      setTimeLimitModalOpen={setTimeLimitModalOpen}
      setReplyingTo={vi.fn()}
      setRevocationRequestOpen={vi.fn()}
      setRevocationRequestDraft={vi.fn()}
      setAccessRequestOpen={setAccessRequestOpen}
      setAccessRequestDraft={setAccessRequestDraft}
    />
  );
}

describe("PhotoMessageBubble", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets sender open revocation menu and block forwarding", () => {
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Block forwarding" }));

    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({ canForward: false });
  });

  it("shows request access action for recipient on revoked photo", () => {
    const setAccessRequestOpen = vi.fn();
    const setAccessRequestDraft = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={buildMessage({
          permissions: {
            status: "revoked",
            canForward: true,
            viewOnce: false,
            expiresAt: null,
            canDownload: true,
            hasCoSubject: false,
          },
        })}
        setAccessRequestOpen={setAccessRequestOpen}
        setAccessRequestDraft={setAccessRequestDraft}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Request access" }));

    expect(setAccessRequestOpen).toHaveBeenCalledTimes(1);
    expect(setAccessRequestDraft).toHaveBeenCalledWith("");
  });

  it("lets sender revoke photo access from the revocation submenu", () => {
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Revoke photo access" }));
    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({ status: "revoked" });
  });

  it("lets sender restore photo access when the stored policy is revoked", () => {
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        message={buildMessage({
          permissions: {
            status: "revoked",
            canForward: true,
            viewOnce: false,
            expiresAt: null,
            canDownload: true,
            hasCoSubject: false,
          },
        })}
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore photo access" }));
    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({ status: "active" });
  });

  it("clears an expired time limit when restoring access from the revocation submenu", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00.000Z"));
    const expiredAt = Date.now() - 60_000;
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        message={buildMessage({
          permissions: {
            status: "active",
            canForward: true,
            viewOnce: false,
            expiresAt: expiredAt,
            canDownload: true,
            hasCoSubject: false,
          },
        })}
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Restore photo access" }));
    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({
      status: "active",
      expiresAt: null,
    });
  });

  it("removes a future time limit from the revocation submenu", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00.000Z"));
    const futureExpiry = Date.now() + 3600_000;
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        message={buildMessage({
          permissions: {
            status: "active",
            canForward: true,
            viewOnce: false,
            expiresAt: futureExpiry,
            canDownload: true,
            hasCoSubject: false,
          },
        })}
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove time limit" }));
    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({ expiresAt: null });
  });

  it("opens the time limit modal from the revocation submenu", () => {
    const setTimeLimitModalOpen = vi.fn();
    render(
      <BubbleHarness phoneOwner="sender" setTimeLimitModalOpen={setTimeLimitModalOpen} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Set time limit" }));
    expect(setTimeLimitModalOpen).toHaveBeenCalledWith(true);
  });

  it("lets sender block download from the revocation submenu", () => {
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Block download" }));
    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({ canDownload: false });
  });

  it("disables Forward for recipient when forwarding is not allowed", () => {
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={buildMessage({
          sender: "sender",
          permissions: {
            status: "active",
            canForward: false,
            viewOnce: false,
            expiresAt: null,
            canDownload: true,
            hasCoSubject: false,
          },
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });

  it("forwards the photo for recipient when forwarding is allowed", () => {
    const forwardPhotoMessage = vi.fn();
    const message = buildMessage({
      sender: "sender",
      permissions: {
        status: "active",
        canForward: true,
        viewOnce: false,
        expiresAt: null,
        canDownload: true,
        hasCoSubject: false,
      },
    });
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={message}
        forwardPhotoMessage={forwardPhotoMessage}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(forwardPhotoMessage).toHaveBeenCalledWith(message);
  });

  it("disables Download for recipient when download is not allowed", () => {
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={buildMessage({
          sender: "sender",
          permissions: {
            status: "active",
            canForward: true,
            viewOnce: false,
            expiresAt: null,
            canDownload: false,
            hasCoSubject: false,
          },
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled();
  });

  it("shows the non-visible state for recipient when access is revoked (non view-once)", () => {
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={buildMessage({
          sender: "sender",
          permissions: {
            status: "revoked",
            canForward: true,
            viewOnce: false,
            expiresAt: null,
            canDownload: true,
            hasCoSubject: false,
          },
        })}
      />,
    );

    expect(screen.getByText("This photo is no longer visible.")).toBeInTheDocument();
  });

  it("shows opened-once state for recipient after a view-once photo is consumed", () => {
    const msg = buildMessage({
      id: 99,
      sender: "sender",
      permissions: {
        status: "active",
        canForward: false,
        viewOnce: true,
        expiresAt: null,
        canDownload: false,
        hasCoSubject: false,
      },
    });
    render(
      <BubbleHarness phoneOwner="recipient" message={msg} consumedViewOnce={[99]} />,
    );

    expect(screen.getByText("Opened once")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "View once photo already opened" }),
    ).toBeInTheDocument();
  });
});
