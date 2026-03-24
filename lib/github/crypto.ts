/**
 * lib/github/crypto.ts
 * Vibe Code Market — AES-256-GCM encryption for GitHub OAuth tokens
 *
 * SERVER-SIDE ONLY.
 * This module uses Node's built-in `crypto` — it is not available in
 * the browser or in Edge Runtime. Do NOT import this file from any
 * Client Component or any route with `export const runtime = 'edge'`.
 *
 * Design:
 *   - AES-256-GCM: authenticated encryption — ciphertext integrity is
 *     guaranteed by the 16-byte auth tag. A tampered token is rejected
 *     at decryption time, not silently returned as garbage.
 *   - A fresh 12-byte IV is generated for every encryptToken() call.
 *     Reusing an IV with the same key breaks GCM security guarantees.
 *   - The three components (ciphertext, IV, auth tag) are stored as
 *     separate hex columns in github_connections so no custom parsing
 *     is required and each field can be validated independently.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { getGitHubEncryptionKey } from "@/lib/supabase/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EncryptedToken {
  /** AES-256-GCM ciphertext, hex-encoded */
  ciphertext: string;
  /** 12-byte initialization vector, hex-encoded. Unique per encryption call. */
  iv: string;
  /** 16-byte GCM authentication tag, hex-encoded. Validates integrity. */
  authTag: string;
}

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext GitHub access token with AES-256-GCM.
 *
 * A fresh 12-byte IV is generated on every call — never reused.
 * The auth tag is included so decryption can detect tampering.
 *
 * Store the three returned fields as separate columns:
 *   encrypted_access_token, token_iv, token_auth_tag
 */
export function encryptToken(plaintext: string): EncryptedToken {
  const key = Buffer.from(getGitHubEncryptionKey(), "hex"); // 32 bytes
  const iv  = randomBytes(12);                              // 96-bit IV — recommended for AES-GCM

  const cipher     = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  return {
    ciphertext: ciphertext.toString("hex"),
    iv:         iv.toString("hex"),
    authTag:    authTag.toString("hex"),
  };
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────

/**
 * Decrypts a previously encrypted GitHub access token.
 *
 * Returns the plaintext string on success.
 * Returns `null` on any failure — tampered ciphertext, wrong key,
 * key rotation, or corrupt data all produce the same null result.
 *
 * Callers must handle null explicitly and surface a
 * "Reconnect GitHub" prompt rather than an unhandled error.
 */
export function decryptToken(encrypted: EncryptedToken): string | null {
  try {
    const key     = Buffer.from(getGitHubEncryptionKey(), "hex");
    const iv      = Buffer.from(encrypted.iv,      "hex");
    const authTag = Buffer.from(encrypted.authTag, "hex");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, "hex")),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  } catch {
    // GCM authentication failure (tampered data or key mismatch).
    // Intentionally swallowed — callers receive null and prompt reconnect.
    return null;
  }
}
