import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "react-hot-toast";
import { getSystemSettings } from "@/app/admin/settings/actions";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Maintenance } from "@/components/Maintenance";
import OneSignalInit from "@/components/OneSignalInit";



const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: true });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", preload: true });

export const metadata: Metadata = {
  title: "JEILINKS - Mobile Data Reseller",
  description: "Fast, reliable mobile data for MTN, Telecel, and AirtelTigo. Delivered within 1 to 30 minutes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();
  const session = await getServerSession(authOptions);
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  const isMaintenanceMode = settings["MAINTENANCE_MODE"] === "true";
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");

  const showMaintenance = isMaintenanceMode && !isAdmin && !isAdminRoute && !isAuthRoute && !isApiRoute;

  const supportNumber = settings["SUPPORT_WHATSAPP"] || "233540000000";


  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Providers>
          {showMaintenance ? (
            <Maintenance supportNumber={supportNumber} />
          ) : (
            <>
              <Navbar />
              <main className="flex-grow pb-24 md:pb-12 overflow-x-hidden">
                {children}
              </main>
              <Footer />
              <BottomNav />
              <FloatingWhatsApp 
                number={supportNumber} 
                channelUrl={settings["WHATSAPP_CHANNEL_URL"] || ""} 
              />
            </>
          )}
          <Toaster position="top-center" />
          <OneSignalInit appId={settings["NEXT_PUBLIC_ONESIGNAL_APP_ID"] || ""} />
        </Providers>


      </body>
    </html>
  );
}
