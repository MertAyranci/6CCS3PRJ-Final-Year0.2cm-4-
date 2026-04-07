"use client";

import type { ReactNode } from "react";
import type { ChatMessage, PhotoMessage, SendHistoryEntry } from "@/lib/photo-revocation-demo/types";
import {
  formatExpiryCountdown,
  getEffectivePermissions,
  getStatusLabel,
  isViewOnceConsumedForSourcePhoto,
  photoMessageDisplayLabel,
} from "@/lib/photo-revocation-demo/helpers";
import { ViewOnceSingleTick } from "./ViewOnceSingleTick";

export type PrototypeStateSummaryProps = {
  selectedPhotoMessage: PhotoMessage | null;
  sendHistory: SendHistoryEntry[];
  mainMessages: ChatMessage[];
  forwardedMessages: ChatMessage[];
  consumedViewOnce: number[];
  isViewOnceConsumedForSelectedPhoto: boolean;
};

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/80">
      {children}
    </span>
  );
}

export function PrototypeStateSummary({
  selectedPhotoMessage,
  sendHistory,
  mainMessages,
  forwardedMessages,
  consumedViewOnce,
  isViewOnceConsumedForSelectedPhoto,
}: PrototypeStateSummaryProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            State summary
          </p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Read-only overview of each sent photo and how it appears in the forwarded
            thread. Adjust permissions from the sender&apos;s photo menu in the chat.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <Pill>
            {selectedPhotoMessage
              ? getStatusLabel(selectedPhotoMessage.permissions.status)
              : "No photo selected"}
          </Pill>
          <Pill>
            {selectedPhotoMessage
              ? selectedPhotoMessage.permissions.canForward
                ? "Forward: allowed"
                : "Forward: blocked"
              : "Forward: n/a"}
          </Pill>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
              selectedPhotoMessage?.permissions.viewOnce &&
              isViewOnceConsumedForSelectedPhoto
                ? "border-[#53bdeb]/45 bg-[#e0f2fe] text-[#0369a1] ring-sky-200"
                : "bg-white text-slate-700 ring-slate-200/80"
            }`}
          >
            {selectedPhotoMessage?.permissions.viewOnce ? (
              isViewOnceConsumedForSelectedPhoto ? (
                <span className="inline-flex items-center gap-1" title="Recipient opened view once">
                  View once
                  <ViewOnceSingleTick />
                </span>
              ) : (
                "View once: on"
              )
            ) : (
              "View once: off"
            )}
          </span>
          <Pill>
            {selectedPhotoMessage
              ? selectedPhotoMessage.permissions.canDownload !== false
                ? "Download: allowed"
                : "Download: blocked"
              : "Download: n/a"}
          </Pill>
          <Pill>
            {selectedPhotoMessage?.permissions.expiresAt != null
              ? formatExpiryCountdown(selectedPhotoMessage.permissions.expiresAt).toLowerCase()
              : "Time limit: none"}
          </Pill>
        </div>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-[11px] font-medium text-slate-700">Per-photo permissions</p>
        <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[720px] border-collapse text-left text-[11px] text-slate-700">
            <caption className="sr-only">
              Permission and forward status for each photo sent on the main thread
            </caption>
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/95 backdrop-blur-sm">
              <tr>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  Sent
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  Visibility
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  Forwarding
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  View once
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  Download
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  Expiry
                </th>
                <th scope="col" className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800">
                  Co-subject
                </th>
                <th scope="col" className="min-w-[8rem] px-2 py-2 font-semibold text-slate-800">
                  Forwarded thread
                </th>
              </tr>
            </thead>
            <tbody>
              {sendHistory.map((entry) => {
                const mainPhoto = mainMessages.find(
                  (m): m is PhotoMessage =>
                    m.type === "photo" && m.sourcePhotoId === entry.sourcePhotoId,
                );
                const selected =
                  selectedPhotoMessage?.sourcePhotoId === entry.sourcePhotoId;
                const effective = mainPhoto
                  ? getEffectivePermissions(mainMessages, mainPhoto)
                  : null;
                const policy = mainPhoto?.permissions;
                const viewOnceOpened =
                  mainPhoto != null &&
                  isViewOnceConsumedForSourcePhoto(
                    mainMessages,
                    forwardedMessages,
                    consumedViewOnce,
                    entry.sourcePhotoId,
                  );
                const forwardInstances = forwardedMessages.filter(
                  (m): m is PhotoMessage =>
                    m.type === "photo" && m.sourcePhotoId === entry.sourcePhotoId,
                );

                return (
                  <tr
                    key={entry.sourcePhotoId}
                    className={`border-b border-slate-100 align-top last:border-b-0 ${
                      selected ? "bg-emerald-50/90" : "bg-white"
                    }`}
                  >
                    <td className="px-2 py-2 text-slate-600">
                      <span className="font-mono text-[10px] font-semibold text-slate-500">
                        {entry.time}
                      </span>
                      <span className="mt-0.5 block font-medium text-slate-800">
                        {mainPhoto
                          ? photoMessageDisplayLabel(mainPhoto)
                          : "Unknown photo"}
                      </span>
                      <span className="mt-1 block text-[10px] leading-snug text-slate-500">
                        {entry.summary}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      {effective
                        ? getStatusLabel(effective.status)
                        : "—"}
                    </td>
                    <td className="px-2 py-2">
                      {policy && effective
                        ? effective.status === "active"
                          ? policy.canForward
                            ? "Allowed"
                            : "Blocked"
                          : "Unavailable"
                        : "—"}
                    </td>
                    <td className="px-2 py-2">
                      {!policy ? (
                        "—"
                      ) : policy.viewOnce ? (
                        viewOnceOpened ? (
                          <span className="inline-flex items-center gap-1">
                            Opened
                            <ViewOnceSingleTick />
                          </span>
                        ) : (
                          "On"
                        )
                      ) : (
                        "Off"
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {policy && effective
                        ? effective.status === "active"
                          ? policy.canDownload !== false
                            ? "Allowed"
                            : "Blocked"
                          : "Unavailable"
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {policy?.expiresAt != null
                        ? formatExpiryCountdown(policy.expiresAt).toLowerCase()
                        : "None"}
                    </td>
                    <td className="px-2 py-2">
                      {policy ? (policy.hasCoSubject ? "Yes" : "No") : "—"}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {forwardInstances.length === 0 ? (
                        <span className="text-slate-500">Not forwarded</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {forwardInstances.map((fwd) => (
                            <li key={fwd.id}>
                              <span className="font-mono text-[10px] text-slate-500">
                                {fwd.time}
                              </span>
                              <span className="ml-1">appeared on third phone</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </aside>
  );
}
