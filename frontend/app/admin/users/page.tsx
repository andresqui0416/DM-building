'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/src/lib/api/auth'

interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
  stats: {
    totalProjects: number
    totalOrders: number
    activeOrders: number
    activeChats: number
    pendingOrders: number
  }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  
  // Initialize state with defaults (to avoid hydration mismatch)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1
  })

  // Parse URL params helper
  const parseUrlParams = () => {
    if (typeof window === 'undefined') return { page: 1, limit: 25 }
    const params = new URLSearchParams(window.location.search)
    return {
      page: params.get('page') ? parseInt(params.get('page')!, 10) : 1,
      limit: params.get('limit') ? parseInt(params.get('limit')!, 10) : 25
    }
  }

  // Initialize from URL params on client side only (after mount)
  useEffect(() => {
    setIsMounted(true)
    const { page: initialPage, limit: initialLimit } = parseUrlParams()
    setPage(initialPage)
    setLimit(initialLimit)
  }, []) // Only run once on mount

  // Sync state from URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return
    
    const handlePopState = () => {
      const { page: newPage, limit: newLimit } = parseUrlParams()
      setPage(prev => prev !== newPage ? newPage : prev)
      setLimit(prev => prev !== newLimit ? newLimit : prev)
    }
    
    window.addEventListener('popstate', handlePopState)
    // Also check on mount in case URL changed
    const { page: newPage, limit: newLimit } = parseUrlParams()
    setPage(prev => prev !== newPage ? newPage : prev)
    setLimit(prev => prev !== newLimit ? newLimit : prev)
    
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isMounted])

  // Update URL when page/limit changes (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!isMounted) return
    
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (limit !== 25) params.set('limit', limit.toString())
    
    const newUrl = `/admin/users${params.toString() ? `?${params.toString()}` : ''}`
    // Only update if URL actually changed to avoid loops
    const currentUrl = window.location.pathname + window.location.search
    if (newUrl !== currentUrl) {
      router.replace(newUrl as any)
    }
  }, [page, limit, router, isMounted])

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token')
    if (!token) {
      const currentPath = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    fetchUsers()
  }, [router, page, limit])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<{
        success: boolean
        data: User[]
        pagination: {
          total: number
          totalPages: number
          page: number
        }
      }>(`/api/admin/users?page=${page}&limit=${limit}`)

      if (data.success) {
        setUsers(data.data || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      // If it's an auth error, apiRequest will handle redirect
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    )
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
    // URL will be updated by useEffect
  }

  const updatePage = (newPage: number) => {
    setPage(newPage)
    // URL will be updated by useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm text-gray-600">
              Show:
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25</option>
              <option value={40}>40</option>
              <option value={100}>100</option>
            </select>
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Chats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                          {getInitials(user.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.stats.totalProjects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.stats.totalOrders}</div>
                      {user.stats.activeOrders > 0 && (
                        <div className="text-xs text-blue-600">
                          {user.stats.activeOrders} active
                        </div>
                      )}
                      {user.stats.pendingOrders > 0 && (
                        <div className="text-xs text-yellow-600">
                          {user.stats.pendingOrders} pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.stats.activeChats > 0 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {user.stats.activeChats} active
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.emailVerified ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}` as any)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} users
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => updatePage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => updatePage(pageNum)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => updatePage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

