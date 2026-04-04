import { Resend } from "resend";

// Lazy-initialize so missing RESEND_API_KEY doesn't crash the build.
// All email functions are best-effort; callers must handle errors.
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "missing");
}

const FROM = `${process.env.RESEND_FROM_NAME ?? "Vibe Code Market"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@example.com"}>`;

/**
 * Send a purchase receipt to the buyer.
 * Called after checkout.session.completed webhook.
 */
export async function sendPurchaseReceipt({
  to,
  buyerName,
  listingTitle,
  productUrl,
  amountCents,
}: {
  to: string;
  buyerName: string;
  listingTitle: string;
  productUrl: string;
  amountCents: number;
}) {
  // TODO (Step 8): Replace with a proper HTML email template
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your purchase: ${listingTitle} — Vibe Code Market`,
    html: `
      <h2>You're all set, ${buyerName}!</h2>
      <p>You've successfully purchased <strong>${listingTitle}</strong>.</p>
      <p><a href="${productUrl}">Access your product here →</a></p>
      <hr />
      <p style="color: #888; font-size: 12px;">
        Vibe Code Market · Built by vibe coders, for vibe coders.
      </p>
    `,
  });
}

/**
 * Notify the creator when they receive a new review.
 */
export async function sendNewReviewNotification({
  to,
  creatorName,
  listingTitle,
  reviewerName,
  rating,
}: {
  to: string;
  creatorName: string;
  listingTitle: string;
  reviewerName: string;
  rating: number;
}) {
  // TODO (Step 9): Replace with a proper HTML email template
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `New ${rating}★ review on ${listingTitle} — Vibe Code Market`,
    html: `
      <h2>New review on your product!</h2>
      <p>Hi ${creatorName}, <strong>${reviewerName}</strong> left a ${rating}★ review on <strong>${listingTitle}</strong>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/listings">View your listings →</a></p>
    `,
  });
}

/**
 * Notify the admin when an automated listing check returns outcome: 'flagged'.
 * Triggered server-side only — best-effort, failure is swallowed by the caller.
 */
export async function sendCheckFlaggedNotification({
  listingId,
  listingTitle,
  checkId,
}: {
  listingId: string;
  listingTitle: string;
  checkId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return; // No admin email configured — skip silently

  return getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[Action Required] Flagged listing: ${listingTitle} — Vibe Code Market`,
    html: `
      <h2>Automated check flagged a listing</h2>
      <p>A listing was flagged by the automated quality check and requires manual review.</p>
      <table>
        <tr><td><strong>Listing:</strong></td><td>${listingTitle}</td></tr>
        <tr><td><strong>Listing ID:</strong></td><td>${listingId}</td></tr>
        <tr><td><strong>Check ID:</strong></td><td>${checkId}</td></tr>
      </table>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/listing-checks/${checkId}">
          Review in admin dashboard →
        </a>
      </p>
      <hr />
      <p style="color: #888; font-size: 12px;">Vibe Code Market · Automated quality check system</p>
    `,
  });
}

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Welcome to Vibe Code Market!`,
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>You've joined Vibe Code Market — the marketplace built by vibe coders, for vibe coders.</p>
      <p>Browse tools, automations, and AI products built with Claude Code, Cursor, Lovable, and more.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/browse">Start exploring →</a></p>
    `,
  });
}
