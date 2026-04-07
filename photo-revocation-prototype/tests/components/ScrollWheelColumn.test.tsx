import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ROW_HEIGHT } from "@/lib/photo-revocation-demo/constants";
import { ScrollWheelColumn } from "@/components/photo-revocation-demo/ScrollWheelColumn";

describe("ScrollWheelColumn", () => {
  it("cycles value via keyboard arrows", () => {
    const onChange = vi.fn();
    render(<ScrollWheelColumn min={0} max={2} value={2} onChange={onChange} label="Min" />);

    const spinbutton = screen.getByRole("spinbutton", { name: "Min" });
    fireEvent.keyDown(spinbutton, { key: "ArrowDown" });
    fireEvent.keyDown(spinbutton, { key: "ArrowUp" });

    expect(onChange).toHaveBeenNthCalledWith(1, 0);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("updates from scroll position changes", () => {
    const onChange = vi.fn();
    render(<ScrollWheelColumn min={0} max={5} value={0} onChange={onChange} label="Sec" />);

    const spinbutton = screen.getByRole("spinbutton", { name: "Sec" });
    Object.defineProperty(spinbutton, "scrollTop", {
      value: ROW_HEIGHT * 3,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(spinbutton);

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
