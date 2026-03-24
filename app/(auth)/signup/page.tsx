import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Vibe Code Market — free forever.",
};

/**
 * /signup — Email/password + Google OAuth registration.
 * Rendered as a Server Component; form interaction is client-side.
 */
export default function SignupPage() {
  return <SignupForm />;
}
