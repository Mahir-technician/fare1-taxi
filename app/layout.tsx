import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import 'mapbox-gl/dist/mapbox-gl.css';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Fare1 Taxi - Premium Chauffeur Service",
  description: "Book premium taxis in Southampton and airport transfers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} font-sans bg-primary-black text-gray-200`}>
        {children}
      </body>
    </html>
  );
}