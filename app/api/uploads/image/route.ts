import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/uploads/image
 * Returns a presigned Supabase Storage URL for direct browser-to-storage upload.
 *
 * Body: { bucket: "avatars" | "listing-thumbnails", filename: string, contentType: string }
 *
 * Response: { signedUrl: string, path: string, token: string }
 *
 * The client should PUT the file directly to signedUrl.
 * After upload, the public URL is: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bucket      = body.bucket as string;
  const filename    = body.filename as string;
  const contentType = body.contentType as string;

  // Validate inputs
  if (!bucket || !["avatars", "listing-thumbnails"].includes(bucket)) {
    return NextResponse.json(
      { error: 'bucket must be "avatars" or "listing-thumbnails"' },
      { status: 400 }
    );
  }
  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: `contentType must be one of: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Sanitize filename — strip directory traversal, keep extension only
  const ext       = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt   = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const timestamp = Date.now();
  const path      = `${user.id}/${timestamp}.${safeExt}`;

  // Use admin client to generate presigned URL (bypasses RLS for the sign operation)
  let admin: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    admin = await createAdminClient();
  } catch {
    // Fall back to user client — may fail if storage RLS is strict
    admin = supabase as unknown as Awaited<ReturnType<typeof createAdminClient>>;
  }

  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[POST /api/uploads/image] createSignedUploadUrl error:", error?.message);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    token: data.token,
  });
}
