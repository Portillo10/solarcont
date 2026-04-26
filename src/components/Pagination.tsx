import {
  ChevronLeft,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  perPage: number;
  label?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
  label = "items",
}) => {
  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, totalItems);

  const visiblePages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + currentPage - (currentPage == 1 ? 0 : 1),
  );

  return (
    <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/15 pt-8 gap-4">
      <p className="text-sm text-on-surface-variant font-medium">
        Mostrando {from}–{to} de {totalItems.toLocaleString()} {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${currentPage === 1 ? "" : "cursor-pointer hover:bg-gray-200"}`}
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${currentPage === 1 ? "" : "cursor-pointer hover:bg-gray-200"}`}
        >
          <ChevronLeft size={18} />
        </button>

        {currentPage > 2 && (
          <span className="px-2 text-on-surface-variant">...</span>
        )}

        {visiblePages.map(
          (page, index) =>
            page <= totalPages && (
              <button
                key={index}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-colors
              ${
                currentPage === page
                  ? "bg-primary text-green-500"
                  : "hover:bg-gray-200 cursor-pointer text-on-surface"
              }`}
              >
                {page}
              </button>
            ),
        )}

        {totalPages > (currentPage == 1 ? 3 : currentPage + 1) && (
          <span className="px-2 text-on-surface-variant">...</span>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 ${currentPage === totalPages ? "" : "cursor-pointer hover:bg-gray-200"}`}
        >
          <ChevronRightIcon size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30 ${currentPage === totalPages ? "" : "cursor-pointer hover:bg-gray-200"}`}
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
