import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hirecue — AI-Powered Hiring Platform",
  description: "Hirecue automates resume screening, candidate scoring, and pipeline management using AI. Find your next hire in seconds, not hours.",
  keywords: ["AI hiring", "resume screening", "applicant tracking system", "recruitment automation", "Hirecue", "talent acquisition"],
  authors: [{ name: "Hirecue" }],
  openGraph: {
    title: "Hirecue — AI-Powered Hiring Platform",
    description: "Hirecue automates resume screening, candidate scoring, and pipeline management using AI. Find your next hire in seconds, not hours.",
    url: "https://hirecue.online",
    siteName: "Hirecue",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hirecue — AI-Powered Hiring Platform",
    description: "Hirecue automates resume screening, candidate scoring, and pipeline management using AI.",
  },
  alternates: {
    canonical: "https://hirecue.online",
  },
};

import SplashScreen from "@/components/SplashScreen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${exo2.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
