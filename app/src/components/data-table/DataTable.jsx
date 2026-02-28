import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import DataTableCheckbox from './DataTableCheckbox'

/**
 * Reusable DataTable component.
 *
 * Props:
 * - columns: Array<{ key, label, colSpan, align?, headerAlign? }>
 * - rows: Array<object> — data items
 * - renderRow: (row, index, { isSelected, toggleSelect }) => ReactNode[] — returns array of cell contents
 * - renderMobileCard?: (row, index) => ReactNode — optional custom mobile card renderer
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
  renderMobileCard,
  rowKey,
  onRowClick,
  onMobileRowClick,
  getRowClassName,
  selectable = true,
  onSelectionChange,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyMessage = '',
  footer,
  loadMore
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => {
    onSelectionChange?.(selectedIds)
  }, [selectedIds])

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
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        {emptyIcon || <FileText className="w-12 h-12 text-gray-300 mb-3" />}
        <h2 className="text-sm font-semibold text-textSecondary mb-0.5">{emptyTitle}</h2>
        {emptyMessage && <p className="text-sm text-textSecondary">{emptyMessage}</p>}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col" style={{ minHeight: 200 }}>
      {/* Desktop Table Header — hidden on mobile */}
      <div
        className="hidden md:grid gap-3 px-5 py-2 bg-gray-50 text-[11px] font-semibold text-textSecondary uppercase tracking-wider items-center border-b border-border"
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
            <div key={id}>
              {/* Mobile Card View */}
              {renderMobileCard ? (
                <div
                  onClick={() => (onMobileRowClick || onRowClick)?.(row)}
                  className={`md:hidden px-3 py-2 border-b border-borderLight active:bg-gray-50 transition-colors ${(onMobileRowClick || onRowClick) ? 'cursor-pointer' : ''} ${extraClass}`}
                >
                  {renderMobileCard(row, index)}
                </div>
              ) : (
                <div
                  onClick={() => (onMobileRowClick || onRowClick)?.(row)}
                  className={`md:hidden px-3 py-2 border-b border-borderLight active:bg-gray-50 transition-colors ${(onMobileRowClick || onRowClick) ? 'cursor-pointer' : ''} ${extraClass}`}
                >
                  {/* Default mobile: show first and last cells */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">{cells[0]}</div>
                    <div className="shrink-0 text-right">{cells[cells.length - 1]}</div>
                  </div>
                  {cells.length > 2 && (
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {cells.slice(1, -1).map((cell, ci) => (
                        <div key={ci} className="text-xs text-textSecondary tap-target-auto">{cell}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Grid Row */}
              <div
                onClick={() => onRowClick?.(row)}
                className={`hidden md:grid gap-3 px-5 py-2.5 items-center hover:bg-gray-50 transition-colors group text-sm ${onRowClick ? 'cursor-pointer' : ''} ${extraClass}`}
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
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {loadMore?.hasMore && (
        <div className="px-5 py-2.5 text-center border-t border-border">
          <button
            onClick={loadMore.onLoadMore}
            disabled={loadMore.isLoading}
            className="text-sm text-primary active:underline md:hover:underline font-medium px-4 py-2"
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
