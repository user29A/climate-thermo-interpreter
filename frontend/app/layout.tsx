import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://climate-thermo-interpreter.vercel.app"),
  title: "Thermodynamic Climate Interpreter",
  description: "Ask any question about radiation, thermodynamics, the greenhouse effect, CO₂, and atmospheric physics. All answers are based on rigorous thermodynamic and mathematical principles that demonstrate the radiative greenhouse effect does not exist.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Thermodynamic Climate Interpreter",
    description: "Ask questions about the climate. Get answers from thermodynamics.",
    url: "https://climate-thermo-interpreter.vercel.app",
    siteName: "Thermodynamic Climate Interpreter",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Thermodynamic Climate Interpreter — Ask questions about the climate. Get answers from thermodynamics.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thermodynamic Climate Interpreter",
    description: "Ask questions about the climate. Get answers from thermodynamics.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}