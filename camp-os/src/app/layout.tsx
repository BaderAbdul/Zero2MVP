import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { CampProvider } from "@/lib/services/CampContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ['300', '400', '500', '600', '700'],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "Camp OS",
  description: "The Operating System for From Zero to MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${plexSansArabic.variable}`}>
      <body className={`${inter.variable} ${plexSansArabic.variable}`}>
        <CampProvider>
          {children}
        </CampProvider>
      </body>
    </html>
  );
}
