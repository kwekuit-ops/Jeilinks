import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Toaster } from "react-hot-toast";
import { getSystemSettings } from "@/app/admin/settings/actions";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", preload: false });

export const metadata: Metadata = {
  title: "JEILINKS - Mobile Data Reseller",
  description: "Fast, affordable mobile data for MTN, Telecel, and AirtelTigo. Become an agent and start earning today.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();
  const supportNumber = settings["SUPPORT_WHATSAPP"] || "233540000000";

  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <FloatingWhatsApp number={supportNumber} />
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
