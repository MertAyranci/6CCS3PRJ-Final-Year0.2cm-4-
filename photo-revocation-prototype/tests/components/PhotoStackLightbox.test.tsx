import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLayoutEffect, useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoStackLightbox } from "@/components/photo-revocation-demo/PhotoStackLightbox";
import { ChatPanelOverlayContext } from "@/components/photo-revocation-demo/chatPanelPortalContext";
import { presetAlbum } from "@/lib/photo-revocation-demo/constants";

const two = presetAlbum.slice(0, 2);

describe("PhotoStackLightbox", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("returns null when there are no assets", () => {
    const { container } = render(
      <PhotoStackLightbox assets={[]} initialIndex={0} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the gallery dialog and closes from the Close control", () => {
    const onClose = vi.fn();
    render(<PhotoStackLightbox assets={two} initialIndex={0} onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: "Photo gallery" })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and moves between photos with arrows and controls", () => {
    const onClose = vi.fn();
    render(<PhotoStackLightbox assets={two} initialIndex={0} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores swipe below the horizontal threshold", () => {
    render(<PhotoStackLightbox assets={two} initialIndex={0} onClose={vi.fn()} />);
    const prev = screen.getByRole("button", { name: "Previous photo" });
    const touchHost = prev.closest(".touch-pan-y");
    expect(touchHost).toBeTruthy();
    fireEvent.touchStart(touchHost!, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(touchHost!, { changedTouches: [{ clientX: 120 }] });
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("portals into the phone overlay container when the chat context provides it", async () => {
    function Harness() {
      const portalRef = useRef<HTMLDivElement>(null);
      const scrollRef = useRef<HTMLDivElement>(null);
      const [ready, setReady] = useState(false);
      useLayoutEffect(() => {
        setReady(true);
      }, []);
      const value = { portalEl: portalRef, scrollEl: scrollRef };
      return (
        <>
          <div ref={scrollRef} style={{ height: 40, overflow: "auto" }} />
          <div ref={portalRef} data-testid="overlay-root" />
          {ready ? (
            <ChatPanelOverlayContext.Provider value={value}>
              <PhotoStackLightbox assets={two} initialIndex={1} onClose={vi.fn()} />
            </ChatPanelOverlayContext.Provider>
          ) : null}
        </>
      );
    }

    render(<Harness />);
    await waitFor(() => {
      const root = screen.getByTestId("overlay-root");
      expect(root.querySelector('[aria-label="Photo gallery"]')).toBeTruthy();
    });
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
