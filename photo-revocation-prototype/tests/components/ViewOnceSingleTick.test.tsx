import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ViewOnceSingleTick } from "@/components/photo-revocation-demo/ViewOnceSingleTick";

describe("ViewOnceSingleTick", () => {
  it("renders an aria-hidden tick graphic", () => {
    const { container } = render(<ViewOnceSingleTick />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
    expect(svg?.querySelector("path[d='M1 5.5L4 8.5L11 1.5']")).toBeTruthy();
  });
});
