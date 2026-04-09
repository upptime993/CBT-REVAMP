import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "CBT-REVAMP | Platform Ujian Online",
  description:
    "Platform ujian online modern untuk sekolah dengan fitur anti-cheat dan koreksi otomatis",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark-primary text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#1A1A2E",
              color: "#fff",
              border: "1px solid #2A2A4A",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            },
            success: {
              iconTheme: { primary: "#2ECC71", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#E74C3C", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}