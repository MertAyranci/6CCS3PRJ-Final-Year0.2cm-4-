"use client";

export type RequestAccessPanelProps = {
  assetLabel: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onSendRequest: () => void;
};

export function RequestAccessPanel({
  assetLabel,
  draft,
  onDraftChange,
  onCancel,
  onSendRequest,
}: RequestAccessPanelProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-[#172229] p-3">
      <p className="text-xs font-semibold text-emerald-200">Request access to photo</p>
      <p className="truncate text-[11px] text-slate-400">
        {assetLabel}
      </p>
      <p className="text-[11px] text-slate-500">
        Add a message to the sender (optional):
      </p>
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="e.g. I need this for the report, can you restore access?"
        rows={2}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b141a] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/15 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSendRequest}
          className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          Send request
        </button>
      </div>
    </div>
  );
}
