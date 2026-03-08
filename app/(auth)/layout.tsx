export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Subtle radial gradient behind auth form */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,122,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div className="w-full max-w-sm animate-fade-in">
        {/* Wordmark */}
        <p className="text-display font-bold tracking-tight text-center mb-10">
          FitPal
        </p>
        {children}
      </div>
    </main>
  );
}
