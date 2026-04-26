import React, { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SaleStatus } from "../types/sale.type";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Filters {
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  status?: SaleStatus;
}

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FiltersProps {
  onChange: (filters: Filters) => void;
  onClear?: () => void;
  onApply?: (filters: Filters) => void;
  /** Optional initial values */
  initialValues?: Partial<Filters>;
  filterType?: "transaction" | "sale";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({
  htmlFor,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5"
  >
    {children}
  </label>
);

const hasActiveFilters = (f: Filters) => Object.values(f).some((v) => v !== "");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Filters: React.FC<FiltersProps> = ({
  onChange,
  onClear,
  onApply,
  initialValues,
  filterType = "transaction",
}) => {
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    ...initialValues,
  });

  const [errors, setErrors] = useState<{ date?: string; amount?: string }>({});

  useEffect(() => {
    validate(filters);
  }, [filters]);

  const validate = (f: Filters) => {
    const next: typeof errors = {};
    if (f.dateFrom && f.dateTo && f.dateFrom > f.dateTo) {
      next.date = "La fecha inicial no puede ser posterior a la final.";
    }
    if (
      f.amountMin !== "" &&
      f.amountMax !== "" &&
      Number(f.amountMin) > Number(f.amountMax)
    ) {
      next.amount = "El monto mínimo no puede ser mayor al máximo.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const set =
    (field: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...filters, [field]: e.target.value };
      setFilters(next);
      if (validate(next)) {
        onChange(next);
      }
    };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setErrors({});
    // onChange(EMPTY_FILTERS);
    onClear?.();
  };

  const active = hasActiveFilters(filters);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md shadow-gray-300 px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-on-surface">
          <SlidersHorizontal size={16} className="text-[#005063]" />
          <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            Filtros
          </span>
          {/* {active && (
            <span className="text-[10px] font-bold bg-[#005063] text-white px-2 py-0.5 rounded-full">
              Activo
            </span>
          )} */}
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-x-6 gap-y-4">
        {/* Date from */}
        <div>
          <FieldLabel htmlFor="filter-date-from">Fecha desde</FieldLabel>
          <input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={set("dateFrom")}
            max={filters.dateTo || undefined}
            className={[
              "w-full border rounded-lg py-2 px-3 text-sm text-on-surface outline-none transition-shadow",
              "focus:ring-1 focus:ring-[#005063]",
              errors.date ? "border-red-500" : "border-gray-400",
            ].join(" ")}
          />
        </div>

        {/* Date to */}
        <div>
          <FieldLabel htmlFor="filter-date-to">Fecha hasta</FieldLabel>
          <input
            id="filter-date-to"
            type="date"
            value={filters.dateTo}
            onChange={set("dateTo")}
            min={filters.dateFrom || undefined}
            className={[
              "w-full border rounded-lg py-2 px-3 text-sm text-on-surface outline-none transition-shadow",
              "focus:ring-1 focus:ring-[#005063]",
              errors.date ? "border-red-500" : "border-gray-400",
            ].join(" ")}
          />
        </div>

        {/* Amount min */}
        <div>
          <FieldLabel htmlFor="filter-amount-min">Monto mínimo</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
              $
            </span>
            <input
              id="filter-amount-min"
              type="number"
              min="0"
              step="1000"
              value={filters.amountMin}
              onChange={set("amountMin")}
              placeholder="0"
              className={[
                "w-full border rounded-lg py-2 pl-7 pr-3 text-sm text-on-surface outline-none transition-shadow",
                "focus:ring-1 focus:ring-[#005063] placeholder:text-slate-400",
                errors.amount ? "border-red-500" : "border-gray-400",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Amount max */}
        <div>
          <FieldLabel htmlFor="filter-amount-max">Monto máximo</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
              $
            </span>
            <input
              id="filter-amount-max"
              type="number"
              min="0"
              step="1000"
              value={filters.amountMax}
              onChange={set("amountMax")}
              placeholder="Sin límite"
              className={[
                "w-full border rounded-lg py-2 pl-7 pr-3 text-sm text-on-surface outline-none transition-shadow",
                "focus:ring-1 focus:ring-[#005063] placeholder:text-slate-400",
                errors.amount ? "border-red-500" : "border-gray-400",
              ].join(" ")}
            />
          </div>
        </div>
      </div>
      {filterType == "sale" && (
        <div className="pt-4 flex flex-col gap-2">
          <label
            className="block text-xs font-bold uppercase tracking-wider"
            htmlFor="filter-status"
          >
            Estado:
          </label>
          <div className="flex gap-3">
            {(
              [
                { value: "PAID", label: "Pagado" },
                { value: "PENDING", label: "Pendiente" },
                { value: undefined, label: "Cualquiera" },
              ] as {
                value: SaleStatus | undefined;
                label: string;
              }[]
            ).map(({ value, label }, index) => {
              const isSelected = filters.status === value;
              const selectedStyle =
                value === "PAID"
                  ? "bg-green-100 border-green-600 text-green-800"
                  : value === "PENDING"
                    ? "bg-orange-100 border-orange-600 text-orange-800"
                    : "bg-gray-100 border-gray-600 text-gray-800";
              return (
                <button
                  key={index}
                  className={[
                    "flex-1 py-2 px-4 rounded-lg border-2 font-bold text-sm transition-all cursor-pointer",
                    isSelected
                      ? selectedStyle
                      : "border-gray-300 text-gray-500 hover:border-gray-400",
                  ].join(" ")}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="w-full flex justify-end mt-6 gap-3">
        <button
          onClick={handleClear}
          disabled={!active}
          className="w-full md:w-auto cursor-pointer px-12 py-3 rounded-md font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-60 disabled:shadow-none disabled:cursor-default disabled:hover:bg-white flex items-center gap-2 justify-center"
        >
          Limpiar fitros
        </button>
        <button
          onClick={() => {
            onApply?.(filters);
          }}
          className="w-full md:w-auto cursor-pointer px-12 py-3 bg-[#005165] text-white rounded-md font-bold text-sm shadow-xl shadow-primary/20 hover:bg-[#176071] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
        >
          Aplicar filtros
        </button>
      </div>

      {/* Validation errors */}
      {(errors.date || errors.amount) && (
        <div className="mt-3 flex flex-col gap-1">
          {errors.date && (
            <p className="text-xs text-red-600 font-medium">{errors.date}</p>
          )}
          {errors.amount && (
            <p className="text-xs text-red-600 font-medium">{errors.amount}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Filters;
