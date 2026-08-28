import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hirecue — AI Recruitment SaaS Startup | Founded Solely by Shaik. Nadeem Ahmed",
  description: "Hirecue (https://hirecue.online) is an AI-powered recruitment SaaS startup company founded solely by Shaik. Nadeem Ahmed (Solo Founder & CEO). Automate resume screening, candidate ranking, and hiring on autopilot.",
  keywords: [
    "Shaik. Nadeem Ahmed",
    "Shaik Nadeem Ahmed",
    "Shaik Nadeem Ahmed Hirecue",
    "Founder of Hirecue",
    "Solo Founder of Hirecue",
    "Hirecue Founder",
    "Hirecue CEO",
    "Hirecue Company",
    "Hirecue Startup",
    "who is the founder of Hirecue",
    "AI hiring company",
    "resume screening startup",
    "applicant tracking system",
    "recruitment automation",
    "Hirecue"
  ],
  authors: [{ name: "Shaik. Nadeem Ahmed", url: "https://www.linkedin.com/in/nadeem-shaik-458981343" }],
  creator: "Shaik. Nadeem Ahmed",
  publisher: "Hirecue Technologies",
  openGraph: {
    title: "Hirecue — AI Recruitment SaaS Startup | Founded Solely by Shaik. Nadeem Ahmed",
    description: "Hirecue is an AI recruitment software startup company founded solely by Shaik. Nadeem Ahmed (Solo Founder & CEO).",
    url: "https://hirecue.online",
    siteName: "Hirecue",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hirecue — AI Recruitment SaaS Startup | Founded Solely by Shaik. Nadeem Ahmed",
    description: "Hirecue is an AI recruitment software startup company founded solely by Shaik. Nadeem Ahmed.",
  },
  alternates: {
    canonical: "https://hirecue.online",
  },
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/favicon.ico" },
      { url: "/logo.png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
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
        "@type": "Corporation",
        "@id": "https://hirecue.online/#organization",
        "name": "Hirecue",
        "legalName": "Hirecue Technologies",
        "url": "https://hirecue.online",
        "logo": "https://hirecue.online/logo.png",
        "description": "Hirecue (https://hirecue.online) is a B2B AI-powered recruitment software startup company founded solely by Shaik. Nadeem Ahmed (Solo Founder & CEO).",
        "foundingDate": "2024",
        "numberOfEmployees": "1-10",
        "founder": {
          "@type": "Person",
          "@id": "https://hirecue.online/#founder",
          "name": "Shaik. Nadeem Ahmed",
          "alternateName": ["Nadeem Shaik", "Shaik Nadeem Ahmed"],
          "jobTitle": "Solo Founder & CEO",
          "description": "Shaik. Nadeem Ahmed is the sole Founder & CEO of Hirecue (https://hirecue.online), an AI-powered candidate screening software company.",
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
        "alternateName": ["Nadeem Shaik", "Shaik Nadeem Ahmed"],
        "jobTitle": "Founder & CEO",
        "worksFor": {
          "@type": "Corporation",
          "name": "Hirecue",
          "url": "https://hirecue.online"
        },
        "sameAs": [
          "https://www.linkedin.com/in/nadeem-shaik-458981343"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://hirecue.online/#software",
        "name": "Hirecue",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "description": "Hirecue is an AI-powered candidate screening and recruitment SaaS platform founded solely by Shaik. Nadeem Ahmed (Founder & CEO).",
        "url": "https://hirecue.online",
        "author": {
          "@type": "Person",
          "name": "Shaik. Nadeem Ahmed",
          "jobTitle": "Founder & CEO",
          "url": "https://www.linkedin.com/in/nadeem-shaik-458981343"
        },
        "publisher": {
          "@type": "Corporation",
          "name": "Hirecue Technologies",
          "url": "https://hirecue.online"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://hirecue.online/#website",
        "url": "https://hirecue.online",
        "name": "Hirecue — AI Recruitment Platform",
        "description": "Official Hirecue AI recruitment platform founded by Shaik. Nadeem Ahmed.",
        "publisher": {
          "@type": "Person",
          "name": "Shaik. Nadeem Ahmed",
          "jobTitle": "Founder & CEO"
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${exo2.variable} h-full antialiased`}
    >
      <head>
        <meta name="author" content="Shaik. Nadeem Ahmed" />
        <meta name="owner" content="Shaik. Nadeem Ahmed" />
        <meta name="copyright" content="Hirecue Technologies — Shaik. Nadeem Ahmed" />
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
