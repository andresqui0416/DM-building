'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/src/lib/api/auth'
import { Folder, FolderOpen, Tag, ChevronRight, ChevronDown, Box } from 'lucide-react'

interface Material {
  id: string
  name: string
  categoryId: string
  unit: string
  unitCost: number
  textureUrl: string | null
  modelUrl: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface MaterialCategory {
  id: string
  name: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
}

export default function AdminMaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [paramsReady, setParamsReady] = useState(false)
  
  // Initialize state with defaults (to avoid hydration mismatch)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('') // Local state for input field
  const [activeTab, setActiveTab] = useState<'materials' | 'categories'>('materials')
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1
  })
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Parse URL params helper
  const parseUrlParams = () => {
    if (typeof window === 'undefined') return { page: 1, limit: 25, category: '', isActive: '', search: '' }
    const params = new URLSearchParams(window.location.search)
    const rawSearch = params.get('search') || ''
    return {
      page: params.get('page') ? parseInt(params.get('page')!, 10) : 1,
      limit: params.get('limit') ? parseInt(params.get('limit')!, 10) : 25,
      category: params.get('categoryId') || '',
      isActive: params.get('isActive') || '',
      // Convert '+' to spaces for readability and matching backend decoding
      search: rawSearch.replace(/\+/g, ' ')
    }
  }

  // Initialize from URL params on client side only (after mount)
  useEffect(() => {
    setIsMounted(true)
    const { page: initialPage, limit: initialLimit, category: initialCategory, isActive: initialActive, search } = parseUrlParams()
    setPage(initialPage)
    setLimit(initialLimit)
    setCategoryFilter(initialCategory)
    setActiveFilter(initialActive)
    setSearchQuery(search)
    setSearchInput(search) // Initialize input field
    // Mark params as ready after applying all
    setParamsReady(true)
  }, []) // Only run once on mount

  // Sync state from URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return
    
    const handlePopState = () => {
      const { page: newPage, limit: newLimit, category: newCategory, isActive: newActive, search } = parseUrlParams()
      setPage(prev => prev !== newPage ? newPage : prev)
      setLimit(prev => prev !== newLimit ? newLimit : prev)
      setCategoryFilter(prev => prev !== newCategory ? newCategory : prev)
      setActiveFilter(prev => prev !== newActive ? newActive : prev)
      setSearchQuery(prev => prev !== search ? search : prev)
      setSearchInput(search) // Sync input field with URL
    }
    
    window.addEventListener('popstate', handlePopState)
    // Also check on mount in case URL changed
    const { page: newPage, limit: newLimit, category: newCategory, isActive: newActive, search } = parseUrlParams()
    setPage(prev => prev !== newPage ? newPage : prev)
    setLimit(prev => prev !== newLimit ? newLimit : prev)
    setCategoryFilter(prev => prev !== newCategory ? newCategory : prev)
    setActiveFilter(prev => prev !== newActive ? newActive : prev)
    setSearchQuery(prev => prev !== search ? search : prev)
    setSearchInput(search) // Sync input field with URL
    
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isMounted])

  // Update URL when filters/pagination/search change (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!isMounted || !paramsReady) return
    
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (limit !== 25) params.set('limit', limit.toString())
    if (categoryFilter) params.set('categoryId', categoryFilter)
    if (activeFilter) params.set('isActive', activeFilter)
    if (searchQuery) params.set('search', searchQuery)
    
    const newUrl = `/admin/materials${params.toString() ? `?${params.toString()}` : ''}`
    // Only update if URL actually changed to avoid loops
    const currentUrl = window.location.pathname + window.location.search
    if (newUrl !== currentUrl) {
      // Use router.replace which does client-side navigation without full page reload
      router.replace(newUrl as any, { scroll: false })
    }
  }, [page, limit, categoryFilter, activeFilter, searchQuery, router, isMounted, paramsReady])

  // Debounce search input - only updates searchQuery and fetches, doesn't update URL
  useEffect(() => {
    if (!isMounted) return
    
    const debounceTimer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        const wasFocused = document.activeElement === searchInputRef.current
        setSearchQuery(searchInput)
        setPage(1) // Reset to first page when search changes
        // Restore focus if input was focused before update
        if (wasFocused && searchInputRef.current) {
          requestAnimationFrame(() => {
            searchInputRef.current?.focus()
          })
        }
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchInput, isMounted, searchQuery]) // Include searchQuery to avoid stale closure


  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token')
    if (!token) {
      const currentPath = window.location.pathname + window.location.search
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    // Only fetch after initial params have been applied
    if (paramsReady) {
      fetchMaterials()
    }
  }, [router, page, limit, categoryFilter, activeFilter, searchQuery, paramsReady])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      if (categoryFilter) params.append('categoryId', categoryFilter)
      if (activeFilter) params.append('isActive', activeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const data = await apiRequest<{
        success: boolean
        data: Material[]
        categories: MaterialCategory[]
        pagination: {
          total: number
          totalPages: number
          page: number
        }
      }>(`/api/admin/materials?${params.toString()}`)

      if (data.success) {
        setMaterials(data.data || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        setCategories(data.categories || [])
        // Auto-expand categories that have selected filter
        if (categoryFilter) {
          const selectedCategory = data.categories?.find(c => c.id === categoryFilter)
          if (selectedCategory?.parentId) {
            setExpandedCategories(prev => new Set([...prev, selectedCategory.parentId!]))
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      // If it's an auth error, apiRequest will handle redirect
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this material?')) {
      return
    }

    try {
      await apiRequest(`/api/admin/materials/${id}`, {
        method: 'DELETE'
      })
      fetchMaterials()
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate material')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading materials...</div>
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

  const updateCategoryFilter = (newCategory: string) => {
    setCategoryFilter(newCategory)
    setPage(1) // Reset to first page when changing filter
    // URL will be updated by useEffect
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const hasChildren = (categoryId: string) => {
    return categories.some(c => c.parentId === categoryId)
  }

  const updateActiveFilter = (newActive: string) => {
    setActiveFilter(newActive)
    setPage(1) // Reset to first page when changing filter
    // URL will be updated by useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Materials Management</h1>
        <button
          onClick={fetchMaterials}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            className={`py-2 text-sm ${activeTab === 'materials' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('materials')}
          >
            Materials
          </button>
          <button
            className={`py-2 text-sm ${activeTab === 'categories' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </nav>
      </div>

      {/* Content area with left category tree */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left category tree */}
        <aside className="col-span-12 md:col-span-3 bg-white border rounded-lg shadow-sm">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-800">Categories</h2>
            </div>
          </div>
          <div className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <ul className="space-y-1">
              <li>
                <button
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    categoryFilter === ''
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                  onClick={() => updateCategoryFilter('')}
                >
                  <Box className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">All Materials</span>
                </button>
              </li>
              {categories
                .filter(c => !c.parentId)
                .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name))
                .map(root => {
                  const isExpanded = expandedCategories.has(root.id)
                  const hasSubcategories = hasChildren(root.id)
                  const isSelected = categoryFilter === root.id
                  
                  return (
                    <li key={root.id} className="group">
                      <div className="flex items-center">
                        {hasSubcategories && (
                          <button
                            onClick={() => toggleCategory(root.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                        {!hasSubcategories && <div className="w-6" />}
                        <button
                          className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                          }`}
                          onClick={() => updateCategoryFilter(root.id)}
                        >
                          {isExpanded || !hasSubcategories ? (
                            <FolderOpen className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <Folder className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm flex-1 text-left">{root.name}</span>
                          {hasSubcategories && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                              {categories.filter(c => c.parentId === root.id).length}
                            </span>
                          )}
                        </button>
                      </div>
                      {/* nested children */}
                      {hasSubcategories && isExpanded && (
                        <ul className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                          {categories
                            .filter(c => c.parentId === root.id)
                            .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name))
                            .map(child => {
                              const isChildSelected = categoryFilter === child.id
                              return (
                                <li key={child.id}>
                                  <button
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                                      isChildSelected
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                    }`}
                                    onClick={() => updateCategoryFilter(child.id)}
                                  >
                                    <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="font-medium text-sm">{child.name}</span>
                                  </button>
                                </li>
                              )
                            })}
                        </ul>
                      )}
                    </li>
                  )
                })}
            </ul>
          </div>
        </aside>

        {/* Right content */}
        <section className="col-span-12 md:col-span-9 space-y-6">
          {activeTab === 'materials' ? (
            <>
              {/* Filters and Controls */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-end gap-4 mb-4">
                  <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="flex gap-2">
                      <input
                        ref={searchInputRef}
                        id="search"
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSearchQuery(searchInput)
                            setPage(1)
                          }
                        }}
                        placeholder="Search materials by name or description..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          setSearchQuery(searchInput)
                          setPage(1)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      id="active"
                      value={activeFilter}
                      onChange={(e) => updateActiveFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
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
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                  >
                    Add Material
                  </button>
                </div>
              </div>

              {/* Materials table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Material
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            No materials found
                          </td>
                        </tr>
                      ) : (
                        materials.map((material) => (
                          <tr key={material.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{material.name}</div>
                              {material.textureUrl && (
                                <div className="text-xs text-gray-500">Has texture</div>
                              )}
                              {material.modelUrl && (
                                <div className="text-xs text-gray-500">Has 3D model</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(material.unitCost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {material.unit}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {material.description || <span className="text-gray-400">No description</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {material.isActive ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(material.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingMaterial(material)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                {material.isActive && (
                                  <button
                                    onClick={() => handleDelete(material.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </div>
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
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} materials
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
            </>
          ) : (
            // Categories editor placeholder
            <div className="bg-white border rounded-lg p-4">
              <div className="text-sm text-gray-600">Category management UI will go here (create, rename, move, toggle active).</div>
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Modal (simplified - can be expanded later) */}
      {(showAddModal || editingMaterial) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </h2>
            <p className="text-gray-500 mb-4">
              Material editing form will be implemented here.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingMaterial(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

