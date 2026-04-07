import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequestAccessPanel } from "@/components/photo-revocation-demo/RequestAccessPanel";
import { RequestRevocationPanel } from "@/components/photo-revocation-demo/RequestRevocationPanel";

describe("RequestAccessPanel", () => {
  it("renders label and wires textarea + actions", () => {
    const onDraftChange = vi.fn();
    const onCancel = vi.fn();
    const onSendRequest = vi.fn();
    render(
      <RequestAccessPanel
        assetLabel="Beach"
        draft=""
        onDraftChange={onDraftChange}
        onCancel={onCancel}
        onSendRequest={onSendRequest}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/restore access/i), {
      target: { value: "Please restore access" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));

    expect(screen.getByText("Beach")).toBeInTheDocument();
    expect(onDraftChange).toHaveBeenCalledWith("Please restore access");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSendRequest).toHaveBeenCalledTimes(1);
  });
});

describe("RequestRevocationPanel", () => {
  it("shows safety note and wires send/cancel", () => {
    const onDraftChange = vi.fn();
    const onCancel = vi.fn();
    const onSendRequest = vi.fn();
    render(
      <RequestRevocationPanel
        assetLabel="City"
        draft=""
        onDraftChange={onDraftChange}
        onCancel={onCancel}
        onSendRequest={onSendRequest}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/prefer this photo not to be shared/i), {
      target: { value: "Please revoke this photo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: /send request/i }));

    expect(screen.getByText(/offline copies may already exist/i)).toBeInTheDocument();
    expect(onDraftChange).toHaveBeenCalledWith("Please revoke this photo");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSendRequest).toHaveBeenCalledTimes(1);
  });
});
