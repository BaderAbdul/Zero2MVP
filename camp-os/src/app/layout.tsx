import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CampProvider } from "@/lib/services/CampContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className={inter.variable}>
      <body className={inter.variable}>
        <CampProvider>
          {children}
        </CampProvider>
      </body>
    </html>
  );
}
