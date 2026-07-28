import type { Metadata } from 'next'
import Script from 'next/script'
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = GeistSans;
const _geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'Shema Humanitarian Services',
  description: 'SHEMA — Strengthening Humanity through Empowerment, Mentorship, and Advocacy — delivers humanitarian assistance, psychosocial support, and economic empowerment to widows, orphans, and IDPs across Northeast Nigeria. Join us as a partner or sponsor.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7KK7XW92T1');
          `}
        </Script>
      </head>

      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}