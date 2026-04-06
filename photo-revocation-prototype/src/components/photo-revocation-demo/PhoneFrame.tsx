"use client";

import { useRef, type ReactNode } from "react";
import type { Participant } from "@/lib/photo-revocation-demo/types";
import { ChatPanelOverlayContext } from "./chatPanelPortalContext";

export type PhoneFrameProps = {
  title: string;
  subtitle: string;
  phoneOwner: Participant;
  children: ReactNode;
  footer: ReactNode;
  /** Portalled UI (e.g. view-once) that should use this phone’s chat overlay layer. */
  chatOverlays?: ReactNode;
};

function roleBadgeLabel(phoneOwner: Participant): string {
  if (phoneOwner === "sender") return "Sender";
  if (phoneOwner === "recipient") return "Recipient";
  if (phoneOwner === "forwardedRecipient") return "Secondary recipient";
  return "Co-subject";
}

export function PhoneFrame({
  title,
  subtitle,
  phoneOwner,
  children,
  footer,
  chatOverlays,
}: PhoneFrameProps) {
  const chatPanelPortalRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="flex h-[820px] min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#111b21] shadow-2xl shadow-black/30">
      <header className="flex items-center justify-between border-b border-white/5 bg-[#202c33] px-5 py-4 text-white">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-[#2a3942] px-3 py-1">
            {roleBadgeLabel(phoneOwner)}
          </span>
        </div>
      </header>

      <ChatPanelOverlayContext.Provider
        value={{ portalEl: chatPanelPortalRef, scrollEl: chatScrollRef }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              ref={chatScrollRef}
              className="absolute inset-0 overflow-y-auto bg-[linear-gradient(180deg,#0b141a_0%,#0f171d_100%)] px-4 py-6"
            >
              {children}
            </div>
            <div
              ref={chatPanelPortalRef}
              className="pointer-events-none absolute inset-0 z-[80] overflow-hidden"
            />
          </div>
          {chatOverlays ?? null}
        </div>
      </ChatPanelOverlayContext.Provider>

      <footer className="border-t border-white/5 bg-[#202c33] px-4 py-3">
        {footer}
      </footer>
    </section>
  );
}
