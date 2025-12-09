import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
// Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: "FARE 1 TAXI - Premium Transfers",
  description: "Safe Ride, Best Price. Airport Transfers UK.",
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