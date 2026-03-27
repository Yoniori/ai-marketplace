import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#080808] min-h-screen">
      <div className="container max-w-2xl py-20 space-y-10">

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-3">
            Legal
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 font-mono text-xs text-white/30">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-white/55">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">1. Data We Collect</h2>
            <p>
              We collect the information you provide when creating an account (email, name),
              as well as usage data to improve the platform. For creators, we store the
              information needed to process payouts via Stripe.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">2. How We Use Your Data</h2>
            <p>
              Your data is used to operate the marketplace, process transactions, send
              account-related emails, and improve the platform. We do not sell your personal
              data to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">3. GitHub Integration</h2>
            <p>
              When you connect GitHub for repository import, we store an encrypted access
              token with <code className="font-mono text-xs text-white/50">public_repo read:user</code>{" "}
              scope. This token is only used to list and import your repositories as listings.
              It is never shared with third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">4. Cookies</h2>
            <p>
              We use cookies to maintain your session and for security purposes (OAuth state
              validation). We do not use tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">5. Data Retention</h2>
            <p>
              Your account data is retained while your account is active. You may request
              deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">6. Third-Party Services</h2>
            <p>
              We use Supabase for authentication and data storage, Stripe for payment
              processing, and Vercel for hosting. Each has their own privacy policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">7. Contact</h2>
            <p>
              Privacy questions? Contact us at{" "}
              <a
                href="mailto:hello@vibecodemarket.com"
                className="text-primary/70 transition-colors hover:text-primary"
              >
                hello@vibecodemarket.com
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
