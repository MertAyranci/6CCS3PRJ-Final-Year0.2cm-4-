import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoRevocationDemo } from "@/components/photo-revocation-demo/PhotoRevocationDemo";

function sectionBySubtitle(subtitle: string): HTMLElement {
  const marker = screen.getByText(subtitle);
  const section = marker.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

function recipientSectionEl(): HTMLElement {
  const marker =
    screen.queryByText("Recipient view of the chat") ??
    screen.queryByText("Recipient sees revoked state");
  expect(marker).toBeTruthy();
  const section = marker!.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

function secondarySectionEl(): HTMLElement {
  const marker = screen.getByText("Forwarded-message recipient");
  const section = marker.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

function openSenderPhotoMenu(sender: HTMLElement) {
  fireEvent.click(
    within(sender).getByRole("button", { name: "Open photo options" }),
  );
}

function openRecipientPhotoMenu() {
  const recipient = recipientSectionEl();
  fireEvent.click(
    within(recipient).getByRole("button", { name: "Open photo options" }),
  );
}

function openSenderPicker(sender: HTMLElement) {
  const [plus] = within(sender).getAllByRole("button", {
    name: "Open photo actions",
  });
  fireEvent.click(plus);
}

function firstPresetInSenderPicker(sender: HTMLElement): HTMLButtonElement {
  return presetAt(sender, 0);
}

function presetAt(sender: HTMLElement, index: number): HTMLButtonElement {
  const cancel = within(sender).getByRole("button", { name: "Cancel" });
  const sheetRoot = cancel.closest("div.mt-3");
  expect(sheetRoot).toBeTruthy();
  const grid = sheetRoot!.querySelector("div.grid.grid-cols-3");
  const buttons = grid?.querySelectorAll("button");
  expect(buttons?.[index]).toBeTruthy();
  return buttons![index] as HTMLButtonElement;
}

function coOwnerSectionEl(): HTMLElement {
  const marker = screen.getByText("Co-subject view of the chat");
  const section = marker.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

function sendComposerPhotoWithCoSubject(sender: HTMLElement) {
  openSenderPicker(sender);
  fireEvent.click(firstPresetInSenderPicker(sender));
  fireEvent.click(
    screen.getByRole("button", { name: "Send with revocable permissions" }),
  );
  const coSubjectControl = screen
    .getAllByRole("button")
    .find((b) => (b.textContent ?? "").includes("Co-subject"));
  expect(coSubjectControl).toBeTruthy();
  fireEvent.click(coSubjectControl!);
  fireEvent.click(screen.getByRole("button", { name: "Send photo" }));
}

describe("PhotoRevocationDemo", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders main participant panels and state summary", () => {
    render(<PhotoRevocationDemo />);

    expect(screen.getByText("Sender controls available")).toBeInTheDocument();
    expect(screen.getByText("Recipient view of the chat")).toBeInTheDocument();
    expect(screen.getByText("State summary")).toBeInTheDocument();
    expect(screen.getByText("Per-photo permissions")).toBeInTheDocument();
  });

  it("revokes the selected photo from the sender menu and updates the summary", () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revoke photo access" }),
    );

    expect(screen.getAllByText("Revoked").length).toBeGreaterThanOrEqual(1);
  });

  it("allows forwarding then lets the recipient forward into the secondary thread", () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Allow forwarding" }),
    );

    openRecipientPhotoMenu();
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));

    const secondary = secondarySectionEl();
    expect(
      within(secondary).getByText(/Forwarded:/i),
    ).toBeInTheDocument();
    expect(screen.getByText("appeared on third phone")).toBeInTheDocument();
  });

  it("sends a preset photo directly from the picker", () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPicker(sender);
    fireEvent.click(firstPresetInSenderPicker(sender));

    const sendButtons = within(sender).getAllByRole("button", { name: "Send" });
    fireEvent.click(sendButtons[1]);

    expect(
      screen.getByText("Sent Beach directly with standard photo settings."),
    ).toBeInTheDocument();
  });

  it("opens the composer and sends a configured preset photo", () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPicker(sender);
    fireEvent.click(firstPresetInSenderPicker(sender));
    fireEvent.click(
      screen.getByRole("button", { name: "Send with revocable permissions" }),
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send photo" }));

    expect(
      screen.getByText(
        /Sent Beach with visible access, forwarding allowed, download allowed\./i,
      ),
    ).toBeInTheDocument();
  });

  it("applies a time limit from the modal wired to the demo state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Set time limit" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getAllByText(/expires in 1h/i).length).toBeGreaterThanOrEqual(1);
  });

  it("sends a text message from the sender composer into the shared thread", () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");
    const input = within(sender).getByPlaceholderText("Type as sender...");

    fireEvent.change(input, { target: { value: "Integration flow check" } });
    const sendButtons = within(sender).getAllByRole("button", { name: "Send" });
    fireEvent.click(sendButtons[0]);

    expect(screen.getAllByText("Integration flow check").length).toBeGreaterThan(
      0,
    );
  });

  it("accepts a recipient access request and restores visibility on the main photo", async () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revoke photo access" }),
    );

    openRecipientPhotoMenu();
    fireEvent.click(
      within(recipientSectionEl()).getByRole("button", { name: "Request access" }),
    );
    fireEvent.click(
      within(recipientSectionEl()).getByRole("button", { name: "Send request" }),
    );

    await waitFor(() => {
      expect(
        within(sender).getByText(/Requested access to the photo/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(within(sender).getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(screen.getByText("Recipient view of the chat")).toBeInTheDocument();
    });
    expect(
      within(sender).getByText("Accepted — access restored."),
    ).toBeInTheDocument();
  });

  it("rejects a recipient access request and notifies the recipient thread", async () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revoke photo access" }),
    );

    openRecipientPhotoMenu();
    fireEvent.click(
      within(recipientSectionEl()).getByRole("button", { name: "Request access" }),
    );
    fireEvent.click(
      within(recipientSectionEl()).getByRole("button", { name: "Send request" }),
    );

    await waitFor(() => {
      expect(
        within(sender).getByText(/Requested access to the photo/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(within(sender).getByRole("button", { name: "Reject" }));

    await waitFor(() => {
      expect(
        within(recipientSectionEl()).getByText(
          /The sender has rejected your access request/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("accepts a co-subject revocation request and revokes the source photo", async () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    sendComposerPhotoWithCoSubject(sender);

    await waitFor(() => {
      expect(
        within(coOwnerSectionEl()).getByText("You are depicted in this photo"),
      ).toBeInTheDocument();
    });

    const coOwner = coOwnerSectionEl();
    fireEvent.click(
      within(coOwner).getByRole("button", { name: "Open photo options" }),
    );
    fireEvent.click(
      within(coOwner).getByRole("button", { name: "Request revocation" }),
    );
    fireEvent.click(
      within(coOwner).getByRole("button", { name: "Send request" }),
    );

    await waitFor(() => {
      expect(
        within(sender).getByText(/Requested revocation of the photo/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(within(sender).getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(
        within(sender).getByText("Accepted — photo revoked."),
      ).toBeInTheDocument();
    });
  });

  it("rejects a co-subject revocation request and notifies the co-subject thread", async () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    sendComposerPhotoWithCoSubject(sender);

    await waitFor(() => {
      expect(
        within(coOwnerSectionEl()).getByText("You are depicted in this photo"),
      ).toBeInTheDocument();
    });

    const coOwner = coOwnerSectionEl();
    fireEvent.click(
      within(coOwner).getByRole("button", { name: "Open photo options" }),
    );
    fireEvent.click(
      within(coOwner).getByRole("button", { name: "Request revocation" }),
    );
    fireEvent.click(
      within(coOwner).getByRole("button", { name: "Send request" }),
    );

    await waitFor(() => {
      expect(
        within(sender).getByText(/Requested revocation of the photo/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(within(sender).getByRole("button", { name: "Reject" }));

    await waitFor(() => {
      expect(
        within(coOwner).getByText(
          /The sender has rejected your revocation request/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it("opens the in-chat stack lightbox when a multi-asset message is sent", async () => {
    render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPicker(sender);
    fireEvent.click(presetAt(sender, 0));
    fireEvent.click(presetAt(sender, 1));
    fireEvent.click(
      screen.getByRole("button", { name: "Send with revocable permissions" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Send photo" }));

    await waitFor(() => {
      expect(
        screen.getByText(/2 photos with visible access/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      within(sender).getByRole("button", { name: "View photo 1 full size" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Photo gallery" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Photo gallery" }),
      ).not.toBeInTheDocument();
    });
  });

  it("ingests an album file pick into the picker and sends it directly", async () => {
    class MockFileReader {
      result = "data:image/png;base64,AAAFCAYAAACN";
      onload: (() => void) | null = null;
      readAsDataURL() {
        queueMicrotask(() => this.onload?.call(this as never));
      }
    }
    vi.stubGlobal("FileReader", MockFileReader);

    const { container } = render(<PhotoRevocationDemo />);
    const sender = sectionBySubtitle("Sender controls available");

    openSenderPicker(sender);
    const albumInput = container.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    expect(albumInput).toBeTruthy();

    const file = new File(["x"], "upload-demo.png", { type: "image/png" });
    fireEvent.change(albumInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("1 photo selected")).toBeInTheDocument();
    });

    const sendButtons = within(sender).getAllByRole("button", { name: "Send" });
    fireEvent.click(sendButtons[1]);

    expect(
      screen.getByText(/Sent upload-demo\.png directly with standard photo settings\./i),
    ).toBeInTheDocument();
  });
});
