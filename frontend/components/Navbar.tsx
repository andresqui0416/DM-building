'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserMenu } from './UserMenu'

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token')
      setIsLoggedIn(!!token)
    }
    
    // Check on mount
    checkLoginStatus()
    
    // Listen for storage changes (logout from other tabs/windows)
    window.addEventListener('storage', checkLoginStatus)
    
    // Listen for custom logout event (logout from same tab)
    window.addEventListener('logout', checkLoginStatus)
    
    // Check on pathname change (in case logout happens in same tab)
    checkLoginStatus()
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus)
      window.removeEventListener('logout', checkLoginStatus)
    }
  }, [pathname])


  return (
    <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            DM Building
          </Link>
          <div className="flex gap-4 items-center">
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

