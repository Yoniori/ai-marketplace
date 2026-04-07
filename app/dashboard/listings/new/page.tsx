"use client";

/**
 * /dashboard/listings/new
 *
 * Two-phase submit:
 *   Phase 1 — createListing(textFormData)  → returns listingId
 *   Phase 2 — uploadListingZip(listingId)  → uploads .zip to Storage (optional)
 *
 * Navigation to the detail page happens after both phases, not inside
 * the server action, so the client can always reach the detail page
 * even if the upload fails (the Gatekeeper will fall back to description-only).
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Upload,
  FileArchive,
  X,
  AlertTriangle,
} from "lucide-react";
import { createListing, uploadListingZip } from "@/app/actions/listing";

// ── Stage machine ─────────────────────────────────────────────────────────────
type Stage = "idle" | "creating" | "uploading" | "navigating";

// ── Shared style tokens ───────────────────────────────────────────────────────
const LABEL =
  "font-mono text-[10px] uppercase tracking-[0.16em] text-white/35";
const INPUT =
  "w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 " +
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 " +
  "disabled:opacity-40 transition-colors";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewListingPage() {
  const router       = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage,          setStage]          = useState<Stage>("idle");
  const [error,          setError]          = useState<string | null>(null);
  const [uploadWarning,  setUploadWarning]  = useState<string | null>(null);
  const [priceType,      setPriceType]      = useState<"free" | "paid" | "contact">("free");
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null);

  const isPending = stage !== "idle";

  // ── File input handler ──────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Only .zip files are accepted.");
      e.target.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(`File is ${fmtBytes(file.size)} — maximum is 50 MB.`);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function clearFile() {
    setSelectedFile(null);
    setUploadWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Submit handler (two-phase) ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;

    setError(null);
    setUploadWarning(null);

    // Build FormData from individual named elements (not file inputs)
    const form     = e.currentTarget;
    const get      = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";

    const textData = new FormData();
    textData.set("title",       get("title"));
    textData.set("tagline",     get("tagline"));
    textData.set("description", get("description"));
    textData.set("price_type",  priceType);
    const priceInput = form.elements.namedItem("price_cents") as HTMLInputElement | null;
    if (priceInput) textData.set("price_cents", priceInput.value);

    // ── Phase 1: create the listing row ──────────────────────────────────────
    setStage("creating");

    const createResult = await createListing(null, textData);
    if (!createResult.success) {
      setError(createResult.error);
      setStage("idle");
      return;
    }
    const { listingId } = createResult;

    // ── Phase 2: upload ZIP (optional — non-blocking on failure) ─────────────
    if (selectedFile) {
      setStage("uploading");

      const fileData = new FormData();
      fileData.set("product_zip", selectedFile);

      const uploadResult = await uploadListingZip(listingId, fileData);
      if (!uploadResult.success) {
        // The listing was already created — we still navigate. The Gatekeeper
        // will run on description only and surface a low-confidence score.
        setUploadWarning(uploadResult.error);
      }
    }

    // ── Navigate ──────────────────────────────────────────────────────────────
    setStage("navigating");
    router.push(`/dashboard/listings/${listingId}`);
  }

  // ── Button label ──────────────────────────────────────────────────────────────
  const buttonLabel =
    stage === "creating"   ? "Creating…"  :
    stage === "uploading"  ? "Uploading…" :
    stage === "navigating" ? "Opening…"   :
    "Create draft";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl space-y-8">

      {/* ── Back link ── */}
      <div>
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="h-3 w-3" />
          All listings
        </Link>
      </div>

      {/* ── Header ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-2">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
          New listing
        </h1>
        <p className="mt-1.5 font-mono text-xs text-white/30">
          Create a draft — run the AI quality check before publishing.
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className={LABEL}>
            Title <span className="text-white/20">(required)</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={100}
            placeholder="My AI-powered thing"
            disabled={isPending}
            className={INPUT}
          />
          <p className="font-mono text-[10px] text-white/20">
            120 characters max. Keep it clear and specific.
          </p>
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label htmlFor="tagline" className={LABEL}>
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            maxLength={120}
            placeholder="One sentence that sells it"
            disabled={isPending}
            className={INPUT}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={5000}
            placeholder="What does it do? Who is it for? What problem does it solve?"
            disabled={isPending}
            className={`${INPUT} resize-none`}
          />
          <p className="font-mono text-[10px] text-white/20">
            Markdown is supported when published.
          </p>
        </div>

        {/* Price type */}
        <div className="space-y-2">
          <p className={LABEL}>Pricing</p>
          <div className="flex gap-2">
            {(["free", "paid", "contact"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPriceType(type)}
                disabled={isPending}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs capitalize transition-colors ${
                  priceType === type
                    ? "border-primary/40 bg-primary/[0.1] text-primary"
                    : "border-white/[0.08] text-white/40 hover:border-white/[0.16] hover:text-white/70"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <input type="hidden" name="price_type" value={priceType} />
        </div>

        {/* Price amount — only when paid */}
        {priceType === "paid" && (
          <div className="space-y-1.5">
            <label htmlFor="price_cents" className={LABEL}>
              Price (USD)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-white/30">
                $
              </span>
              <input
                id="price_cents"
                name="price_cents"
                type="number"
                min="1"
                max="9999"
                step="0.01"
                defaultValue="9.00"
                disabled={isPending}
                className={`${INPUT} pl-7`}
              />
            </div>
          </div>
        )}

        {/* ── ZIP upload ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <p className={LABEL}>
            Source files{" "}
            <span className="normal-case text-white/20">
              — .zip, optional, max&nbsp;50&nbsp;MB
            </span>
          </p>
          <p className="font-mono text-[10px] leading-relaxed text-white/20">
            Upload your project ZIP so the Gatekeeper can read your actual code.
            Without a file it still runs, but only on your description.
          </p>

          {/* Drop zone / file preview */}
          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-dashed border-white/[0.10] bg-white/[0.02] px-4 py-7 transition-colors hover:border-white/[0.20] hover:bg-white/[0.04] disabled:pointer-events-none disabled:opacity-40"
            >
              <Upload className="h-4 w-4 text-white/25" />
              <span className="text-sm text-white/35">
                Click to select a <span className="font-mono">.zip</span> file
              </span>
            </button>
          ) : (
            <div
              className="flex items-center gap-3 rounded-md border border-white/[0.08] px-4 py-3"
              style={{ background: "rgba(193,255,254,0.04)" }}
            >
              <FileArchive className="h-4 w-4 shrink-0 text-primary/60" />
              <span className="flex-1 truncate font-mono text-xs text-white/70">
                {selectedFile.name}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-white/30">
                {fmtBytes(selectedFile.size)}
              </span>
              <button
                type="button"
                onClick={clearFile}
                disabled={isPending}
                aria-label="Remove file"
                className="ml-1 shrink-0 text-white/25 transition-colors hover:text-white/60 disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Upload stage progress indicator */}
        {stage === "uploading" && (
          <div className="flex items-center gap-2.5 rounded-md border border-primary/15 bg-primary/[0.04] px-4 py-3">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary/60" />
            <p className="font-mono text-xs text-white/50">
              Uploading <span className="text-white/70">{selectedFile?.name}</span> to secure storage…
            </p>
          </div>
        )}

        {/* Upload warning (non-blocking) */}
        {uploadWarning && (
          <div className="flex items-start gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-300/80">
              <span className="font-semibold">File upload skipped:</span>{" "}
              {uploadWarning} The listing was still created — the Gatekeeper
              will analyse your description only.
            </p>
          </div>
        )}

        {/* Form error */}
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {buttonLabel}
          </button>
          {!isPending && (
            <Link
              href="/dashboard/listings"
              className="text-sm text-white/30 transition-colors hover:text-white/60"
            >
              Cancel
            </Link>
          )}
        </div>

      </form>
    </div>
  );
}
