// layout.tsx
import './globals.css'
import { Inter, Montserrat, Playfair_Display } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-heading' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const metadata = {
  title: 'FARE 1 TAXI - Premium Transfers',
  description: 'Premium Airport Transfers UK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${montserrat.variable} ${playfair.variable} font-sans bg-primary-black`}>
        <Script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDnN4UvcI26jHDKVymDAI7P5f5Pb7StM6w&libraries=places"
          strategy="beforeInteractive"
        />
        <Script
          src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  )
}