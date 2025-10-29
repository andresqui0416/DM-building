import './globals.css'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { ContentWrapper } from '@/components/ContentWrapper'

export const metadata: Metadata = {
  title: 'DM Building',
  description: 'Home Renovation Simulation & Consulting Platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </body>
    </html>
  )
}


