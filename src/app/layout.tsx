import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { LanguageProvider } from "@/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgriME - Agricultural Marketplace & Farmer Support Platform",
  description: "Smart agriculture platform for Indian farmers. Real-time crop prices, price prediction, crop-buying dealer directory, farm machinery rental, e-commerce, and government schemes.",
  keywords: "AgriME, farmer platform, crop prices, mandi rates, tractor rental, combine harvester, agricultural dealers, PM-Kisan, APMC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <LanguageProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
