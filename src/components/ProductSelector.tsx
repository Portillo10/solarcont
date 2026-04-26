import React, { useEffect, useState, useMemo } from "react";
import { PackageX, User2, ChevronDown } from "lucide-react";
import SearchInput from "./SearchInput";
import { ProductWithStock } from "../types/product.type";
import { User } from "../types/user.type";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductSelectorProps {
  products: ProductWithStock[];
  users: User[];
  onSelect: (product: ProductWithStock) => void;
  /** Products already selected (shown as disabled/checked) */
  selectedIds?: number[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const StockIndicator: React.FC<{ stock: number }> = ({ stock }) => {
  if (stock <= 0)
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-tight">
        Sin stock
      </span>
    );
  if (stock < 5)
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 uppercase tracking-tight">
        {stock} uds
      </span>
    );
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-tight">
      {stock} uds
    </span>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  users,
  onSelect,
  selectedIds = [],
  loading = false,
}) => {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setUserDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());

      //   console.log(selectedIds);
      const matchesUser =
        !selectedUserId || p.user_id?.toString() === selectedUserId;

      const matchesStock = showOutOfStock || p.stock > 0;

      return (
        matchesSearch && matchesUser && matchesStock
        // &&
        // !selectedIds.includes(p.id)
      );
    });
  }, [products, search, selectedUserId, showOutOfStock]);

  const selectedUser = users.find((u) => u.id.toString() === selectedUserId);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-md shadow-gray-300 overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        {/* Search */}
        <SearchInput onSearch={setSearch} placeholder="Buscar productos..." />

        <div className="flex items-center gap-2">
          {/* User filter dropdown */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUserDropdownOpen((v) => !v);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer bg-white"
            >
              <div className="flex items-center gap-2 text-on-surface-variant">
                <User2 size={14} />
                <span className="text-xs font-medium truncate">
                  {selectedUser ? selectedUser.name : "Todos los usuarios"}
                </span>
              </div>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId("");
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedUserId === ""
                      ? "text-[#005063] font-bold bg-blue-50"
                      : "text-on-surface"
                  }`}
                >
                  Todos los usuarios
                </button>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id.toString());
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedUserId === u.id.toString()
                        ? "text-[#005063] font-bold bg-blue-50"
                        : "text-on-surface"
                    }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Show out-of-stock toggle */}
          <button
            type="button"
            onClick={() => setShowOutOfStock((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              showOutOfStock
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-white border-gray-300 text-gray-500 hover:border-gray-400"
            }`}
          >
            <PackageX size={13} />
            Sin stock
          </button>
        </div>
      </div>

      {/* ── Product list ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="w-5 h-5 border-2 border-[#005063] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant text-sm">
            No se encontraron productos.
          </div>
        ) : (
          <ul>
            {filtered.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => !isOutOfStock && onSelect(product)}
                    disabled={isOutOfStock}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-gray-100",
                      "flex items-center justify-between gap-3 transition-colors",
                      isOutOfStock
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : isSelected
                          ? "bg-blue-50 cursor-pointer hover:bg-blue-100"
                          : "cursor-pointer hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {[product.brand, product.category]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    {/* Right: price + stock */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-[#005063]">
                        {new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        }).format(product.price)}
                      </span>
                      <StockIndicator stock={product.stock} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Footer count ─────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
          {selectedIds.length > 0 && (
            <span className="ml-2 text-[#005063]">
              · {selectedIds.length} seleccionado
              {selectedIds.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ProductSelector;
