"use client";

import type {
  AccessRequestOpenState,
  ChatMessage,
  ConversationThread,
  OpenPhotoMenuState,
  Participant,
  PhotoMessage,
  PhotoPermissions,
  ReplyingToState,
  RevocationRequestOpenState,
} from "@/lib/photo-revocation-demo/types";
import { PhotoMessageBubble } from "./PhotoMessageBubble";
import { TextMessageBubble } from "./TextMessageBubble";

export type MessageListProps = {
  conversation: ChatMessage[];
  phoneOwner: Participant;
  thread: ConversationThread;
  mainMessages: ChatMessage[];
  forwardedMessages: ChatMessage[];
  consumedViewOnce: number[];
  openPhotoMenu: OpenPhotoMenuState | null;
  setOpenPhotoMenu: (v: OpenPhotoMenuState | null) => void;
  setSelectedPhotoId: (id: number | null) => void;
  setOpenViewOnce: (v: { owner: Participant; thread: ConversationThread; messageId: number } | null) => void;
  forwardPhotoMessage: (message: PhotoMessage) => void;
  updateSelectedPhotoPermissions: (updates: Partial<PhotoPermissions>) => void;
  setTimeLimitModalOpen: (v: boolean) => void;
  setReplyingTo: (v: ReplyingToState | null) => void;
  setRevocationRequestOpen: (v: RevocationRequestOpenState | null) => void;
  setRevocationRequestDraft: (v: string) => void;
  setAccessRequestOpen: (v: AccessRequestOpenState | null) => void;
  setAccessRequestDraft: (v: string) => void;
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

export function MessageList({
  conversation,
  phoneOwner,
  thread,
  mainMessages,
  forwardedMessages,
  consumedViewOnce,
  openPhotoMenu,
  setOpenPhotoMenu,
  setSelectedPhotoId,
  setOpenViewOnce,
  forwardPhotoMessage,
  updateSelectedPhotoPermissions,
  setTimeLimitModalOpen,
  setReplyingTo,
  setRevocationRequestOpen,
  setRevocationRequestDraft,
  setAccessRequestOpen,
  setAccessRequestDraft,
  onRespondToRevocationRequest,
  onRespondToAccessRequest,
}: MessageListProps) {
  return (
    <div className="space-y-4">
      {conversation.map((message) => {
        const isOwnMessage = message.sender === phoneOwner;
        const alignClass = isOwnMessage
          ? "ml-auto rounded-tr-sm bg-[#005c4b]"
          : "rounded-tl-sm bg-[#202c33]";
        const textTone = isOwnMessage ? "text-white" : "text-slate-100";
        const timestampTone = isOwnMessage ? "text-emerald-100/70" : "text-slate-400";

        if (message.type === "text") {
          return (
            <TextMessageBubble
              key={message.id}
              message={message}
              phoneOwner={phoneOwner}
              alignClass={alignClass}
              textTone={textTone}
              timestampTone={timestampTone}
              onRespondToRevocationRequest={onRespondToRevocationRequest}
              onRespondToAccessRequest={onRespondToAccessRequest}
            />
          );
        }

        return (
          <div
            key={message.id}
            className={`max-w-[82%] overflow-hidden rounded-2xl text-sm shadow-lg ${alignClass} ${textTone}`}
          >
            <PhotoMessageBubble
              message={message}
              phoneOwner={phoneOwner}
              timestampTone={timestampTone}
              thread={thread}
              mainMessages={mainMessages}
              forwardedMessages={forwardedMessages}
              consumedViewOnce={consumedViewOnce}
              openPhotoMenu={openPhotoMenu}
              setOpenPhotoMenu={setOpenPhotoMenu}
              setSelectedPhotoId={setSelectedPhotoId}
              setOpenViewOnce={setOpenViewOnce}
              forwardPhotoMessage={forwardPhotoMessage}
              updateSelectedPhotoPermissions={updateSelectedPhotoPermissions}
              setTimeLimitModalOpen={setTimeLimitModalOpen}
              setReplyingTo={setReplyingTo}
              setRevocationRequestOpen={setRevocationRequestOpen}
              setRevocationRequestDraft={setRevocationRequestDraft}
              setAccessRequestOpen={setAccessRequestOpen}
              setAccessRequestDraft={setAccessRequestDraft}
            />
          </div>
        );
      })}
    </div>
  );
}
