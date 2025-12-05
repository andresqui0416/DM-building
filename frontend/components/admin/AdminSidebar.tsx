'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/src/contexts/ThemeContext'

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/experts', label: 'Experts' }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar } = useTheme()
  const prevPathnameRef = useRef(pathname)

  // Close sidebar when route changes on mobile (but not on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      // Only close if pathname actually changed (not on initial mount)
      if (prevPathnameRef.current !== pathname && prevPathnameRef.current !== null) {
        closeSidebar()
      }
      prevPathnameRef.current = pathname
    }
  }, [pathname, closeSidebar])

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 w-60 bg-white border-r h-[calc(100vh-3.5rem)] overflow-y-auto z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <nav className="p-3 space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href as any}
                onClick={() => {
                  // Close sidebar on mobile when a link is clicked
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    closeSidebar()
                  }
                }}
                className={`block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}


