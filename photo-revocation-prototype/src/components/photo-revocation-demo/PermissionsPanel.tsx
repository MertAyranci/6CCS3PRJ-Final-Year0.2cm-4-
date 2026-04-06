"use client";

import type { RefObject } from "react";
import type { Dispatch, SetStateAction } from "react";
import { durationToMs, formatTimeLimit, hasTimeLimit } from "@/lib/photoModel";
import type { TimeLimitDuration } from "@/lib/photoModel";
import type {
  PermissionStatus,
  PhotoMessage,
  PhotoPermissions,
} from "@/lib/photo-revocation-demo/types";
import { ScrollWheelColumn } from "./ScrollWheelColumn";
import { ViewOnceSingleTick } from "./ViewOnceSingleTick";

export type PermissionsPanelProps = {
  permissionsPanelRef: RefObject<HTMLElement | null>;
  selectedPhotoMessage: PhotoMessage | null;
  panelOpen: boolean;
  setPanelOpen: Dispatch<SetStateAction<boolean>>;
  updateSelectedPhotoPermissions: (updates: Partial<PhotoPermissions>) => void;
  isPhotoExpired: (permissions: PhotoPermissions) => boolean;
  formatExpiryCountdown: (expiresAt: number) => string;
  getStatusLabel: (status: PermissionStatus) => string;
  lastSendSummary: string;
  lastForwardSummary: string;
  isViewOnceConsumedForSelectedPhoto: boolean;
  panelTimeLimit: TimeLimitDuration;
  setPanelTimeLimit: Dispatch<SetStateAction<TimeLimitDuration>>;
  panelTimeLimitOpen: boolean;
  setPanelTimeLimitOpen: Dispatch<SetStateAction<boolean>>;
};

export function PermissionsPanel({
  permissionsPanelRef,
  selectedPhotoMessage,
  panelOpen,
  setPanelOpen,
  updateSelectedPhotoPermissions,
  isPhotoExpired,
  formatExpiryCountdown,
  getStatusLabel,
  lastSendSummary,
  lastForwardSummary,
  isViewOnceConsumedForSelectedPhoto,
  panelTimeLimit,
  setPanelTimeLimit,
  panelTimeLimitOpen,
  setPanelTimeLimitOpen,
}: PermissionsPanelProps) {
  return (
    <aside
      ref={permissionsPanelRef}
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-black/15"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Interactive prototype screen
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        Photo message with revocation controls
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This version shows four devices: the sender, the original recipient, a third
        phone for forwarded content, and the co-owner. Use the panel below to inspect
        and manage the selected photo.
      </p>

      <div className="mt-6 rounded-3xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Current prototype state</p>
        <dl className="mt-3 space-y-3 text-sm text-slate-600">
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">Photo status</dt>
            <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedPhotoMessage
                ? getStatusLabel(selectedPhotoMessage.permissions.status)
                : "no photo selected"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">Forwarding</dt>
            <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedPhotoMessage
                ? selectedPhotoMessage.permissions.canForward
                  ? "allowed"
                  : "blocked"
                : "n/a"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">View once</dt>
            <dd
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                selectedPhotoMessage?.permissions.viewOnce &&
                isViewOnceConsumedForSelectedPhoto
                  ? "border border-[#53bdeb]/45 bg-[#e0f2fe] text-[#0369a1]"
                  : "bg-white text-slate-700"
              }`}
            >
              {selectedPhotoMessage?.permissions.viewOnce ? (
                isViewOnceConsumedForSelectedPhoto ? (
                  <span className="inline-flex items-center gap-1.5" title="Recipient opened view once">
                    <ViewOnceSingleTick />
                  </span>
                ) : (
                  "On"
                )
              ) : (
                "off"
              )}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">Download</dt>
            <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedPhotoMessage?.permissions.canDownload !== false
                ? "allowed"
                : "blocked"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">Time limit</dt>
            <dd className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {selectedPhotoMessage?.permissions.expiresAt != null
                ? formatExpiryCountdown(selectedPhotoMessage.permissions.expiresAt).toLowerCase()
                : "none"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">Last send</dt>
            <dd className="max-w-[160px] text-right text-xs leading-5 text-slate-500">
              {lastSendSummary}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="font-medium text-slate-900">Forwarded chat</dt>
            <dd className="max-w-[160px] text-right text-xs leading-5 text-slate-500">
              {lastForwardSummary}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-4">
        <p className="text-sm font-semibold text-slate-900">Permissions panel</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This panel manages the currently selected sent photo. Use the camera icon on
          the sender phone to add new photo messages.
        </p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => setPanelOpen((current) => !current)}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!selectedPhotoMessage}
          >
            {panelOpen ? "Close controls" : "Open controls"}
          </button>

          {panelOpen && selectedPhotoMessage ? (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Photo visibility</p>
                <p className="mt-1 text-xs text-slate-500">
                  {isPhotoExpired(selectedPhotoMessage.permissions)
                    ? "Photo access has expired. Restore permanently or set a new time limit below."
                    : "Active: visible. Revoke: hide from recipient."}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedPhotoPermissions({
                        status: "active",
                        ...(isPhotoExpired(selectedPhotoMessage.permissions)
                          ? { expiresAt: null }
                          : {}),
                      })
                    }
                    className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      selectedPhotoMessage.permissions.status === "active" &&
                      !isPhotoExpired(selectedPhotoMessage.permissions)
                        ? "bg-emerald-500 text-[#03130f]"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isPhotoExpired(selectedPhotoMessage.permissions)
                      ? "Restore access (permanent)"
                      : "Active"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedPhotoPermissions({ status: "revoked" })}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      selectedPhotoMessage.permissions.status === "revoked"
                        ? "bg-rose-500 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Revoke
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Forwarding permission
                    </p>
                    <p className="text-xs text-slate-500">
                      Controls whether the recipient can send this photo to the third
                      phone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedPhotoPermissions({
                        canForward: !selectedPhotoMessage.permissions.canForward,
                      })
                    }
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      selectedPhotoMessage.permissions.canForward
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {selectedPhotoMessage.permissions.canForward ? "Allowed" : "Blocked"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Download</p>
                    <p className="text-xs text-slate-500">
                      Whether the recipient can download this photo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedPhotoPermissions({
                        canDownload: !selectedPhotoMessage.permissions.canDownload,
                      })
                    }
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      selectedPhotoMessage.permissions.canDownload
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {selectedPhotoMessage.permissions.canDownload ? "Allowed" : "Blocked"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Time limit</p>
                  <p className="text-xs text-slate-500">
                    {selectedPhotoMessage.permissions.expiresAt != null
                      ? isPhotoExpired(selectedPhotoMessage.permissions)
                        ? "Photo access has expired. Set a new time limit or restore access permanently above."
                        : "Photo access expires at a set time. Remove to allow access until revoked."
                      : "No expiry set; access remains until you revoke it."}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {selectedPhotoMessage.permissions.expiresAt != null ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedPhotoPermissions({ expiresAt: null })
                      }
                      className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-200"
                    >
                      Remove time limit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setPanelTimeLimitOpen((open) => !open)
                    }
                    className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200"
                  >
                    {panelTimeLimitOpen
                      ? "Cancel"
                      : selectedPhotoMessage.permissions.expiresAt != null
                        ? "Set new time limit"
                        : "Add time limit"}
                  </button>
                </div>
                {panelTimeLimitOpen ? (
                  <>
                    <p className="mt-3 text-xs text-slate-500">
                      Set duration from now. Access will expire after this time.
                    </p>
                    <div className="mt-2 flex justify-center gap-2 sm:gap-4">
                      <ScrollWheelColumn
                        min={0}
                        max={99}
                        value={panelTimeLimit.days}
                        onChange={(days) =>
                          setPanelTimeLimit((prev) => ({ ...prev, days }))
                        }
                        label="Days"
                      />
                      <ScrollWheelColumn
                        min={0}
                        max={23}
                        value={panelTimeLimit.hours}
                        onChange={(hours) =>
                          setPanelTimeLimit((prev) => ({ ...prev, hours }))
                        }
                        label="Hours"
                      />
                      <ScrollWheelColumn
                        min={0}
                        max={59}
                        value={panelTimeLimit.minutes}
                        onChange={(minutes) =>
                          setPanelTimeLimit((prev) => ({ ...prev, minutes }))
                        }
                        label="Min"
                      />
                      <ScrollWheelColumn
                        min={0}
                        max={59}
                        value={panelTimeLimit.seconds}
                        onChange={(seconds) =>
                          setPanelTimeLimit((prev) => ({ ...prev, seconds }))
                        }
                        label="Sec"
                      />
                    </div>
                    <p className="mt-2 text-center text-xs font-medium text-slate-500">
                      {formatTimeLimit(panelTimeLimit)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasTimeLimit(panelTimeLimit)) return;
                        updateSelectedPhotoPermissions({
                          expiresAt: Date.now() + durationToMs(panelTimeLimit),
                          status: "active",
                        });
                        setPanelTimeLimitOpen(false);
                      }}
                      disabled={!hasTimeLimit(panelTimeLimit)}
                      className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      Apply time limit
                    </button>
                  </>
                ) : null}
              </div>

              <p className="text-xs leading-5 text-slate-500">
                This is intentionally scoped as platform-level visibility control, not a
                guarantee of universal deletion.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
