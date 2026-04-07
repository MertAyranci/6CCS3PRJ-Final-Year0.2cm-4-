import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ViewOnceInChatModal } from "@/components/photo-revocation-demo/ViewOnceInChatModal";

const openViewOnceMessage = {
  id: 12,
  sender: "sender" as const,
  type: "photo" as const,
  assets: [{ id: "a", kind: "preset" as const, label: "Beach", previewClass: "bg-slate-500" }],
  caption: "Shared",
  time: "10:00",
  permissions: {
    status: "active" as const,
    canForward: true,
    viewOnce: true,
    expiresAt: null,
    canDownload: true,
    hasCoSubject: false,
  },
  sourcePhotoId: 12,
};

describe("ViewOnceInChatModal", () => {
  it("marks message consumed for recipient when closing", () => {
    const setOpenViewOnce = vi.fn();
    const setConsumedViewOnce = vi.fn();
    render(
      <ViewOnceInChatModal
        phoneOwner="recipient"
        thread="main"
        openViewOnce={{ owner: "recipient", thread: "main", messageId: 12 }}
        openViewOnceMessage={openViewOnceMessage}
        setOpenViewOnce={setOpenViewOnce}
        setConsumedViewOnce={setConsumedViewOnce}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(setConsumedViewOnce).toHaveBeenCalledTimes(1);
    const updater = setConsumedViewOnce.mock.calls[0][0] as (v: number[]) => number[];
    expect(updater([])).toEqual([12]);
    expect(setOpenViewOnce).toHaveBeenCalledWith(null);
  });

  it("does not mark consumed for sender preview", () => {
    const setOpenViewOnce = vi.fn();
    const setConsumedViewOnce = vi.fn();
    render(
      <ViewOnceInChatModal
        phoneOwner="sender"
        thread="main"
        openViewOnce={{ owner: "sender", thread: "main", messageId: 12 }}
        openViewOnceMessage={openViewOnceMessage}
        setOpenViewOnce={setOpenViewOnce}
        setConsumedViewOnce={setConsumedViewOnce}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(setConsumedViewOnce).not.toHaveBeenCalled();
    expect(setOpenViewOnce).toHaveBeenCalledWith(null);
  });

  it("marks consumed for co-owner and renders stacked assets", () => {
    const setOpenViewOnce = vi.fn();
    const setConsumedViewOnce = vi.fn();
    const multi = {
      ...openViewOnceMessage,
      assets: [
        openViewOnceMessage.assets[0]!,
        {
          id: "b",
          kind: "preset" as const,
          label: "City",
          previewClass: "bg-slate-600",
        },
      ],
    };
    render(
      <ViewOnceInChatModal
        phoneOwner="coOwner"
        thread="main"
        openViewOnce={{ owner: "coOwner", thread: "main", messageId: 12 }}
        openViewOnceMessage={multi}
        setOpenViewOnce={setOpenViewOnce}
        setConsumedViewOnce={setConsumedViewOnce}
      />,
    );

    expect(screen.getByText("Co-subject view once")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("dialog", { name: "Co-subject view once" }),
    );
    expect(setConsumedViewOnce).toHaveBeenCalled();
    expect(setOpenViewOnce).toHaveBeenCalledWith(null);
  });
});
