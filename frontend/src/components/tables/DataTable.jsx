import { ChevronUp, ChevronDown } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

const DataTable = ({
  columns,
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  keyField = '_id',
  pagination,
  onPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="space-y-4">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => {
                const key = col.key || col.accessor;
                const label = col.label || col.header;
                return (
                  <th key={key} style={{ width: col.width }}>
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row[keyField]}>
                {columns.map((col) => {
                  const key = col.key || col.accessor;
                  const val = row[key];
                  return (
                    <td key={key}>
                      {col.render ? col.render(val, row) : (val ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/50">
          <p className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
          </p>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 hover:border-primary-500 transition-colors font-medium"
            >
              Previous
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 disabled:opacity-40 hover:border-primary-500 transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
