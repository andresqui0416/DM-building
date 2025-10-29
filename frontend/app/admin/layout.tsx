'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication on client side only
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      // Not authenticated - redirect immediately
      const currentPath = window.location.pathname + window.location.search
      window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    try {
      const user = JSON.parse(userData)
      if (user.role !== 'admin') {
        // Not admin - redirect immediately
        window.location.replace('/dashboard')
        return
      }
      setIsAuthorized(true)
    } catch {
      // Invalid user data - redirect
      const currentPath = window.location.pathname + window.location.search
      window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [])

  // Don't render until auth check is complete (to avoid hydration mismatch)
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // If not authorized, don't render anything (redirect already happening)
  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-14">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)] p-6 ml-60">
        {children}
      </main>
    </div>
  );
}
