import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { presetAlbum } from "@/lib/photo-revocation-demo/constants";
import { PickerSheet } from "@/components/photo-revocation-demo/PickerSheet";

describe("PickerSheet", () => {
  it("invokes camera and album hidden inputs when toolbar icons are used", () => {
    const cameraInputRef = createRef<HTMLInputElement>();
    const albumInputRef = createRef<HTMLInputElement>();
    const cameraEl = document.createElement("input");
    const albumEl = document.createElement("input");
    const cameraClick = vi.fn();
    const albumClick = vi.fn();
    cameraEl.click = cameraClick;
    albumEl.click = albumClick;
    cameraInputRef.current = cameraEl;
    albumInputRef.current = albumEl;

    render(
      <PickerSheet
        pickerSelectedPhotos={[]}
        togglePickerPhoto={vi.fn()}
        onClose={vi.fn()}
        cameraInputRef={cameraInputRef}
        albumInputRef={albumInputRef}
        onSendPhotoDirectly={vi.fn()}
        onOpenComposerWithPhotos={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open camera" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose from files" }));

    expect(cameraClick).toHaveBeenCalledTimes(1);
    expect(albumClick).toHaveBeenCalledTimes(1);
  });

  it("toggles preset selection and calls send actions when the parent reflects selection", () => {
    const togglePickerPhoto = vi.fn();
    const onSendPhotoDirectly = vi.fn();
    const onOpenComposerWithPhotos = vi.fn();
    const cameraInputRef = createRef<HTMLInputElement>();
    const albumInputRef = createRef<HTMLInputElement>();

    const { rerender } = render(
      <PickerSheet
        pickerSelectedPhotos={[]}
        togglePickerPhoto={togglePickerPhoto}
        onClose={vi.fn()}
        cameraInputRef={cameraInputRef}
        albumInputRef={albumInputRef}
        onSendPhotoDirectly={onSendPhotoDirectly}
        onOpenComposerWithPhotos={onOpenComposerWithPhotos}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sample photo Beach" }));
    expect(togglePickerPhoto).toHaveBeenCalled();

    rerender(
      <PickerSheet
        pickerSelectedPhotos={[presetAlbum[0]!]}
        togglePickerPhoto={togglePickerPhoto}
        onClose={vi.fn()}
        cameraInputRef={cameraInputRef}
        albumInputRef={albumInputRef}
        onSendPhotoDirectly={onSendPhotoDirectly}
        onOpenComposerWithPhotos={onOpenComposerWithPhotos}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Send with revocable permissions" }),
    );
    expect(onSendPhotoDirectly).toHaveBeenCalledTimes(1);
    expect(onOpenComposerWithPhotos).toHaveBeenCalledTimes(1);
  });
});
