import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Vibe Code Market account.",
};

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
}

/**
 * /login — Email/password + Google OAuth sign-in.
 * Rendered as a Server Component; form interaction is client-side.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      redirectTo={params.redirectTo}
      urlError={params.error}
    />
  );
}
