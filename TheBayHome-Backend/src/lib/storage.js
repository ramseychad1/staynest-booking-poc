// Storage abstraction: writes to an S3-compatible bucket when BUCKET/
// ACCESS_KEY_ID/SECRET_ACCESS_KEY/ENDPOINT are set (matches the variable
// names Railway auto-injects for a Bucket), otherwise falls back to local
// disk under ./uploads so file uploads work with zero cloud setup in dev.
//
// Swapping to a real bucket later (e.g. a Railway Bucket) is just setting
// those env vars - no code change.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

const s3Configured =
  !!process.env.BUCKET &&
  !!process.env.ACCESS_KEY_ID &&
  !!process.env.SECRET_ACCESS_KEY &&
  !!process.env.ENDPOINT;

let s3Client = null;
if (s3Configured) {
  s3Client = new S3Client({
    region: process.env.REGION || "auto",
    endpoint: process.env.ENDPOINT,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
  });
}

function keyFor(originalName) {
  const ext = path.extname(originalName || "").slice(0, 10);
  return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
}

export const storageMode = s3Configured ? "s3" : "local";

export async function saveFile(file) {
  const key = keyFor(file.originalname);

  if (s3Configured) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const base = process.env.ENDPOINT.replace(/\/$/, "");
    // Railway Buckets use virtual-hosted-style URLs (bucket as subdomain).
    const url = base.startsWith("https://")
      ? `https://${process.env.BUCKET}.${base.slice("https://".length)}/${key}`
      : `${base}/${process.env.BUCKET}/${key}`;

    return { key, url };
  }

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, key), file.buffer);
  return { key, url: `/uploads/${key}` };
}

export async function deleteFile(urlOrKey) {
  if (!urlOrKey) return;

  if (s3Configured && urlOrKey.includes(process.env.BUCKET)) {
    const key = urlOrKey.split("/").pop();
    await s3Client
      .send(new DeleteObjectCommand({ Bucket: process.env.BUCKET, Key: key }))
      .catch(() => {});
    return;
  }

  if (urlOrKey.startsWith("/uploads/")) {
    const key = urlOrKey.replace("/uploads/", "");
    fs.rm(path.join(UPLOADS_DIR, key), { force: true }, () => {});
  }
}

export { UPLOADS_DIR };
