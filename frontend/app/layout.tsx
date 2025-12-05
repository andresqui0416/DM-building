import './globals.css'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { ContentWrapper } from '@/components/ContentWrapper'
import { ThemeProvider } from '@/src/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'DM Building',
  description: 'Home Renovation Simulation & Consulting Platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Navbar />
          <ContentWrapper>
            {children}
          </ContentWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}


