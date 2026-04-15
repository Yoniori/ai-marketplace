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

// ── GitHub ingestion ──────────────────────────────────────────

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_USER_AGENT = "VibecodeMarket/1.0";

/**
 * Fetch the most relevant files from a GitHub repo using the owner's
 * stored access token. Falls back to `{ files: [], fileNames: [] }` on
 * any error so the check can still proceed on description alone.
 */
export async function ingestFromGitHub(
  repoFullName: string,
  accessToken: string
): Promise<{ files: IngestedFile[]; fileNames: string[] }> {
  const headers = {
    Authorization:          `Bearer ${accessToken}`,
    Accept:                 "application/vnd.github+json",
    "User-Agent":           GITHUB_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    // 1. Get default branch name
    const repoRes = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}`, {
      headers,
      cache: "no-store",
    });
    if (!repoRes.ok) return { files: [], fileNames: [] };
    const repoData = (await repoRes.json()) as { default_branch?: string };
    const defaultBranch = repoData.default_branch ?? "main";

    // 2. Get the full file tree (recursive)
    const treeRes = await fetch(
      `${GITHUB_API_BASE}/repos/${repoFullName}/git/trees/${defaultBranch}?recursive=1`,
      { headers, cache: "no-store" }
    );
    if (!treeRes.ok) return { files: [], fileNames: [] };
    const treeData = (await treeRes.json()) as {
      tree?: Array<{ path: string; type: string }>;
    };

    // 3. Filter to text blobs, sort by priority
    const candidates = (treeData.tree ?? [])
      .filter((item) => item.type === "blob" && !isBinary(basename(item.path)))
      .sort((a, b) => {
        const pa = priorityScore(basename(a.path));
        const pb = priorityScore(basename(b.path));
        if (pa !== pb) return pa - pb;
        return basename(a.path).localeCompare(basename(b.path));
      })
      .slice(0, MAX_FILES)
      .map((item) => item.path);

    // 4. Fetch each file's raw content
    const files: IngestedFile[] = [];
    for (const path of candidates) {
      try {
        const fileRes = await fetch(
          `${GITHUB_API_BASE}/repos/${repoFullName}/contents/${path}`,
          {
            headers: { ...headers, Accept: "application/vnd.github.raw+json" },
            cache: "no-store",
          }
        );
        if (!fileRes.ok) continue;
        const raw = await fileRes.text();
        const content = truncateToLines(raw, MAX_LINES);
        if (Buffer.byteLength(content, "utf8") <= MAX_FILE_BYTES) {
          files.push({ name: basename(path), content });
        }
      } catch {
        // skip unreadable files
      }
    }

    return { files, fileNames: files.map((f) => f.name) };
  } catch (err) {
    console.error("[listing-check/ingest] GitHub fetch failed:", err);
    return { files: [], fileNames: [] };
  }
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
