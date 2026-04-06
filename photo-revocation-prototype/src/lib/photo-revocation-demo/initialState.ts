import type { ChatMessage, PhotoPermissions } from "./types";
import type { TimeLimitDuration } from "@/lib/photoModel";
import { initialPhotoAsset } from "./constants";

export const DEFAULT_DRAFT_CAPTION = "Shared with revocable permissions.";

export const DEFAULT_DRAFT_PERMISSIONS: PhotoPermissions = {
  status: "active",
  canForward: false,
  viewOnce: false,
  expiresAt: null,
  canDownload: true,
  hasCoSubject: false,
};

export const DEFAULT_DRAFT_TIME_LIMIT: TimeLimitDuration = {
  days: 0,
  hours: 0,
  minutes: 5,
  seconds: 0,
};

export const DEFAULT_PANEL_TIME_LIMIT: TimeLimitDuration = {
  days: 0,
  hours: 1,
  minutes: 0,
  seconds: 0,
};

export const INITIAL_LAST_SEND_SUMMARY =
  "Sent Beach with visible access and forwarding blocked.";

export const INITIAL_LAST_FORWARD_SUMMARY =
  "No forwarded photo has been shared yet.";

export const INITIAL_MAIN_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    sender: "recipient",
    type: "text",
    text: "Can you send me the photo from last night?",
    time: "09:12",
  },
  {
    id: 2,
    sender: "sender",
    type: "photo",
    assets: [initialPhotoAsset],
    caption: "Shared with revocable permissions.",
    time: "09:14",
    permissions: {
      status: "active",
      canForward: false,
      viewOnce: false,
      expiresAt: null,
      canDownload: true,
      hasCoSubject: false,
    },
    sourcePhotoId: 2,
  },
  {
    id: 3,
    sender: "recipient",
    type: "text",
    text: "I can see it now. Let me know if you want me to keep it private.",
    time: "09:15",
  },
];
