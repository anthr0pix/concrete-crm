import { verifyPortalToken } from "@/lib/portal-token";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentCancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Verify the token is valid (even though no data is needed)
  try {
    await verifyPortalToken(token);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f4f5" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a1a2e" }} className="px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg tracking-wide uppercase">Mountain West Surface</p>
            <p className="text-white/60 text-xs mt-0.5">Professional Surface Cleaning & Sealing</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">(435) 709-6999</p>
            <p className="text-white/60 text-xs">mwsurfaceco@gmail.com</p>
          </div>
        </div>
      </header>

      {/* Accent bar */}
      <div style={{ backgroundColor: "#e94560", height: 4 }} />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Cancelled notice box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          {/* Warning icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-8 w-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-amber-800 mb-2">Payment Cancelled</h1>
          <p className="text-amber-700 text-sm leading-relaxed max-w-md mx-auto mb-4">
            No charges have been made to your account. You can try again whenever you&apos;re ready.
          </p>

          <p className="text-amber-600 text-xs">
            If you have any questions, please don&apos;t hesitate to contact us.
          </p>
        </div>

        {/* Action links */}
        <div className="text-center mt-8 space-x-4">
          <Link
            href={`/portal/${token}`}
            className="inline-block px-6 py-2.5 text-sm font-medium rounded-lg transition-colors"
            style={{ backgroundColor: "#1a1a2e", color: "#fff" }}
          >
            Back to Portal
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            <strong className="text-gray-800">Mountain West Surface LLC</strong> ·{" "}
            <a href="tel:+14357096999" className="hover:underline">(435) 709-6999</a> ·{" "}
            <a href="mailto:mwsurfaceco@gmail.com" className="hover:underline">mwsurfaceco@gmail.com</a>
          </p>
          <p className="text-gray-400 text-xs mt-1">mountainwestsurface.com</p>
        </div>
      </footer>
    </div>
  );
}
