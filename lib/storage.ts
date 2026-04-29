"use client";
import { GarmentItem, Look } from "./types";

const WARDROBE_KEY = "looksy_wardrobe";
const LOOKS_KEY = "looksy_looks";

export function getWardrobe(): GarmentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WARDROBE_KEY) || "[]");
  } catch { return []; }
}

export function saveGarment(item: GarmentItem): void {
  const wardrobe = getWardrobe();
  wardrobe.unshift(item);
  localStorage.setItem(WARDROBE_KEY, JSON.stringify(wardrobe));
}

export function deleteGarment(id: string): void {
  const wardrobe = getWardrobe().filter((g) => g.id !== id);
  localStorage.setItem(WARDROBE_KEY, JSON.stringify(wardrobe));
}

export function getLooks(): Look[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOOKS_KEY) || "[]");
  } catch { return []; }
}

export function saveLook(look: Look): void {
  const looks = getLooks();
  const idx = looks.findIndex((l) => l.id === look.id);
  if (idx >= 0) looks[idx] = look;
  else looks.unshift(look);
  localStorage.setItem(LOOKS_KEY, JSON.stringify(looks));
}

// Compress image to base64 thumbnail (max 400px)
export async function compressImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
