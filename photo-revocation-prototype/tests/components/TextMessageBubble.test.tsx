import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextMessageBubble } from "@/components/photo-revocation-demo/TextMessageBubble";

describe("TextMessageBubble", () => {
  it("shows sender response actions for pending access request", () => {
    const onRespondToAccessRequest = vi.fn();
    render(
      <TextMessageBubble
        message={{
          id: 40,
          sender: "recipient",
          type: "text",
          text: "Can I access this again?",
          time: "10:00",
          accessRequestSourcePhotoId: 2,
          accessRequestAssetLabel: "Beach",
          accessRequestStatus: "pending",
        }}
        phoneOwner="sender"
        alignClass="bg-[#202c33]"
        textTone="text-slate-100"
        timestampTone="text-slate-400"
        onRespondToRevocationRequest={vi.fn()}
        onRespondToAccessRequest={onRespondToAccessRequest}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(onRespondToAccessRequest).toHaveBeenCalledWith(40, true, "Beach", 2);
    expect(onRespondToAccessRequest).toHaveBeenCalledWith(40, false, "Beach", 2);
  });

  it("renders completion status text for accepted revocation request", () => {
    render(
      <TextMessageBubble
        message={{
          id: 50,
          sender: "coOwner",
          type: "text",
          text: "Please revoke",
          time: "10:01",
          revocationRequestSourcePhotoId: 2,
          revocationRequestAssetLabel: "Beach",
          revocationRequestStatus: "accepted",
        }}
        phoneOwner="sender"
        alignClass="bg-[#202c33]"
        textTone="text-slate-100"
        timestampTone="text-slate-400"
        onRespondToRevocationRequest={vi.fn()}
        onRespondToAccessRequest={vi.fn()}
      />,
    );

    expect(screen.getByText("Accepted — photo revoked.")).toBeInTheDocument();
  });

  it("renders completion status text for accepted and rejected access requests", () => {
    const { rerender } = render(
      <TextMessageBubble
        message={{
          id: 41,
          sender: "recipient",
          type: "text",
          text: "Please restore",
          time: "10:02",
          accessRequestSourcePhotoId: 2,
          accessRequestAssetLabel: "Beach",
          accessRequestStatus: "accepted",
        }}
        phoneOwner="sender"
        alignClass="bg-[#202c33]"
        textTone="text-slate-100"
        timestampTone="text-slate-400"
        onRespondToRevocationRequest={vi.fn()}
        onRespondToAccessRequest={vi.fn()}
      />,
    );
    expect(screen.getByText("Accepted — access restored.")).toBeInTheDocument();

    rerender(
      <TextMessageBubble
        message={{
          id: 42,
          sender: "recipient",
          type: "text",
          text: "Please restore",
          time: "10:03",
          accessRequestSourcePhotoId: 2,
          accessRequestAssetLabel: "Beach",
          accessRequestStatus: "rejected",
        }}
        phoneOwner="sender"
        alignClass="bg-[#202c33]"
        textTone="text-slate-100"
        timestampTone="text-slate-400"
        onRespondToRevocationRequest={vi.fn()}
        onRespondToAccessRequest={vi.fn()}
      />,
    );
    expect(screen.getByText("Rejected — recipient notified.")).toBeInTheDocument();
  });

  it("renders completion status when the sender rejects a revocation request", () => {
    render(
      <TextMessageBubble
        message={{
          id: 51,
          sender: "coOwner",
          type: "text",
          text: "Please revoke",
          time: "10:04",
          revocationRequestSourcePhotoId: 2,
          revocationRequestAssetLabel: "Beach",
          revocationRequestStatus: "rejected",
        }}
        phoneOwner="sender"
        alignClass="bg-[#202c33]"
        textTone="text-slate-100"
        timestampTone="text-slate-400"
        onRespondToRevocationRequest={vi.fn()}
        onRespondToAccessRequest={vi.fn()}
      />,
    );
    expect(screen.getByText("Rejected — co-subject notified.")).toBeInTheDocument();
  });
});
