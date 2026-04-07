import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerView } from "@/components/photo-revocation-demo/ComposerView";

describe("ComposerView", () => {
  it("calls close and send callbacks", () => {
    const onClose = vi.fn();
    const onSendConfiguredPhoto = vi.fn();
    render(
      <ComposerView
        draftPhotos={[{ id: "a", kind: "preset", label: "Beach", previewClass: "bg-slate-700" }]}
        draftCaption="Caption"
        onDraftCaptionChange={vi.fn()}
        draftPermissions={{
          status: "active",
          canForward: true,
          viewOnce: false,
          expiresAt: null,
          canDownload: true,
          hasCoSubject: false,
        }}
        setDraftPermissions={vi.fn()}
        draftTimeLimit={{ days: 0, hours: 0, minutes: 5, seconds: 0 }}
        setDraftTimeLimit={vi.fn()}
        draftTimeLimitOpen={false}
        setDraftTimeLimitOpen={vi.fn()}
        onClose={onClose}
        onSendConfiguredPhoto={onSendConfiguredPhoto}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Send photo" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSendConfiguredPhoto).toHaveBeenCalledTimes(1);
  });

  it("requests permission mutations through setter functions", () => {
    const setDraftPermissions = vi.fn();
    const setDraftTimeLimitOpen = vi.fn();
    render(
      <ComposerView
        draftPhotos={[{ id: "a", kind: "preset", label: "Beach", previewClass: "bg-slate-700" }]}
        draftCaption=""
        onDraftCaptionChange={vi.fn()}
        draftPermissions={{
          status: "active",
          canForward: false,
          viewOnce: false,
          expiresAt: null,
          canDownload: true,
          hasCoSubject: false,
        }}
        setDraftPermissions={setDraftPermissions}
        draftTimeLimit={{ days: 0, hours: 0, minutes: 5, seconds: 0 }}
        setDraftTimeLimit={vi.fn()}
        draftTimeLimitOpen={false}
        setDraftTimeLimitOpen={setDraftTimeLimitOpen}
        onClose={vi.fn()}
        onSendConfiguredPhoto={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /view once/i }));
    fireEvent.click(screen.getByRole("button", { name: /no forward/i }));
    fireEvent.click(screen.getByRole("button", { name: /no expiry/i }));

    expect(setDraftPermissions).toHaveBeenCalled();
    expect(typeof setDraftPermissions.mock.calls[0][0]).toBe("function");
    expect(setDraftTimeLimitOpen).toHaveBeenCalledTimes(1);
  });

  it("covers download and co-subject toggles, multi-photo preview, caption input, and draft time wheels", () => {
    const setDraftTimeLimit = vi.fn();
    const onDraftCaptionChange = vi.fn();
    const assets = [
      { id: "a", kind: "preset" as const, label: "Beach", previewClass: "bg-slate-700" },
      { id: "b", kind: "preset" as const, label: "City", previewClass: "bg-slate-600" },
    ];
    render(
      <ComposerView
        draftPhotos={assets}
        draftCaption=""
        onDraftCaptionChange={onDraftCaptionChange}
        draftPermissions={{
          status: "active",
          canForward: true,
          viewOnce: false,
          expiresAt: null,
          canDownload: true,
          hasCoSubject: false,
        }}
        setDraftPermissions={vi.fn()}
        draftTimeLimit={{ days: 0, hours: 0, minutes: 0, seconds: 0 }}
        setDraftTimeLimit={setDraftTimeLimit}
        draftTimeLimitOpen
        setDraftTimeLimitOpen={vi.fn()}
        onClose={vi.fn()}
        onSendConfiguredPhoto={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /download/i }));
    fireEvent.click(screen.getByRole("button", { name: /co-subject/i }));

    fireEvent.change(screen.getByPlaceholderText("Add a caption..."), {
      target: { value: "Caption text" },
    });
    expect(onDraftCaptionChange).toHaveBeenCalledWith("Caption text");

    const spinD = screen.getByRole("spinbutton", { name: "D" });
    const spinH = screen.getByRole("spinbutton", { name: "H" });
    const spinM = screen.getByRole("spinbutton", { name: "M" });
    const spinS = screen.getByRole("spinbutton", { name: "S" });
    fireEvent.keyDown(spinD, { key: "ArrowDown" });
    fireEvent.keyDown(spinH, { key: "ArrowDown" });
    fireEvent.keyDown(spinM, { key: "ArrowDown" });
    fireEvent.keyDown(spinS, { key: "ArrowDown" });

    expect(setDraftTimeLimit).toHaveBeenCalled();
    expect(setDraftTimeLimit.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
