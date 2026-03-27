import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="bg-[#080808] min-h-screen">
      <div className="container max-w-2xl py-20 space-y-10">

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-3">
            Legal
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">
            Terms of Service
          </h1>
          <p className="mt-3 font-mono text-xs text-white/30">
            Last updated: {new Date().getFullYear()}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-white/55">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Vibe Code Market, you agree to be bound by these Terms of
              Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">2. Use of the Platform</h2>
            <p>
              Vibe Code Market is a marketplace for AI-built software products. Buyers may
              purchase and use listed products for their intended purposes. Creators may list
              and sell their original work subject to our content guidelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">3. Creator Accounts</h2>
            <p>
              Creator accounts may list products for sale. A platform fee of 10% applies to
              each sale. Payouts are processed via Stripe Connect. Vibe Code Market reserves
              the right to remove listings that violate our guidelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">4. Intellectual Property</h2>
            <p>
              Creators retain ownership of their listed products. By listing a product, you
              grant buyers a non-exclusive license to use it as described. You represent that
              you have the rights to sell the listed product.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">5. Disclaimer</h2>
            <p>
              The platform is provided &ldquo;as is&rdquo; without warranties of any kind.
              Vibe Code Market is not responsible for the quality, accuracy, or fitness of
              listed products.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">6. Changes</h2>
            <p>
              We may update these terms at any time. Continued use of the platform after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white/80">7. Contact</h2>
            <p>
              Questions about these terms? Contact us at{" "}
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
