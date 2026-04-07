import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeLimitModal } from "@/components/photo-revocation-demo/TimeLimitModal";

describe("TimeLimitModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <TimeLimitModal
        panelTimeLimit={{ days: 0, hours: 0, minutes: 5, seconds: 0 }}
        setPanelTimeLimit={vi.fn()}
        onClose={onClose}
        onApply={vi.fn()}
        updateSelectedPhotoPermissions={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies expiry and activates status when duration is valid", () => {
    const onApply = vi.fn();
    const update = vi.fn();
    render(
      <TimeLimitModal
        panelTimeLimit={{ days: 0, hours: 0, minutes: 1, seconds: 0 }}
        setPanelTimeLimit={vi.fn()}
        onClose={vi.fn()}
        onApply={onApply}
        updateSelectedPhotoPermissions={update}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(update).toHaveBeenCalledTimes(1);
    const arg = update.mock.calls[0][0] as { status: string; expiresAt: number };
    expect(arg.status).toBe("active");
    expect(arg.expiresAt).toBe(Date.now() + 60_000);
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("keeps Apply disabled for zero duration", () => {
    render(
      <TimeLimitModal
        panelTimeLimit={{ days: 0, hours: 0, minutes: 0, seconds: 0 }}
        setPanelTimeLimit={vi.fn()}
        onClose={vi.fn()}
        onApply={vi.fn()}
        updateSelectedPhotoPermissions={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("routes each wheel column through setPanelTimeLimit", () => {
    const setPanelTimeLimit = vi.fn();
    render(
      <TimeLimitModal
        panelTimeLimit={{ days: 1, hours: 2, minutes: 3, seconds: 4 }}
        setPanelTimeLimit={setPanelTimeLimit}
        onClose={vi.fn()}
        onApply={vi.fn()}
        updateSelectedPhotoPermissions={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Days" }), {
      key: "ArrowUp",
    });
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Hours" }), {
      key: "ArrowUp",
    });
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Min" }), {
      key: "ArrowUp",
    });
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Sec" }), {
      key: "ArrowUp",
    });

    expect(setPanelTimeLimit).toHaveBeenCalled();
    expect(setPanelTimeLimit.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
