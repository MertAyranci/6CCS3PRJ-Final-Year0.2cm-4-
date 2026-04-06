import type { PhotoAsset } from "./types";

export const ROW_HEIGHT = 36;
export const WHEEL_VISIBLE_ROWS = 3;

export const presetAlbum: PhotoAsset[] = [
  {
    id: "preset-beach",
    kind: "preset",
    label: "Beach",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#fcd34d_0%,#f59e0b_24%,#0f766e_64%,#164e63_100%)]",
  },
  {
    id: "preset-city",
    kind: "preset",
    label: "City",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#f472b6_0%,#8b5cf6_35%,#1d4ed8_72%,#0f172a_100%)]",
  },
  {
    id: "preset-cafe",
    kind: "preset",
    label: "Cafe",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#f5d0a9_0%,#fb923c_30%,#7c3aed_70%,#312e81_100%)]",
  },
  {
    id: "preset-garden",
    kind: "preset",
    label: "Garden",
    previewClass:
      "bg-[radial-gradient(circle_at_top,#86efac_0%,#22c55e_28%,#0f766e_68%,#134e4a_100%)]",
  },
];

export const initialPhotoAsset = presetAlbum[0];
