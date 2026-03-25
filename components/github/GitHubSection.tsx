"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, CheckCircle } from "lucide-react";
import type { GitHubRepo } from "@/app/api/github/repos/route";

/**
 * GitHubSection
 *
 * Shown on the /dashboard/settings page.
 *
 * Two states driven by the `githubUsername` prop (read server-side):
 *   null  → show "Connect GitHub" prompt
 *   string → show connection badge + lazy repo browser + import controls
 *
 * The repo list is fetched lazily on button click (GET /api/github/repos).
 * Each repo has an "Import" button that calls POST /api/github/import.
 * On success the user is navigated to the new draft listing.
 */

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface GitHubSectionProps {
  githubUsername: string | null;
}

export function GitHubSection({ githubUsername }: GitHubSectionProps) {
  const router = useRouter();

  // Repo browser state
  const [repos,       setRepos]       = useState<GitHubRepo[] | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError,   setRepoError]   = useState<string | null>(null);

  // Per-repo import state
  const [importingId, setImportingId] = useState<number | null>(null);
  // repo_id → listing_id for repos imported in this session
  const [imported,    setImported]    = useState<Record<number, string>>({});

  // ── Load repos ────────────────────────────────────────────────
  async function loadRepos() {
    setLoadingRepos(true);
    setRepoError(null);
    try {
      const res = await fetch("/api/github/repos");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load repositories");
      setRepos(data.repos as GitHubRepo[]);
    } catch (err: unknown) {
      setRepoError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingRepos(false);
    }
  }

  // ── Import repo ───────────────────────────────────────────────
  async function importRepo(repo: GitHubRepo) {
    setImportingId(repo.id);
    try {
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_id:        repo.id,
          repo_full_name: repo.full_name,
          repo_name:      repo.name,
          description:    repo.description,
        }),
      });

      const data = await res.json() as { listing_id?: string; error?: string };

      if (res.status === 409 && data.listing_id) {
        // Already imported — navigate to that listing.
        router.push(`/dashboard/listings/${data.listing_id}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      if (data.listing_id) {
        setImported((prev) => ({ ...prev, [repo.id]: data.listing_id! }));
      }
    } catch (err: unknown) {
      // Surface as a simple inline error for now.
      setRepoError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportingId(null);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // NOT CONNECTED
  // ─────────────────────────────────────────────────────────────
  if (!githubUsername) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/40">
            <GitHubMark />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80">Connect GitHub</p>
            <p className="mt-1 text-xs text-white/35 leading-relaxed">
              Connect your GitHub account to import repositories as draft listings.
              Uses a separate OAuth app from your login method.
            </p>
            <a
              href="/api/github/connect"
              className="mt-3 inline-flex h-8 items-center gap-2 rounded-md border border-white/[0.10] bg-white/[0.04] px-3.5 text-xs font-medium text-white/65 transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white/90"
            >
              <GitHubMark />
              Connect GitHub
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CONNECTED
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Connection badge */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400/80">
            <GitHubMark />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">GitHub connected</p>
            <p className="font-mono text-xs text-white/35">@{githubUsername}</p>
          </div>
        </div>
        <a
          href="/api/github/connect"
          className="text-xs text-white/25 transition-colors hover:text-white/50"
        >
          Reconnect
        </a>
      </div>

      {/* Browse button — shown until repos are loaded */}
      {!repos && (
        <button
          onClick={loadRepos}
          disabled={loadingRepos}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-4 text-xs font-medium text-white/50 transition-colors hover:border-white/[0.14] hover:text-white/80 disabled:opacity-50"
        >
          {loadingRepos
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <GitHubMark />
          }
          {loadingRepos ? "Loading repositories…" : "Browse repositories"}
        </button>
      )}

      {/* Error */}
      {repoError && (
        <p className="text-xs text-red-400">{repoError}</p>
      )}

      {/* Empty state */}
      {repos && repos.length === 0 && (
        <p className="text-xs text-white/30">No public repositories found on your GitHub account.</p>
      )}

      {/* Repo list */}
      {repos && repos.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
            Your repositories · {repos.length}
          </p>

          <div className="divide-y divide-white/[0.04] overflow-hidden rounded-lg border border-white/[0.08]">
            {repos.map((repo) => {
              const isImporting      = importingId === repo.id;
              const isAnyImporting   = importingId !== null;
              const importedListingId = imported[repo.id];

              return (
                <div key={repo.id} className="flex items-start gap-3 bg-[#0a0a0a] px-4 py-3.5">

                  {/* Repo info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-white/80 hover:text-white transition-colors truncate"
                      >
                        {repo.name}
                      </a>
                      {repo.private && (
                        <span className="rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-white/25">
                          private
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="mt-0.5 text-xs text-white/35 line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-3">
                      {repo.language && (
                        <span className="font-mono text-[10px] text-white/25">
                          {repo.language}
                        </span>
                      )}
                      {repo.stars > 0 && (
                        <span className="flex items-center gap-0.5 font-mono text-[10px] text-white/25">
                          <Star className="h-2.5 w-2.5" />
                          {repo.stars}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {importedListingId ? (
                    <a
                      href={`/dashboard/listings/${importedListingId}`}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1.5 font-mono text-[10px] text-emerald-400/80 transition-colors hover:bg-emerald-500/[0.14]"
                    >
                      <CheckCircle className="h-3 w-3" />
                      View listing
                    </a>
                  ) : (
                    <button
                      onClick={() => importRepo(repo)}
                      disabled={isAnyImporting}
                      className="shrink-0 inline-flex h-7 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 font-mono text-[10px] text-white/40 transition-colors hover:border-white/[0.14] hover:text-white/70 disabled:opacity-40"
                    >
                      {isImporting && <Loader2 className="h-3 w-3 animate-spin" />}
                      {isImporting ? "Importing…" : "Import"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
