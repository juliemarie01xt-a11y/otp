import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwiftOTP | Best Virtual Numbers for SMS Verification",
  description: "Bypass SMS verification instantly with SwiftOTP. Buy high-quality virtual numbers from 150+ countries. Accept crypto (USDT, BTC, LTC). Auto-refund on failure.",
  keywords: [
    "virtual number",
    "SMS verification",
    "bypass OTP",
    "temporary phone number",
    "buy virtual number with crypto",
    "receive SMS online",
    "Telegram SMS verification",
    "Google Voice verification",
    "cheap virtual numbers",
    "crypto accepted",
    "SwiftOTP",
    "Swift OTP",
    "temp number"
  ],
  authors: [{ name: "SwiftOTP Team" }],
  creator: "SwiftOTP",
  publisher: "SwiftOTP",
  metadataBase: new URL("https://swiftotp.store"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://swiftotp.store",
    title: "SwiftOTP | Bypass SMS Verification Instantly",
    description: "Get reliable virtual phone numbers from all around the world. Pay securely with cryptocurrency and get instant OTPs.",
    siteName: "SwiftOTP",
    images: [
      {
        url: "/og-image.jpg", // You can upload an OG image later
        width: 1200,
        height: 630,
        alt: "SwiftOTP - Instant Virtual Numbers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftOTP | Best Virtual Numbers for SMS Verification",
    description: "Bypass SMS verification instantly with SwiftOTP. Buy high-quality virtual numbers with crypto.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
        {/* JSON-LD Structured Data for better Google Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SwiftOTP",
              "operatingSystem": "Web",
              "applicationCategory": "UtilitiesApplication",
              "description": "Instant virtual phone numbers for seamless SMS verification worldwide, accepting cryptocurrency payments.",
              "url": "https://swiftotp.store",
              "offers": {
                "@type": "Offer",
                "price": "0.10",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
