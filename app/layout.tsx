import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "SpełnioneMarzenie.pl",
  description: "Zarządzaj swoimi marzeniami i spełniaj marzenia znajomych",
appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpełnioneMarzenie",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.className} bg-[#f2f5f9] text-gray-900 min-h-screen`}>
        {/* Na telefonie wąska kolumna max-w-md, na komputerze szeroki układ bez cienia bocznego */}
        <div className="mx-auto max-w-md md:max-w-none min-h-screen bg-[#f2f5f9] relative shadow-2xl md:shadow-none flex flex-col">
          
          <TopBar />
          
          {/* Na komputerze treść ma komfortową szerokość max-w-5xl i mniejszy dolny padding */}
          <main className="flex-grow w-full md:max-w-5xl md:mx-auto pb-24 md:pb-12 overflow-y-auto">
            {children}
          </main>
          
          <BottomBar />
          
        </div>
      </body>
    </html>
  );
}