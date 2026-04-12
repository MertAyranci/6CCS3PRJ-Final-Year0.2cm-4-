import { fireEvent, screen, within } from "@testing-library/react";
import { expect } from "vitest";

export function senderSectionEl(): HTMLElement {
  const marker = screen.getByText("Sender controls available");
  const section = marker.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

export function recipientSectionEl(): HTMLElement {
  const marker =
    screen.queryByText("Recipient view of the chat") ??
    screen.queryByText("Recipient sees revoked state");
  expect(marker).toBeTruthy();
  const section = marker!.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

export function coOwnerSectionEl(): HTMLElement {
  const marker = screen.getByText("Co-subject view of the chat");
  const section = marker.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

export function secondarySectionEl(): HTMLElement {
  const marker = screen.getByText("Forwarded-message recipient");
  const section = marker.closest("section");
  expect(section).toBeTruthy();
  return section as HTMLElement;
}

export function openSenderPhotoMenu(sender: HTMLElement) {
  fireEvent.click(
    within(sender).getByRole("button", { name: "Open photo options" }),
  );
}

export function openRecipientPhotoMenu() {
  const recipient = recipientSectionEl();
  fireEvent.click(
    within(recipient).getByRole("button", { name: "Open photo options" }),
  );
}
