import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import DataTableCheckbox from './DataTableCheckbox'

/**
 * Reusable DataTable component.
 *
 * Props:
 * - columns: Array<{ key, label, colSpan, align?, headerAlign? }>
 * - rows: Array<object> — data items
 * - renderRow: (row, index, { isSelected, toggleSelect }) => ReactNode[] — returns array of cell contents
 * - rowKey: (row) => string|number — unique key extractor
 * - onRowClick?: (row) => void
 * - getRowClassName?: (row) => string — extra classes per row (e.g. border-l color)
 * - selectable?: boolean — show checkboxes
 * - isLoading?: boolean
 * - emptyIcon?: ReactNode
 * - emptyTitle?: string
 * - emptyMessage?: string
 * - footer?: ReactNode — summary footer below the table body
 * - loadMore?: { hasMore, isLoading, onLoadMore } — infinite scroll / load more
 */
export default function DataTable({
  columns,
  rows,
  renderRow,
  rowKey,
  onRowClick,
  getRowClassName,
  selectable = true,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyMessage = '',
  footer,
  loadMore
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())

  const allSelected = rows.length > 0 && selectedIds.size === rows.length
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rows.map((r) => rowKey(r))))
    }
  }
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Total col spans for the grid
  const totalCols = columns.reduce((sum, c) => sum + c.colSpan, 0) + (selectable ? 1 : 0)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {emptyIcon || <FileText className="w-16 h-16 text-gray-300 mb-4" />}
        <h2 className="text-lg font-semibold text-textSecondary mb-1">{emptyTitle}</h2>
        {emptyMessage && <p className="text-sm text-textSecondary">{emptyMessage}</p>}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col" style={{ minHeight: 400 }}>
      {/* Table Header */}
      <div
        className="grid gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-textSecondary uppercase tracking-wider items-center border-b border-border"
        style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
      >
        {selectable && (
          <div className="col-span-1 flex items-center justify-center">
            <DataTableCheckbox checked={allSelected} onChange={toggleAll} />
          </div>
        )}
        {columns.map((col) => (
          <div
            key={col.key}
            className={`col-span-${col.colSpan} ${col.headerAlign === 'center' ? 'text-center' : col.headerAlign === 'right' ? 'text-right' : ''}`}
            style={{ gridColumn: `span ${col.colSpan} / span ${col.colSpan}` }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="flex-1">
        {rows.map((row, index) => {
          const id = rowKey(row)
          const isSelected = selectedIds.has(id)
          const extraClass = getRowClassName ? getRowClassName(row) : ''
          const cells = renderRow(row, index, { isSelected, toggleSelect: () => toggleSelect(id) })

          return (
            <div
              key={id}
              onClick={() => onRowClick?.(row)}
              className={`grid gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors group text-sm ${onRowClick ? 'cursor-pointer' : ''} ${extraClass}`}
              style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
            >
              {selectable && (
                <div className="col-span-1 flex items-center justify-center">
                  <DataTableCheckbox checked={isSelected} onChange={() => toggleSelect(id)} />
                </div>
              )}
              {cells.map((cell, ci) => (
                <div
                  key={columns[ci]?.key || ci}
                  className={`${columns[ci]?.align === 'center' ? 'text-center' : columns[ci]?.align === 'right' ? 'text-right' : ''}`}
                  style={{ gridColumn: `span ${columns[ci]?.colSpan || 1} / span ${columns[ci]?.colSpan || 1}` }}
                >
                  {cell}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {loadMore?.hasMore && (
        <div className="px-6 py-4 text-center border-t border-border">
          <button
            onClick={loadMore.onLoadMore}
            disabled={loadMore.isLoading}
            className="text-sm text-primary hover:underline font-medium"
          >
            {loadMore.isLoading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {/* Summary Footer */}
      {footer}
    </div>
  )
}
