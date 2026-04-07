import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FindMyVibeDrawer } from "@/components/discover/FindMyVibeDrawer";

/**
 * Shared layout for all public-facing marketing pages.
 * Includes the Navbar, Footer, and the Find My Vibe AI assistant drawer.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FindMyVibeDrawer />
    </div>
  );
}
