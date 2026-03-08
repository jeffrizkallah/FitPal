import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        variables: {
          colorPrimary: "#007AFF",
          colorBackground: "#0A0A0A",
          colorText: "#FFFFFF",
          colorTextSecondary: "rgba(255,255,255,0.55)",
          colorInputBackground: "#111111",
          colorInputText: "#FFFFFF",
          borderRadius: "16px",
          fontFamily: "Inter, -apple-system, sans-serif",
        },
        elements: {
          card: "bg-surface-secondary border border-border shadow-none",
          headerTitle: "text-title font-bold text-text-primary",
          headerSubtitle: "text-label text-text-secondary",
          formButtonPrimary: "btn-primary w-full",
          formFieldInput: "input-field",
          footerActionLink: "text-action hover:text-action/80",
          dividerLine: "bg-border",
          dividerText: "text-text-tertiary text-caption",
          socialButtonsBlockButton:
            "btn-ghost w-full flex items-center justify-center gap-2",
          socialButtonsBlockButtonText: "text-label text-text-primary",
        },
      }}
    />
  );
}
