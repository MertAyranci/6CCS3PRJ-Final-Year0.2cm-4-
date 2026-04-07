import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PhotoAsset } from "@/lib/photo-revocation-demo/types";
import { presetAlbum } from "@/lib/photo-revocation-demo/constants";
import { PhotoStackGrid } from "@/components/photo-revocation-demo/PhotoStackGrid";

const a = (i: number): PhotoAsset => presetAlbum[i]!;

describe("PhotoStackGrid", () => {
  it("renders nothing for fewer than two assets", () => {
    const { container } = render(<PhotoStackGrid assets={[a(0)]} />);
    expect(container.firstChild).toBeNull();
  });

  it("lays out two tiles and fires onPhotoClick with index", () => {
    const onPhotoClick = vi.fn();
    render(
      <PhotoStackGrid
        assets={[a(0), a(1)]}
        onPhotoClick={onPhotoClick}
        roundedTop={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "View photo 2 full size" }));
    expect(onPhotoClick).toHaveBeenCalledWith(1);
  });

  it("lays out three tiles with a wide bottom row", () => {
    const onPhotoClick = vi.fn();
    render(
      <PhotoStackGrid
        assets={[a(0), a(1), a(2)]}
        onPhotoClick={onPhotoClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "View photo 3 full size" }));
    expect(onPhotoClick).toHaveBeenCalledWith(2);
  });

  it("shows +N overlay when more than four assets", () => {
    const assets = [...presetAlbum, a(0)];
    expect(assets.length).toBe(5);
    const onPhotoClick = vi.fn();
    render(<PhotoStackGrid assets={assets} onPhotoClick={onPhotoClick} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View photo 4 full size" }));
    expect(onPhotoClick).toHaveBeenCalledWith(3);
  });

  it("omits click targets when onPhotoClick is omitted", () => {
    render(<PhotoStackGrid assets={[a(0), a(1)]} />);
    expect(
      screen.queryByRole("button", { name: "View photo 1 full size" }),
    ).not.toBeInTheDocument();
  });

  it("lays out three static tiles without zoom buttons when onPhotoClick is omitted", () => {
    const { container } = render(<PhotoStackGrid assets={[a(0), a(1), a(2)]} />);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("shows +N on a static grid when more than four assets and no click handler", () => {
    const assets = [...presetAlbum, a(0)];
    const { container } = render(<PhotoStackGrid assets={assets} />);
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
