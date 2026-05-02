import { AuthModal } from "@/components/auth/AuthModal";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { ToastContainer } from "@/components/ui/Toast";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GALIGTAN — Монгол бичиг сурах систем",
  description: "GALIGTAN — түвшинд суурилсан монгол бичиг сурах систем",
  icons: {
    icon: "/galigtan-logo.png",
    shortcut: "/galigtan-logo.png",
    apple: "/galigtan-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={nunito.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mongolian&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-nunito  bg-paper text-ink min-h-screen overflow-x-hidden antialiased">
        <Navbar />
        <main className="pt-16 min-h-screen">{children}</main>
        <Footer />
        <AuthModal />
        <RevealObserver />
        <ToastContainer />
      </body>
    </html>
  );
}
