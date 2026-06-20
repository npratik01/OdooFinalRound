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
  )
}

export default DataTable
