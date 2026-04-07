import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "@/app/page";

describe("app/page", () => {
  it("renders the photo revocation prototype demo", () => {
    render(<Page />);
    expect(screen.getByText("State summary")).toBeInTheDocument();
    expect(screen.getByText("Sender controls available")).toBeInTheDocument();
  });
});
