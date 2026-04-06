"use client";

export type RequestRevocationPanelProps = {
  assetLabel: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onSendRequest: () => void;
};

export function RequestRevocationPanel({
  assetLabel,
  draft,
  onDraftChange,
  onCancel,
  onSendRequest,
}: RequestRevocationPanelProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-[#172229] p-3">
      <p className="text-xs font-semibold text-amber-200">Request revocation</p>
      <p className="truncate text-[11px] text-slate-400">
        {assetLabel}
      </p>
      <p className="text-[11px] text-slate-500">
        Add a message to the sender (optional):
      </p>
      <p className="text-[10px] text-slate-500/90" role="note">
        Revocation affects in-app access only; offline copies may already exist.
      </p>
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="e.g. I'd prefer this photo not to be shared."
        rows={2}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b141a] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
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
          className="flex-1 rounded-xl bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
        >
          Send request
        </button>
      </div>
    </div>
  );
}
