"use client";

import type { Dispatch, SetStateAction } from "react";
import { durationToMs, formatTimeLimit, hasTimeLimit } from "@/lib/photoModel";
import type { TimeLimitDuration } from "@/lib/photoModel";
import type { PhotoPermissions } from "@/lib/photo-revocation-demo/types";
import { ScrollWheelColumn } from "./ScrollWheelColumn";

export type TimeLimitModalProps = {
  panelTimeLimit: TimeLimitDuration;
  setPanelTimeLimit: Dispatch<SetStateAction<TimeLimitDuration>>;
  onClose: () => void;
  onApply: () => void;
  updateSelectedPhotoPermissions: (updates: Partial<PhotoPermissions>) => void;
};

export function TimeLimitModal({
  panelTimeLimit,
  setPanelTimeLimit,
  onClose,
  onApply,
  updateSelectedPhotoPermissions,
}: TimeLimitModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[2rem] bg-black/75 p-3 backdrop-blur-sm">
      <div className="w-full max-w-[260px] rounded-2xl border border-white/10 bg-[#202c33] p-3 shadow-xl text-white">
        <h3 className="text-sm font-semibold">Set time limit</h3>
        <p className="mt-1 text-[11px] text-slate-400">
          Access will expire after this duration.
        </p>
        <div className="mt-2 flex justify-center gap-1">
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
        <p className="mt-1.5 text-center text-[11px] font-medium text-slate-400">
          {formatTimeLimit(panelTimeLimit)}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hasTimeLimit(panelTimeLimit)) return;
              updateSelectedPhotoPermissions({
                expiresAt: Date.now() + durationToMs(panelTimeLimit),
                status: "active",
              });
              onApply();
            }}
            disabled={!hasTimeLimit(panelTimeLimit)}
            className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-500 disabled:text-slate-300"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
