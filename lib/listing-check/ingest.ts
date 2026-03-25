/**
 * lib/listing-check/ingest.ts
 * Downloads and extracts the creator's uploaded zip, returning the
 * most relevant source files for the Claude quality check.
 *
 * MVP constraints:
 *   - Zip uploads only (GitHub URL support is Phase 2)
 *   - At most MAX_FILES files passed to Claude
 *   - At most MAX_LINES lines per file
 *   - Binary files are skipped silently
 *   - If the zip cannot be read, returns empty (check proceeds on description only)
 */

import JSZip from "jszip";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngestedFile } from "./types";

// ── Constants ─────────────────────────────────────────────────

/** Maximum number of files forwarded to Claude. */
const MAX_FILES = 3;

/** Lines per file before truncation. */
const MAX_LINES = 200;

/** Hard byte cap per file after truncation (~20 KB). */
const MAX_FILE_BYTES = 20_000;

/** Storage bucket name. */
const BUCKET = "listing-files";

/**
 * Basenames checked first, in priority order.
 * Lowercase — comparison is case-insensitive.
 */
const PRIORITY_BASENAMES = [
  "readme.md",
  "readme.txt",
  "readme",
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "composer.json",
  "index.ts",
  "index.js",
  "main.ts",
  "main.py",
  "main.js",
  "app.py",
  "app.ts",
];

/** File extensions that are definitively binary — always skipped. */
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".bmp", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".mp3", ".mp4", ".avi", ".mov", ".wav",
  ".db", ".sqlite", ".lock",
]);

// ── Helpers ───────────────────────────────────────────────────

function basename(relativePath: string): string {
  return relativePath.split("/").at(-1) ?? relativePath;
}

function extension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function isBinary(filename: string): boolean {
  return BINARY_EXTENSIONS.has(extension(filename));
}

/** Lower index = higher priority. Returns PRIORITY_BASENAMES.length for unknown files. */
function priorityScore(filename: string): number {
  const lower = filename.toLowerCase();
  const idx = PRIORITY_BASENAMES.indexOf(lower);
  return idx === -1 ? PRIORITY_BASENAMES.length : idx;
}

function truncateToLines(content: string, maxLines: number): string {
  const lines = content.split("\n");
  if (lines.length <= maxLines) return content;
  return (
    lines.slice(0, maxLines).join("\n") +
    `\n// ... truncated at ${maxLines} lines`
  );
}

// ── Main export ───────────────────────────────────────────────

/**
 * Download the zip at `filesPath` from Supabase Storage and return
 * the highest-priority readable source files.
 *
 * Returns `{ files: [], fileNames: [] }` on any failure so the check
 * can still proceed using the listing description alone.
 */
export async function ingestFiles(
  filesPath: string | null,
  supabase: SupabaseClient
): Promise<{ files: IngestedFile[]; fileNames: string[] }> {
  if (!filesPath) {
    return { files: [], fileNames: [] };
  }

  // 1. Download zip from Supabase Storage
  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(filesPath);

  if (downloadError || !blob) {
    console.error(
      "[listing-check/ingest] Storage download failed:",
      downloadError?.message ?? "no data returned"
    );
    return { files: [], fileNames: [] };
  }

  // 2. Parse zip
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await blob.arrayBuffer());
  } catch (err) {
    console.error("[listing-check/ingest] Failed to parse zip:", err);
    return { files: [], fileNames: [] };
  }

  // 3. Collect non-directory, non-binary entries
  type Entry = { relativePath: string; file: JSZip.JSZipObject };
  const entries: Entry[] = [];

  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    const name = basename(relativePath);
    if (isBinary(name)) return;
    entries.push({ relativePath, file });
  });

  // 4. Sort: priority files first, then alphabetical by basename
  entries.sort((a, b) => {
    const na = basename(a.relativePath);
    const nb = basename(b.relativePath);
    const pa = priorityScore(na);
    const pb = priorityScore(nb);
    if (pa !== pb) return pa - pb;
    return na.localeCompare(nb);
  });

  // 5. Read the top MAX_FILES files
  const selected = entries.slice(0, MAX_FILES);
  const files: IngestedFile[] = [];

  for (const { relativePath, file } of selected) {
    const name = basename(relativePath);
    try {
      const raw = await file.async("string");
      const content = truncateToLines(raw, MAX_LINES);
      if (Buffer.byteLength(content, "utf8") <= MAX_FILE_BYTES) {
        files.push({ name, content });
      }
    } catch {
      // Skip files that can't be read as text — not an error
    }
  }

  return {
    files,
    fileNames: files.map((f) => f.name),
  };
}
