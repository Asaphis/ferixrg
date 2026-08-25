// Storage helpers using Cloudinary or local filesystem
import { ENV } from "./_core/env";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Cloudinary configuration (optional - if not configured, falls back to local storage)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "ferixrg_uploads";

const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || "./uploads";

function normalizeKey(relKey: string): string { 
  return relKey.replace(/^\/+/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function appendHashSuffix(relKey: string): string {
  const hash = Math.random().toString(36).substring(2, 10);
  const lastDot = relKey.lastIndexOf(".");
  return lastDot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

// Ensure local storage directory exists
async function ensureLocalStorageDir() {
  if (!existsSync(LOCAL_STORAGE_DIR)) {
    await mkdir(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

// Cloudinary upload (if configured)
async function uploadToCloudinary(file: Buffer, contentType: string, publicId: string): Promise<{ key: string; url: string }> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME environment variable or use local storage.");
  }

  const formData = new FormData();
  formData.append("file", new Blob([file], { type: contentType }));
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed (${response.status}): ${await response.text()}`);
  }

  const result = await response.json() as { secure_url: string; public_id: string };
  return { key: result.public_id, url: result.secure_url };
}

// Local filesystem upload (fallback)
async function uploadToLocal(file: Buffer, contentType: string, fileName: string): Promise<{ key: string; url: string }> {
  await ensureLocalStorageDir();
  const filePath = join(LOCAL_STORAGE_DIR, fileName);
  await writeFile(filePath, file);
  return { key: fileName, url: `/uploads/${fileName}` };
}

export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, contentType = "application/octet-stream"): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as Uint8Array);

  try {
    // Try Cloudinary first if configured
    if (CLOUDINARY_CLOUD_NAME) {
      return await uploadToCloudinary(buffer, contentType, key);
    }
  } catch (error) {
    console.warn("[Storage] Cloudinary upload failed, falling back to local storage:", error);
  }

  // Fallback to local storage
  return await uploadToLocal(buffer, contentType, key);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  // If using Cloudinary, return the Cloudinary URL
  if (CLOUDINARY_CLOUD_NAME) {
    return { key, url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${key}` };
  }
  
  // Local storage URL
  return { key, url: `/uploads/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { url } = await storageGet(relKey);
  return url;
}
