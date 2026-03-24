"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// Sign Up — email + password
// ─────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const password = formData.get("password")  as string;
  const name     = (formData.get("name")     as string)?.trim();

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name || null,
      },
      // emailRedirectTo is set in Supabase Dashboard → Auth → URL Configuration
    },
  });

  if (error) {
    // Surface friendly messages for common Supabase errors
    if (error.message.includes("already registered")) {
      return {
        success: false,
        error: "An account with this email already exists. Try signing in.",
      };
    }
    if (error.message.includes("Password should be")) {
      return { success: false, error: "Password must be at least 8 characters." };
    }
    return { success: false, error: error.message };
  }

  // Supabase sends a confirmation email by default.
  // If email confirmations are disabled in the dashboard, the user is
  // automatically signed in and we redirect straight to the dashboard.
  redirect("/auth/check-email");
}

// ─────────────────────────────────────────────────────────────
// Sign In — email + password
// ─────────────────────────────────────────────────────────────

export async function signInWithEmail(
  _prevState: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const password = formData.get("password")  as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return {
        success: false,
        error: "Incorrect email or password. Please try again.",
      };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "Please check your email and confirm your account first.",
      };
    }
    return { success: false, error: error.message };
  }

  // Validate redirectTo is a relative path (prevent open redirect)
  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  redirect(safeRedirect);
}

// ─────────────────────────────────────────────────────────────
// Sign Out
// ─────────────────────────────────────────────────────────────

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ─────────────────────────────────────────────────────────────
// Get the currently authenticated user (server-side)
// Use in Server Components / Route Handlers.
// ─────────────────────────────────────────────────────────────

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

// ─────────────────────────────────────────────────────────────
// Get the full profile for the current user (server-side)
// ─────────────────────────────────────────────────────────────

export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
