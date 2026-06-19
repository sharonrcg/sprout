import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Hanken_Grotesk } from 'next/font/google'
import { ServiceWorkerRegistration } from '@/app/Components/ServiceWorkerRegistration'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  style: ['normal', 'italic'],
  weight: '400',
  subsets: ['latin'],
})

const hankenGrotesque = Hanken_Grotesk({
  variable: '--font-hanken-grotesk',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
})

export const viewport: Viewport = {
  themeColor: '#FAF5EA',
}

export const metadata: Metadata = {
  title: 'sprout',
  description: 'A cozy home for the books you love',
  manifest: '/manifest.json',
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html
    lang="en"
    className={`${instrumentSerif.variable} ${hankenGrotesque.variable} h-full antialiased`}
  >
    <body className="min-h-full flex flex-col">
    <ServiceWorkerRegistration />
    {children}
  </body>
  </html>
)

export default RootLayout
