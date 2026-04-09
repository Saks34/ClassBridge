import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

export default function Table({ columns, data, onAction, emptyMessage = 'No data available', itemsPerPage = 10 }) {
    const [currentPage, setCurrentPage] = useState(1);

    if (!data || data.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="flex flex-col overflow-hidden bg-surface-container border border-outline-variant/10 rounded-2xl">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-container-high border-b border-outline-variant/10">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-on-surface-variant/70"
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                        {paginatedData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-surface-container-high/50 transition-colors group">
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-on-surface">
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/10 bg-surface-container-high/50">
                    <span className="text-sm text-on-surface-variant/70">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-1.5 rounded-lg border border-outline-variant/20 transition-colors ${
                                currentPage === 1
                                    ? 'opacity-40 cursor-not-allowed text-on-surface-variant/50'
                                    : 'hover:bg-surface-bright/10 text-on-surface hover:border-outline-variant/40'
                            }`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-on-surface px-2">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 rounded-lg border border-outline-variant/20 transition-colors ${
                                currentPage === totalPages
                                    ? 'opacity-40 cursor-not-allowed text-on-surface-variant/50'
                                    : 'hover:bg-surface-bright/10 text-on-surface hover:border-outline-variant/40'
                            }`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
