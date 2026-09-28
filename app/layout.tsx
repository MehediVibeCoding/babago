import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource/playfair-display/latin-600.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/hind-siliguri/latin-400.css";
import "@fontsource/hind-siliguri/latin-500.css";
import "@fontsource/hind-siliguri/latin-600.css";
import "@fontsource/hind-siliguri/latin-700.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "@fontsource/hind-siliguri/bengali-700.css";

export const metadata: Metadata = {
  title: "অ্যাডমিন প্যানেল | Ahsan's Learning Academy",
  description: "Ahsan's Learning Academy — শিক্ষার্থী, বেতন, ব্যাচ ও কন্টেন্ট ম্যানেজমেন্ট অ্যাডমিন প্যানেল।",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="min-h-screen antialiased">
        <div aria-hidden="true" className="fixed inset-0 -z-10 sky-gradient" />
        {children}
      </body>
    </html>
  );
}
