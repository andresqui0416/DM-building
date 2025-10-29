'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      const currentPath = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Projects</h2>
            <p className="text-gray-600">Manage your renovation projects</p>
            <button className="mt-4 text-blue-600 hover:text-blue-700">
              View Projects →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Support Chat</h2>
            <p className="text-gray-600">Get help from our team</p>
            <button 
              onClick={() => router.push('/chat')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Start Chat →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Orders</h2>
            <p className="text-gray-600">Track your orders</p>
            <button className="mt-4 text-blue-600 hover:text-blue-700">
              View Orders →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

