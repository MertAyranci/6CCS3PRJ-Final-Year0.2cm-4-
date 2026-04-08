import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ChatMessage,
  ConversationThread,
  OpenPhotoMenuState,
  Participant,
  PhotoMessage,
} from "@/lib/photo-revocation-demo/types";
import { PhotoMessageBubble } from "@/components/photo-revocation-demo/PhotoMessageBubble";
import * as helpers from "@/lib/photo-revocation-demo/helpers";

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
  phoneOwner: Participant;
  thread?: ConversationThread;
  message?: PhotoMessage;
  mainMessages?: ChatMessage[];
  forwardedMessages?: ChatMessage[];
  consumedViewOnce?: number[];
  updateSelectedPhotoPermissions?: ReturnType<typeof vi.fn>;
  forwardPhotoMessage?: ReturnType<typeof vi.fn>;
  setTimeLimitModalOpen?: ReturnType<typeof vi.fn>;
  setAccessRequestOpen?: ReturnType<typeof vi.fn>;
  setAccessRequestDraft?: ReturnType<typeof vi.fn>;
  setOpenViewOnce?: ReturnType<typeof vi.fn>;
  setRevocationRequestOpen?: ReturnType<typeof vi.fn>;
  setRevocationRequestDraft?: ReturnType<typeof vi.fn>;
  setReplyingTo?: ReturnType<typeof vi.fn>;
};

function BubbleHarness({
  phoneOwner,
  thread = "main",
  message = buildMessage(),
  mainMessages,
  forwardedMessages = [],
  consumedViewOnce = [],
  updateSelectedPhotoPermissions = vi.fn(),
  forwardPhotoMessage = vi.fn(),
  setTimeLimitModalOpen = vi.fn(),
  setAccessRequestOpen = vi.fn(),
  setAccessRequestDraft = vi.fn(),
  setOpenViewOnce = vi.fn(),
  setRevocationRequestOpen = vi.fn(),
  setRevocationRequestDraft = vi.fn(),
  setReplyingTo = vi.fn(),
}: HarnessProps) {
  const [openPhotoMenu, setOpenPhotoMenu] = useState<OpenPhotoMenuState | null>(null);
  const resolvedMain = mainMessages ?? [message];

  return (
    <PhotoMessageBubble
      message={message}
      phoneOwner={phoneOwner}
      timestampTone="text-slate-400"
      thread={thread}
      mainMessages={resolvedMain}
      forwardedMessages={forwardedMessages}
      consumedViewOnce={consumedViewOnce}
      openPhotoMenu={openPhotoMenu}
      setOpenPhotoMenu={setOpenPhotoMenu}
      setSelectedPhotoId={vi.fn()}
      setOpenViewOnce={setOpenViewOnce}
      forwardPhotoMessage={forwardPhotoMessage}
      updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      setTimeLimitModalOpen={setTimeLimitModalOpen}
      setReplyingTo={setReplyingTo}
      setRevocationRequestOpen={setRevocationRequestOpen}
      setRevocationRequestDraft={setRevocationRequestDraft}
      setAccessRequestOpen={setAccessRequestOpen}
      setAccessRequestDraft={setAccessRequestDraft}
    />
  );
}

describe("PhotoMessageBubble", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(helpers, "triggerPhotoDownloads").mockImplementation(() => {});
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

  it("lets sender allow download again after it was blocked", () => {
    const updateSelectedPhotoPermissions = vi.fn();
    render(
      <BubbleHarness
        phoneOwner="sender"
        message={buildMessage({
          permissions: {
            status: "active",
            canForward: true,
            viewOnce: false,
            expiresAt: null,
            canDownload: false,
            hasCoSubject: false,
          },
        })}
        updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Revocation permissions" }));
    fireEvent.click(screen.getByRole("button", { name: "Allow download" }));
    expect(updateSelectedPhotoPermissions).toHaveBeenCalledWith({ canDownload: true });
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

  it("forwards from the secondary thread when the forwarded recipient acts on a forwarded copy", () => {
    const forwardPhotoMessage = vi.fn();
    const canonical = buildMessage({
      id: 2,
      sourcePhotoId: 2,
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
    const forwardedCopy = buildMessage({
      id: 50,
      sender: "recipient",
      sourcePhotoId: 2,
      caption: "Forwarded: Shared photo",
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
        phoneOwner="forwardedRecipient"
        thread="forwarded"
        message={forwardedCopy}
        mainMessages={[canonical]}
        forwardPhotoMessage={forwardPhotoMessage}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(forwardPhotoMessage).toHaveBeenCalledWith(forwardedCopy);
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

  it("invokes bulk download for the sender when download is permitted", () => {
    render(<BubbleHarness phoneOwner="sender" />);

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(helpers.triggerPhotoDownloads).toHaveBeenCalledTimes(1);
    expect(helpers.triggerPhotoDownloads).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "a" })]),
    );
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

  it("opens the view-once modal hook for the recipient when they tap Open", () => {
    const setOpenViewOnce = vi.fn();
    const msg = buildMessage({
      id: 40,
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
      <BubbleHarness
        phoneOwner="recipient"
        message={msg}
        setOpenViewOnce={setOpenViewOnce}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /View once/i }));
    expect(setOpenViewOnce).toHaveBeenCalledWith({
      owner: "recipient",
      thread: "main",
      messageId: 40,
    });
  });

  it("shows the sender-side acknowledgement when the recipient has consumed a view-once copy", () => {
    const msg = buildMessage({
      id: 2,
      sender: "sender",
      sourcePhotoId: 2,
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
      <BubbleHarness
        phoneOwner="sender"
        message={msg}
        consumedViewOnce={[2]}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "View once photo was opened; tap to preview your copy",
      }),
    ).toBeInTheDocument();
  });

  it("renders the co-subject depicted-person card and opens the modal when active", () => {
    const setOpenViewOnce = vi.fn();
    const msg = buildMessage({
      permissions: {
        status: "active",
        canForward: true,
        viewOnce: false,
        expiresAt: null,
        canDownload: true,
        hasCoSubject: true,
      },
    });
    render(
      <BubbleHarness
        phoneOwner="coOwner"
        message={msg}
        setOpenViewOnce={setOpenViewOnce}
      />,
    );

    expect(screen.getByText("You are depicted in this photo")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /You are depicted in this photo/i }),
    );
    expect(setOpenViewOnce).toHaveBeenCalledWith({
      owner: "coOwner",
      thread: "main",
      messageId: msg.id,
    });
  });

  it("shows revoked copy on the co-subject card when access is no longer active", () => {
    render(
      <BubbleHarness
        phoneOwner="coOwner"
        message={buildMessage({
          permissions: {
            status: "revoked",
            canForward: false,
            viewOnce: false,
            expiresAt: null,
            canDownload: false,
            hasCoSubject: true,
          },
        })}
      />,
    );

    expect(screen.getByText("Access has been revoked.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /You are depicted in this photo/i }),
    ).toBeDisabled();
  });

  it("opens the co-subject revocation request flow from the actions menu", () => {
    const setRevocationRequestOpen = vi.fn();
    const setRevocationRequestDraft = vi.fn();
    const msg = buildMessage({
      permissions: {
        status: "active",
        canForward: true,
        viewOnce: false,
        expiresAt: null,
        canDownload: true,
        hasCoSubject: true,
      },
    });
    render(
      <BubbleHarness
        phoneOwner="coOwner"
        message={msg}
        setRevocationRequestOpen={setRevocationRequestOpen}
        setRevocationRequestDraft={setRevocationRequestDraft}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Request revocation" }));

    expect(setRevocationRequestOpen).toHaveBeenCalledWith({
      assetLabel: "Beach",
      sourcePhotoId: msg.sourcePhotoId,
    });
    expect(setRevocationRequestDraft).toHaveBeenCalledWith("");
  });

  it("starts a reply from the actions menu with the correct reply metadata", () => {
    const setReplyingTo = vi.fn();
    const msg = buildMessage({ id: 7 });
    render(
      <BubbleHarness phoneOwner="recipient" message={msg} setReplyingTo={setReplyingTo} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open photo options" }));
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));

    expect(setReplyingTo).toHaveBeenCalledWith({
      owner: "recipient",
      messageId: 7,
      thread: "main",
      assetLabel: "Beach",
      asset: msg.assets[0],
    });
  });

  it("toggles permission details open and shows chip labels", () => {
    render(<BubbleHarness phoneOwner="sender" />);

    fireEvent.click(screen.getByRole("button", { name: /Show permission details/i }));
    const toggle = screen.getByRole("button", { name: /Hide permission details/i });
    expect(toggle).toBeInTheDocument();

    const chipBar = toggle.nextElementSibling as HTMLElement | null;
    expect(chipBar).toBeTruthy();
    expect(within(chipBar!).getByText("Visible")).toBeInTheDocument();
    expect(within(chipBar!).getByText("Forwarding allowed")).toBeInTheDocument();
  });

  it("closes the options menu when the toggle is pressed a second time", () => {
    render(<BubbleHarness phoneOwner="sender" />);
    const toggle = screen.getByRole("button", { name: "Open photo options" });

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Reply" })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByRole("button", { name: "Reply" })).not.toBeInTheDocument();
  });

  it("opens the in-chat lightbox when a multi-asset stack thumbnail is activated", () => {
    const msg = buildMessage({
      assets: [
        { id: "x", kind: "preset", label: "One", previewClass: "bg-red-500" },
        { id: "y", kind: "preset", label: "Two", previewClass: "bg-blue-500" },
      ],
    });
    render(<BubbleHarness phoneOwner="sender" message={msg} />);

    fireEvent.click(screen.getByRole("button", { name: "View photo 1 full size" }));
    expect(screen.getByRole("dialog", { name: "Photo gallery" })).toBeInTheDocument();
  });

  it("shows the view-once tick inside expanded permission details after consumption", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
    const msg = buildMessage({
      id: 5,
      sender: "sender",
      sourcePhotoId: 5,
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
      <BubbleHarness
        phoneOwner="sender"
        message={msg}
        consumedViewOnce={[5]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Show permission details/i }));
    const toggle = screen.getByRole("button", { name: /Hide permission details/i });
    const chipBar = toggle.nextElementSibling as HTMLElement;
    expect(within(chipBar).getByText("View once")).toBeInTheDocument();
    expect(chipBar.querySelector("svg")).toBeTruthy();
  });

  it("shows the countdown chip when a time limit exists on the canonical photo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00.000Z"));
    const expiresAt = Date.now() + 3_600_000;
    const msg = buildMessage({
      permissions: {
        status: "active",
        canForward: true,
        viewOnce: false,
        expiresAt,
        canDownload: true,
        hasCoSubject: false,
      },
    });
    render(<BubbleHarness phoneOwner="sender" message={msg} />);

    fireEvent.click(screen.getByRole("button", { name: /Show permission details/i }));
    const toggle = screen.getByRole("button", { name: /Hide permission details/i });
    const chipBar = toggle.nextElementSibling as HTMLElement;
    expect(within(chipBar).getByText(/expires in/i)).toBeInTheDocument();
  });

  it("labels the review chip as view-once unavailable when access is revoked but the policy was view-once", () => {
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={buildMessage({
          sender: "sender",
          permissions: {
            status: "revoked",
            canForward: false,
            viewOnce: true,
            expiresAt: null,
            canDownload: false,
            hasCoSubject: false,
          },
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Show permission details/i }));
    const toggle = screen.getByRole("button", { name: /Hide permission details/i });
    const chipBar = toggle.nextElementSibling as HTMLElement;
    expect(within(chipBar).getByText("View once unavailable")).toBeInTheDocument();
  });

  it("shows the recipient-specific caption when the effective status is revoked", () => {
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

    expect(
      screen.getByText("Access has been revoked for the recipient device."),
    ).toBeInTheDocument();
  });

  it("shows the access-changed placeholder for a view-once photo when the recipient can no longer view it", () => {
    render(
      <BubbleHarness
        phoneOwner="recipient"
        message={buildMessage({
          sender: "sender",
          permissions: {
            status: "revoked",
            canForward: false,
            viewOnce: true,
            expiresAt: null,
            canDownload: false,
            hasCoSubject: false,
          },
        })}
      />,
    );

    expect(screen.getByText("Access changed")).toBeInTheDocument();
    expect(
      screen.getAllByText("Screenshots, saved copies, or prior viewing may already exist.")
        .length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("marks the review chip as not reviewable when access is revoked on a non-view-once photo", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /Show permission details/i }));
    const toggle = screen.getByRole("button", { name: /Hide permission details/i });
    const chipBar = toggle.nextElementSibling as HTMLElement;
    expect(within(chipBar).getByText("Not reviewable")).toBeInTheDocument();
  });

  it("shows a plain view-once label in expanded chips before the recipient has opened the photo", () => {
    const msg = buildMessage({
      id: 12,
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
    render(<BubbleHarness phoneOwner="recipient" message={msg} />);

    fireEvent.click(screen.getByRole("button", { name: /Show permission details/i }));
    const toggle = screen.getByRole("button", { name: /Hide permission details/i });
    const chipBar = toggle.nextElementSibling as HTMLElement;
    expect(within(chipBar).getByText("View once")).toBeInTheDocument();
    expect(chipBar.querySelector("svg")).toBeNull();
  });
});
