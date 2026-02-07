/**
 * Reusable table summary footer.
 *
 * Props:
 * - rows: Array<{ label, value, valueClassName? }>
 * - totalRow?: { label, value, valueClassName? } — bold bottom row after divider
 */
export default function TableSummary({ rows, totalRow }) {
  return (
    <div className="mt-auto border-t-2 border-gray-100 bg-gray-50/50 px-4 md:px-8 py-4 md:py-6">
      <div className="flex justify-end">
        <div className="space-y-2 md:space-y-3 w-full md:w-auto md:min-w-[320px]">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs md:text-sm font-medium text-textSecondary">{row.label}</span>
              <span className={`text-base md:text-lg font-semibold ${row.valueClassName || 'text-textPrimary'}`}>{row.value}</span>
            </div>
          ))}
          {totalRow && (
            <>
              <div className="h-px bg-border my-1 md:my-2" />
              <div className="flex justify-between items-center pt-1 md:pt-2">
                <span className="text-sm md:text-base font-bold text-textPrimary">{totalRow.label}</span>
                <span className={`text-xl md:text-2xl font-bold ${totalRow.valueClassName || 'text-accentOrange'}`}>{totalRow.value}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
