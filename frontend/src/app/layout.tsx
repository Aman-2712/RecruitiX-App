import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hirecue — AI-Powered Hiring Platform | Founded by Shaik. Nadeem Ahmed",
  description: "Hirecue is an AI-powered candidate screening and recruitment platform founded by Shaik. Nadeem Ahmed. Automate resume parsing, candidate scoring, and pipeline management on autopilot.",
  keywords: [
    "Shaik. Nadeem Ahmed",
    "Shaik Nadeem Ahmed",
    "Shaik Nadeem Ahmed Hirecue",
    "Founder of Hirecue",
    "Hirecue Founder",
    "Hirecue CEO",
    "who is the founder of Hirecue",
    "AI hiring",
    "resume screening",
    "applicant tracking system",
    "recruitment automation",
    "Hirecue"
  ],
  authors: [{ name: "Shaik. Nadeem Ahmed", url: "https://www.linkedin.com/in/nadeem-shaik-458981343" }],
  creator: "Shaik. Nadeem Ahmed",
  publisher: "Hirecue",
  openGraph: {
    title: "Hirecue — AI-Powered Hiring Platform | Founded by Shaik. Nadeem Ahmed",
    description: "Hirecue automates resume screening, candidate scoring, and recruitment management. Founded by Shaik. Nadeem Ahmed.",
    url: "https://hirecue.online",
    siteName: "Hirecue",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hirecue — AI-Powered Hiring Platform | Founded by Shaik. Nadeem Ahmed",
    description: "Hirecue automates resume screening and candidate scoring. Founded by Shaik. Nadeem Ahmed.",
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
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://hirecue.online/#organization",
        "name": "Hirecue",
        "url": "https://hirecue.online",
        "logo": "https://hirecue.online/logo.png",
        "description": "Hirecue is an AI-powered candidate screening and recruitment automation platform.",
        "founder": {
          "@type": "Person",
          "@id": "https://hirecue.online/#founder",
          "name": "Shaik. Nadeem Ahmed",
          "jobTitle": "Founder & CEO",
          "url": "https://www.linkedin.com/in/nadeem-shaik-458981343",
          "sameAs": [
            "https://www.linkedin.com/in/nadeem-shaik-458981343"
          ]
        }
      },
      {
        "@type": "Person",
        "@id": "https://hirecue.online/#founder",
        "name": "Shaik. Nadeem Ahmed",
        "jobTitle": "Founder & CEO",
        "worksFor": {
          "@type": "Organization",
          "name": "Hirecue",
          "url": "https://hirecue.online"
        },
        "sameAs": [
          "https://www.linkedin.com/in/nadeem-shaik-458981343"
        ]
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${exo2.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
