"use client";

import { createContext, useContext, type RefObject } from "react";

export type ChatPanelOverlayRefs = {
  portalEl: RefObject<HTMLDivElement | null>;
  scrollEl: RefObject<HTMLDivElement | null>;
};

/** Scoped to one phone: gallery overlays mount here; chat scroll is locked while open. */
export const ChatPanelOverlayContext = createContext<ChatPanelOverlayRefs | null>(null);

export function useChatPanelOverlay(): ChatPanelOverlayRefs | null {
  return useContext(ChatPanelOverlayContext);
}
