export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: "var(--neuo-bg)" }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        {/* Neumorphic card */}
        <div
          className="rounded-4xl px-8 py-10"
          style={{
            backgroundColor: "var(--neuo-bg)",
            boxShadow: "8px 8px 16px var(--neuo-dark), -8px -8px 16px var(--neuo-light)",
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
