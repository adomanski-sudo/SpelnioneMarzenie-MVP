import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BottomBar from "@/components/BottomBar";

// Używamy nowoczesnej i prostej czcionki Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpełnioneMarzenie.pl - MVP",
  description: "Zarządzaj swoimi marzeniami i spełniaj marzenia znajomych",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.className} bg-gray-100 text-gray-900`}>
        {/* 
          Zamykamy całą aplikację w kontenerze. 
          Na komputerze będzie to wyśrodkowany prostokąt (imitacja ekranu telefonu). 
          Na komórce zajmie 100% szerokości. 
        */}
        <div className="mx-auto max-w-md min-h-screen bg-[#f2f5f9] relative shadow-2xl flex flex-col">
          
          <TopBar />
          
          {/* Główna treść strony (strona główna, znajomi, profil).
              Dajemy dolny padding (pb-24), żeby treści nie chowały się pod wystającym plusem! 
          */}
          <main className="grow pb-24 overflow-y-auto">
            {children}
          </main>
          
          <BottomBar />
          
        </div>
      </body>
    </html>
  );
}