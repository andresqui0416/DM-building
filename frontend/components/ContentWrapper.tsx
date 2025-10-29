'use client'

import { usePathname } from 'next/navigation'

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't add padding on admin pages (they have their own layout)
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }
  
  // Add padding-top for fixed navbar on other pages
  return <div className="pt-16">{children}</div>
}

