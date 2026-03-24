-- ============================================================
-- 010_github_connections.sql
-- Vibe Code Market — GitHub OAuth Integration
-- ============================================================
-- Two tables:
--
--   github_connections
--     One row per platform user. Stores the AES-256-GCM encrypted
--     GitHub OAuth token with its IV and auth tag as separate columns.
--     An UPSERT on user_id handles reconnections cleanly.
--
--   github_imported_repos
--     Tracks which GitHub repos have been imported as draft listings.
--     Prevents duplicate imports. listing_id is nullable so that
--     deleting a listing does not erase the import history.
-- ============================================================

-- ── github_connections ────────────────────────────────────────

CREATE TABLE public.github_connections (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Platform user — one connection per account (UNIQUE enforced)
  user_id                 UUID        NOT NULL UNIQUE
                                        REFERENCES public.profiles(id)
                                        ON DELETE CASCADE,

  -- GitHub identity (numeric ID is stable; login is for display only)
  github_user_id          BIGINT      NOT NULL,
  github_username         TEXT        NOT NULL,

  -- AES-256-GCM encrypted token stored as three separate hex fields.
  -- Never store the plaintext token. Decrypt server-side only.
  encrypted_access_token  TEXT        NOT NULL,
  token_iv                TEXT        NOT NULL,   -- 12-byte IV, hex-encoded
  token_auth_tag          TEXT        NOT NULL,   -- 16-byte GCM auth tag, hex-encoded

  -- Scopes granted by the user at authorisation time.
  -- MVP value: "public_repo,read:user"
  token_scope             TEXT        NOT NULL,

  connected_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.github_connections
  IS 'GitHub OAuth connections for creators. One row per platform user. Token is AES-256-GCM encrypted.';
COMMENT ON COLUMN public.github_connections.encrypted_access_token
  IS 'AES-256-GCM ciphertext of the GitHub access token, hex-encoded.';
COMMENT ON COLUMN public.github_connections.token_iv
  IS '12-byte AES-GCM initialization vector, hex-encoded. Unique per encryption call.';
COMMENT ON COLUMN public.github_connections.token_auth_tag
  IS '16-byte AES-GCM authentication tag, hex-encoded. Validates integrity on decryption.';
COMMENT ON COLUMN public.github_connections.token_scope
  IS 'OAuth scopes granted by the user, comma-separated. E.g. "public_repo,read:user".';

-- Auto-bump updated_at on any change (re-connect overwrites the row via upsert)
CREATE TRIGGER trg_github_connections_updated_at
  BEFORE UPDATE ON public.github_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── github_imported_repos ─────────────────────────────────────

CREATE TABLE public.github_imported_repos (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id               UUID        NOT NULL
                                      REFERENCES public.profiles(id)
                                      ON DELETE CASCADE,

  -- Nullable: set to NULL if the linked listing is deleted.
  -- The import history is preserved for deduplication purposes.
  listing_id            UUID
                          REFERENCES public.listings(id)
                          ON DELETE SET NULL,

  github_repo_id        BIGINT      NOT NULL,
  github_repo_full_name TEXT        NOT NULL,   -- "owner/repo"

  imported_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One import record per (user, repo) — prevents duplicate imports.
  CONSTRAINT uq_user_repo UNIQUE (user_id, github_repo_id)
);

COMMENT ON TABLE  public.github_imported_repos
  IS 'Tracks which GitHub repos have been imported as listings. Prevents duplicate imports per user.';
COMMENT ON COLUMN public.github_imported_repos.listing_id
  IS 'The draft listing created from this repo. NULL if the listing was later deleted.';
COMMENT ON COLUMN public.github_imported_repos.github_repo_id
  IS 'GitHub numeric repo ID — stable even if the repo is renamed.';

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX idx_github_connections_user_id
  ON public.github_connections (user_id);

CREATE INDEX idx_github_imported_repos_user_id
  ON public.github_imported_repos (user_id);

CREATE INDEX idx_github_imported_repos_listing_id
  ON public.github_imported_repos (listing_id);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.github_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_imported_repos ENABLE ROW LEVEL SECURITY;

-- ── github_connections policies ───────────────────────────────

-- Users can read their own connection status (username, scope, etc.)
-- NOTE: encrypted_access_token, token_iv, token_auth_tag are in this row.
--       Only server-side code (admin client) should decrypt them —
--       this policy just allows the row to be visible to its owner.
CREATE POLICY "github_connections: self select"
  ON public.github_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Direct row insert is blocked for anon/service-level clients.
-- The callback route uses createAdminClient() which bypasses RLS,
-- but this policy defends against a bug that accidentally uses the
-- anon-key client to insert someone else's connection row.
CREATE POLICY "github_connections: self insert"
  ON public.github_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "github_connections: self update"
  ON public.github_connections FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "github_connections: self delete"
  ON public.github_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "github_connections: admin all"
  ON public.github_connections FOR ALL
  USING (public.is_admin());

-- ── github_imported_repos policies ───────────────────────────

CREATE POLICY "github_imported_repos: self select"
  ON public.github_imported_repos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "github_imported_repos: self insert"
  ON public.github_imported_repos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "github_imported_repos: self delete"
  ON public.github_imported_repos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "github_imported_repos: admin all"
  ON public.github_imported_repos FOR ALL
  USING (public.is_admin());
