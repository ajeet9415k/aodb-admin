import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AODB Admin',
  description: 'Admin panel for Airport Operations Database',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}