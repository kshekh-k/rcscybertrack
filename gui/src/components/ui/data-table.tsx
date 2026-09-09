import React, { useState } from 'react'
import { Search, ChevronDown, ChevronUp, ArrowUpDown, ChevronLeft, ChevronRight, AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Input } from './input'
import { Button } from './button'

export interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  searchPlaceholder?: string
  enableSelection?: boolean
  bulkActions?: (selectedIds: string[]) => React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  searchPlaceholder = 'Filter records...',
  enableSelection = false,
  bulkActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Search Filter
  const filteredData = data.filter((row) => {
    if (!searchQuery) return true
    return JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return 0
    const valA = String((a as Record<string, unknown>)[sortKey] ?? '')
    const valB = String((b as Record<string, unknown>)[sortKey] ?? '')
    const comp = valA.localeCompare(valB, undefined, { numeric: true })
    return sortDirection === 'asc' ? comp : -comp
  })

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else setSortKey(null)
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedData.map(keyExtractor))
    }
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-3">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={searchPlaceholder}
            className="pl-9 text-xs"
          />
        </div>

        {/* Bulk Action Toolbar */}
        {enableSelection && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span>{selectedIds.length} selected</span>
            {bulkActions && bulkActions(selectedIds)}
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="bg-slate-50 dark:bg-[#1E293B]/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                {enableSelection && (
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 tracking-wider font-semibold uppercase text-[10px]',
                      col.sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-200',
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                // Loading State
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {enableSelection && <td className="px-4 py-3"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded"></div></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                // Error State
                <tr>
                  <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-rose-500">
                      <AlertCircle className="w-6 h-6" />
                      <span className="font-semibold text-xs">{error}</span>
                      {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 gap-1.5">
                          <RefreshCw className="w-3 h-3" /> Retry Loading
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Inbox className="w-8 h-8 opacity-40" />
                      <span className="font-medium text-xs">No records matching your search filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                // Rows
                paginatedData.map((row) => {
                  const key = keyExtractor(row)
                  const isSelected = selectedIds.includes(key)
                  return (
                    <tr
                      key={key}
                      className={cn(
                        'transition-colors duration-150',
                        isSelected
                          ? 'bg-blue-50/60 dark:bg-blue-500/10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      )}
                    >
                      {enableSelection && (
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(key)}
                            className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className={cn('px-4 py-3 text-slate-700 dark:text-slate-300 font-normal', col.className)}>
                          {col.accessor(row)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-[#1E293B]/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredData.length)}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredData.length}</span> records
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="px-2 font-mono text-[11px]">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
