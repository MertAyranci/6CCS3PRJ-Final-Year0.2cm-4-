"use client";

import type { ChatMessage, Participant } from "@/lib/photo-revocation-demo/types";
import { PhotoPreview } from "./PhotoPreview";

export type TextMessageBubbleProps = {
  message: Extract<ChatMessage, { type: "text" }>;
  phoneOwner: Participant;
  alignClass: string;
  textTone: string;
  timestampTone: string;
  onRespondToRevocationRequest: (
    messageId: number,
    accept: boolean,
    assetLabel: string,
    sourcePhotoId: number | undefined,
  ) => void;
  onRespondToAccessRequest: (
    messageId: number,
    accept: boolean,
    assetLabel: string,
    sourcePhotoId: number | undefined,
  ) => void;
};

export function TextMessageBubble({
  message,
  phoneOwner,
  alignClass,
  textTone,
  timestampTone,
  onRespondToRevocationRequest,
  onRespondToAccessRequest,
}: TextMessageBubbleProps) {
  const hasReply = message.replyToMessageId != null && message.replyToAssetLabel;
  const isRevocationRequest =
    message.sender === "coOwner" &&
    message.revocationRequestSourcePhotoId != null &&
    message.revocationRequestAssetLabel != null;
  const showRevocationActions =
    phoneOwner === "sender" &&
    isRevocationRequest &&
    message.revocationRequestStatus === "pending";
  const isAccessRequest =
    message.sender === "recipient" &&
    message.accessRequestSourcePhotoId != null &&
    message.accessRequestAssetLabel != null;
  const showAccessActions =
    phoneOwner === "sender" &&
    isAccessRequest &&
    message.accessRequestStatus === "pending";

  return (
    <div
      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${alignClass} ${textTone}`}
    >
      {hasReply ? (
        <div className="flex gap-2 border-l-2 border-white/30 pl-2">
          {message.replyToAsset ? (
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-white/20">
              <PhotoPreview asset={message.replyToAsset} />
            </div>
          ) : null}
          <p className="truncate text-xs text-white/80">
            Replying to {message.replyToAssetLabel}
          </p>
        </div>
      ) : null}
      <p className={hasReply ? "mt-2" : ""}>{message.text}</p>
      {showRevocationActions ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() =>
              onRespondToRevocationRequest(
                message.id,
                true,
                message.revocationRequestAssetLabel!,
                message.revocationRequestSourcePhotoId,
              )
            }
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() =>
              onRespondToRevocationRequest(
                message.id,
                false,
                message.revocationRequestAssetLabel!,
                message.revocationRequestSourcePhotoId,
              )
            }
            className="rounded-xl border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            Reject
          </button>
        </div>
      ) : null}
      {showAccessActions ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() =>
              onRespondToAccessRequest(
                message.id,
                true,
                message.accessRequestAssetLabel!,
                message.accessRequestSourcePhotoId,
              )
            }
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() =>
              onRespondToAccessRequest(
                message.id,
                false,
                message.accessRequestAssetLabel!,
                message.accessRequestSourcePhotoId,
              )
            }
            className="rounded-xl border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            Reject
          </button>
        </div>
      ) : null}
      {isRevocationRequest && phoneOwner === "sender" && message.revocationRequestStatus !== "pending" ? (
        <p className="mt-2 text-xs opacity-90">
          {message.revocationRequestStatus === "accepted"
            ? "Accepted — photo revoked."
            : "Rejected — co-subject notified."}
        </p>
      ) : null}
      {isAccessRequest && phoneOwner === "sender" && message.accessRequestStatus !== "pending" ? (
        <p className="mt-2 text-xs opacity-90">
          {message.accessRequestStatus === "accepted"
            ? "Accepted — access restored."
            : "Rejected — recipient notified."}
        </p>
      ) : null}
      <p className={`mt-2 text-right text-xs ${timestampTone}`}>{message.time}</p>
    </div>
  );
}
