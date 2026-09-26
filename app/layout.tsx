import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "অ্যাডমিন প্যানেল | Ahsan's Learning Academy",
  description: "Ahsan's Learning Academy — শিক্ষার্থী, বেতন, ব্যাচ ও কন্টেন্ট ম্যানেজমেন্ট অ্যাডমিন প্যানেল।",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
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
    <html lang="bn">
      <head>
        {/*
          মূল সাইট (ahsans-learning-academy)-এর মতোই ফন্ট <link> ট্যাগে লোড
          করা হচ্ছে, next/font/google দিয়ে না — কারণ next/font/google বিল্ড
          টাইমে Google Fonts থেকে ফেচ করে, যেটা মূল সাইটে Vercel বিল্ড ক্র্যাশ
          করেছিল (দেখুন app/layout.tsx-এর কমেন্ট, main website রিপোতে)।
          একই সমস্যা এড়াতে এখানেও একই পদ্ধতি অনুসরণ করা হলো।
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&text=%E0%A7%A6%E0%A7%A7%E0%A7%A8%E0%A7%A9%E0%A7%AA%E0%A7%AB%E0%A7%AC%E0%A7%AD%E0%A7%AE%E0%A7%AF&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <div aria-hidden="true" className="fixed inset-0 -z-10 sky-gradient" />
        {children}
      </body>
    </html>
  );
}
