export type PermissionStatus = "active" | "revoked";
export type MainParticipant = "sender" | "recipient";
export type Participant = MainParticipant | "forwardedRecipient" | "coOwner";
export type ConversationThread = "main" | "forwarded";
export type PhotoAssetKind = "preset" | "upload";

export type PhotoAsset = {
  id: string;
  kind: PhotoAssetKind;
  label: string;
  previewClass?: string;
  previewUrl?: string;
};

export type PhotoPermissions = {
  status: PermissionStatus;
  canForward: boolean;
  viewOnce: boolean;
  expiresAt: number | null;
  canDownload: boolean;
  hasCoSubject: boolean;
};

export type ChatMessage =
  | {
      id: number;
      sender: Participant;
      type: "text";
      text: string;
      time: string;
      replyToMessageId?: number;
      replyToAssetLabel?: string;
      replyToAsset?: PhotoAsset;
      revocationRequestSourcePhotoId?: number;
      revocationRequestAssetLabel?: string;
      revocationRequestStatus?: "pending" | "accepted" | "rejected";
      accessRequestSourcePhotoId?: number;
      accessRequestAssetLabel?: string;
      accessRequestStatus?: "pending" | "accepted" | "rejected";
    }
  | {
      id: number;
      sender: Participant;
      type: "photo";
      assets: PhotoAsset[];
      caption: string;
      time: string;
      permissions: PhotoPermissions;
      sourcePhotoId: number;
    };

export type PhotoMessage = Extract<ChatMessage, { type: "photo" }>;

export type SendHistoryEntry = {
  sourcePhotoId: number;
  time: string;
  summary: string;
};

export type OpenPhotoMenuState = {
  messageId: number;
  thread: ConversationThread;
  owner: Participant;
  mode: "actions" | "revoke";
};

export type OpenViewOnceState = {
  owner: Participant;
  thread: ConversationThread;
  messageId: number;
};

export type AccessRequestOpenState = {
  messageId: number;
  thread: ConversationThread;
  owner: Participant;
  assetLabel: string;
  sourcePhotoId?: number;
};

export type RevocationRequestOpenState = {
  assetLabel: string;
  sourcePhotoId: number;
};

export type ReplyingToState = {
  owner: Participant;
  messageId: number;
  thread: ConversationThread;
  assetLabel: string;
  asset: PhotoAsset;
};
