"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";
import { getInitials } from "@/lib/utils";

interface AvatarUploadProps {
  userId:      string;
  avatarUrl:   string | null;
  displayName: string;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED  = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AvatarUpload({ userId, avatarUrl, displayName }: AvatarUploadProps) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string | null>(avatarUrl);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initials = getInitials(displayName || "?");

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 2 MB.");
      return;
    }

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    startTransition(async () => {
      const ext      = file.name.split(".").pop() ?? "jpg";
      const path     = `${userId}/avatar.${ext}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        setPreview(avatarUrl); // revert
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Bust the CDN cache with a timestamp query param
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const fd = new FormData();
      fd.set("avatar_url", publicUrl);
      const result = await updateProfile(null, fd);

      if (!result.success) {
        setError(result.error);
        setPreview(avatarUrl);
      } else {
        setPreview(publicUrl);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="group relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        aria-label="Change avatar"
      >
        {/* Avatar or initials */}
        {preview ? (
          <Image
            src={preview}
            alt={displayName}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary">
            {initials}
          </span>
        )}

        {/* Overlay */}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
          {isPending ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </span>
      </button>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Uploading…" : "Change photo"}
        </button>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPEG, PNG, WebP or GIF · max 2 MB
        </p>
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // reset so same file can be re-selected
        }}
      />
    </div>
  );
}
