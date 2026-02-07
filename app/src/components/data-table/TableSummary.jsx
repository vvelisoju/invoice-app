/**
 * Reusable table summary footer.
 *
 * Props:
 * - rows: Array<{ label, value, valueClassName? }>
 * - totalRow?: { label, value, valueClassName? } — bold bottom row after divider
 */
export default function TableSummary({ rows, totalRow }) {
  return (
    <div className="mt-auto border-t-2 border-gray-100 bg-gray-50/50 px-8 py-6">
      <div className="flex justify-end">
        <div className="space-y-3 min-w-[320px]">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm font-medium text-textSecondary">{row.label}</span>
              <span className={`text-lg font-semibold ${row.valueClassName || 'text-textPrimary'}`}>{row.value}</span>
            </div>
          ))}
          {totalRow && (
            <>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold text-textPrimary">{totalRow.label}</span>
                <span className={`text-2xl font-bold ${totalRow.valueClassName || 'text-accentOrange'}`}>{totalRow.value}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
