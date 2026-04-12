import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoRevocationDemo } from "@/components/photo-revocation-demo/PhotoRevocationDemo";
import {
  coOwnerSectionEl,
  openRecipientPhotoMenu,
  openSenderPhotoMenu,
  recipientSectionEl,
  secondarySectionEl,
  senderSectionEl,
} from "../helpers/photoDemoUi";

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

function messageRowCount(panel: HTMLElement): number {
  const list = panel.querySelector(".space-y-4");
  return list?.children.length ?? 0;
}

function openSecondaryPhotoMenu() {
  const secondary = secondarySectionEl();
  fireEvent.click(
    within(secondary).getByRole("button", { name: "Open photo options" }),
  );
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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();
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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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
    const sender = senderSectionEl();

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

  it("switches the recipient handset subtitle when the shared photo is revoked", () => {
    render(<PhotoRevocationDemo />);
    expect(screen.getByText("Recipient view of the chat")).toBeInTheDocument();

    const sender = senderSectionEl();
    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revoke photo access" }),
    );

    expect(screen.getByText("Recipient sees revoked state")).toBeInTheDocument();
  });

  it("starts an in-chat reply from the sender photo menu and posts it to the thread", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPhotoMenu(sender);
    fireEvent.click(within(sender).getByRole("button", { name: "Reply" }));

    const replyField = within(sender).getByPlaceholderText("Type your reply...");
    fireEvent.change(replyField, {
      target: { value: "Noted — keeping this private." },
    });
    fireEvent.click(within(sender).getByRole("button", { name: "Send" }));

    expect(screen.getAllByText("Noted — keeping this private.").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Replying to Beach/i).length).toBeGreaterThan(0);
  });

  it("dismisses the reply strip when the sender cancels reply", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPhotoMenu(sender);
    fireEvent.click(within(sender).getByRole("button", { name: "Reply" }));
    expect(
      within(sender).getByPlaceholderText("Type your reply..."),
    ).toBeInTheDocument();

    fireEvent.click(within(sender).getByRole("button", { name: "Cancel reply" }));
    expect(
      within(sender).getByPlaceholderText("Type as sender..."),
    ).toBeInTheDocument();
  });

  it("closes the pre-send composer without sending and returns to the thread", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPicker(sender);
    fireEvent.click(firstPresetInSenderPicker(sender));
    fireEvent.click(
      screen.getByRole("button", { name: "Send with revocable permissions" }),
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(within(sender).getByText(/Shared with revocable permissions/i)).toBeInTheDocument();
  });

  it("closes the picker sheet when Cancel is pressed", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPicker(sender);
    expect(
      within(sender).getByText("Tap photos to select several, then send as one message."),
    ).toBeInTheDocument();

    fireEvent.click(within(sender).getByRole("button", { name: "Cancel" }));
    expect(
      within(sender).queryByText(
        "Tap photos to select several, then send as one message.",
      ),
    ).not.toBeInTheDocument();
  });

  it("does not append a message when the sender sends an empty text", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();
    const before = messageRowCount(sender);

    fireEvent.click(within(sender).getByRole("button", { name: "Send" }));
    expect(messageRowCount(sender)).toBe(before);
    expect(within(sender).getByPlaceholderText("Type as sender...")).toHaveValue("");
  });

  it("closes the time limit modal on Cancel without applying an expiry", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Set time limit" }),
    );

    const modalCard = screen.getByRole("heading", { name: "Set time limit" })
      .parentElement as HTMLElement;
    fireEvent.click(within(modalCard).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("heading", { name: "Set time limit" })).not.toBeInTheDocument();
    expect(screen.queryAllByText(/expires in/i).length).toBe(0);
  });

  it("includes optional text on a recipient access request shown to the sender", async () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

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

    fireEvent.change(
      within(recipientSectionEl()).getByPlaceholderText(
        /need this for the report/i,
      ),
      { target: { value: "Needed for coursework only." } },
    );
    fireEvent.click(
      within(recipientSectionEl()).getByRole("button", { name: "Send request" }),
    );

    await waitFor(() => {
      expect(
        within(sender).getByText(/Needed for coursework only/i),
      ).toBeInTheDocument();
    });
  });

  it("marks a view-once photo as consumed after the recipient closes the modal", async () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPicker(sender);
    fireEvent.click(firstPresetInSenderPicker(sender));
    fireEvent.click(
      screen.getByRole("button", { name: "Send with revocable permissions" }),
    );
    fireEvent.click(within(sender).getByRole("button", { name: /View once/i }));
    fireEvent.click(screen.getByRole("button", { name: "Send photo" }));

    await waitFor(() => {
      expect(screen.getByText(/view once enabled/i)).toBeInTheDocument();
    });

    const recipient = recipientSectionEl();
    const openOnce = within(recipient).getByRole("button", { name: /View once/i });
    fireEvent.click(openOnce);

    const dialog = await screen.findByRole("dialog", { name: /Recipient view once/i });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(within(recipient).getByText("Opened once")).toBeInTheDocument();
    });
  });

  it("lets the co-subject reply from the photo menu using the co-subject composer", async () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();
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
    fireEvent.click(within(coOwner).getByRole("button", { name: "Reply" }));

    const field = within(coOwner).getByPlaceholderText("Type your reply...");
    fireEvent.change(field, { target: { value: "Acknowledged — thanks for the heads-up." } });
    fireEvent.click(within(coOwner).getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Acknowledged — thanks for the heads-up.").length,
      ).toBeGreaterThan(0);
    });
  });

  it("allows a second forward from the secondary handset when forwarding stays permitted", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

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
    const afterFirst = messageRowCount(secondary);
    expect(afterFirst).toBeGreaterThan(0);

    openSecondaryPhotoMenu();
    fireEvent.click(within(secondary).getByRole("button", { name: "Forward" }));

    expect(messageRowCount(secondary)).toBe(afterFirst + 1);
  });

  it("lets the sender forward their own photo from the main thread when forwarding is allowed", () => {
    render(<PhotoRevocationDemo />);
    const sender = senderSectionEl();

    openSenderPhotoMenu(sender);
    fireEvent.click(
      within(sender).getByRole("button", { name: "Revocation permissions" }),
    );
    fireEvent.click(
      within(sender).getByRole("button", { name: "Allow forwarding" }),
    );

    openSenderPhotoMenu(sender);
    fireEvent.click(within(sender).getByRole("button", { name: "Forward" }));

    expect(
      within(secondarySectionEl()).getByText(/Forwarded:/i),
    ).toBeInTheDocument();
  });

  it("starts a reply from the recipient photo menu and posts it to the shared thread", () => {
    render(<PhotoRevocationDemo />);
    const recipient = recipientSectionEl();

    openRecipientPhotoMenu();
    fireEvent.click(within(recipient).getByRole("button", { name: "Reply" }));

    fireEvent.change(
      within(recipient).getByPlaceholderText("Type your reply..."),
      { target: { value: "Will do — leaving it in this chat only." } },
    );
    fireEvent.click(within(recipient).getByRole("button", { name: "Send" }));

    expect(
      screen.getAllByText("Will do — leaving it in this chat only.").length,
    ).toBeGreaterThan(0);
  });
});
