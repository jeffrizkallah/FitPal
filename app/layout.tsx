import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PwaInstaller from "@/components/PwaInstaller";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forma",
  description: "Your intelligent fitness companion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Forma",
  },
};

export const viewport: Viewport = {
  themeColor: "#f0f0f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} style={{ colorScheme: "light", backgroundColor: "#f0f0f0" }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="bg-surface text-text-primary antialiased">
        <PwaInstaller />
        {children}
      </body>
    </html>
  );
}
