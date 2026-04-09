import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iKORI N5 Pass Engine",
  description: "JLPT N5 Pass Readiness Trainer — by iKori",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: "iKORI N5",
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
