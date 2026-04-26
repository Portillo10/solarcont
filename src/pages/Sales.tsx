import React, { useEffect, useState } from "react";
import {
  Plus,
  TrendingUp,
  Receipt,
  Clock,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";
import { useModal } from "../hooks/useModal";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import { useUser } from "../hooks/useUser";
import {
  createSale,
  updateSale,
  deleteSale,
  CreateSaleInput,
  UpdateSaleInput,
  getSalesOverview,
  SalesOverview,
  getPaginatedSales,
} from "../services/sale.service";
import { SaleWithRelations, SaleStatus } from "../types/sale.type";
import { formatNumber } from "../lib/formatter";
import { User } from "../types/user.type";
import { getUsers } from "../services/user.service";
import NewSaleForm from "../forms/NewSaleForm";
import Filters from "../components/Filters";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getItemsPerPage() {
  const windowHeight = window.innerHeight;
  if (windowHeight < 700) return 1;
  const availableHeight = windowHeight - 560;
  const rowHeight = 72;
  return Math.floor(availableHeight / rowHeight);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const StatusBadge: React.FC<{ status: SaleStatus }> = ({ status }) => {
  const config: Record<SaleStatus, { label: string; className: string }> = {
    PAID: {
      label: "Pagado",
      className: "bg-green-100 text-green-800",
    },
    PENDING: {
      label: "Pendiente",
      className: "bg-yellow-100 text-yellow-800",
    },
    CANCELLED: {
      label: "Cancelado",
      className: "bg-red-100 text-red-700",
    },
  };

  const { label, className } = config[status] ?? config.PENDING;

  return (
    <span
      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${className}`}
    >
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------
const StatCards: React.FC<{
  totalRevenue: number;
  count: number;
  pendingCount: number;
}> = ({ totalRevenue, count, pendingCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
    {/* Revenue */}
    <div className="md:col-span-6 bg-white border border-gray-100 shadow-md shadow-gray-300 rounded-xl py-4 px-6 flex flex-col justify-between">
      <div className="flex justify-between items-end">
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
          Ingresos totales
        </p>
        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
          <TrendingUp size={20} />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-green-700">
        {formatNumber(totalRevenue)}
      </h2>
      <p className="text-[10px] text-gray-400 mt-3 uppercase font-semibold">
        Basado en el valor de las ventas
      </p>
    </div>

    {/* Total transactions */}
    <div className="md:col-span-3 bg-white border border-gray-100 shadow-md shadow-gray-300 rounded-xl py-4 px-6 flex flex-col justify-between">
      <div className="flex justify-between items-end">
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
          Ventas registradas
        </p>
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
          <Receipt size={20} />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-[#005063]">
        {count}
      </h2>
      <p className="text-[10px] text-gray-400 mt-3 uppercase font-semibold">
        Últimos 30 días
      </p>
    </div>

    {/* Pending */}
    <div className="md:col-span-3 bg-yellow-50 border border-yellow-100 shadow-md shadow-gray-300 rounded-xl py-4 px-6 flex flex-col justify-between">
      <div className="flex justify-between items-end">
        <p className="text-xs uppercase tracking-wider font-semibold text-yellow-700 mb-1">
          Pendientes de pago
        </p>
        <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
          <Clock size={20} />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-yellow-700">
        {pendingCount}
      </h2>
      <p className="text-[10px] text-yellow-500 mt-3 uppercase font-semibold">
        Requieren seguimiento
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Sales table
// ---------------------------------------------------------------------------
interface SalesTableProps {
  sales: SaleWithRelations[];
  onEdit: (sale: SaleWithRelations) => void;
  onDelete: (sale: SaleWithRelations) => void;
  onSearch: (query: string) => void;
}

const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  onEdit,
  onDelete,
  onSearch,
}) => (
  <div className="overflow-x-auto bg-white shadow-md shadow-gray-300 rounded-lg border border-gray-200">
    <div className="flex items-center justify-center w-full p-3 gap-3">
      <SearchInput onSearch={onSearch} placeholder="Buscar ventas..." />
    </div>
    {sales.length === 0 ? (
      <div className="p-10 text-center text-on-surface-variant">
        No se encontraron coincidencias.
      </div>
    ) : (
      <table className="w-full border-spacing-y-2">
        <thead className="bg-[#dae6ec]">
          <tr className="text-left text-sm uppercase tracking-widest font-bold text-on-surface-variant">
            <th className="py-3 pl-4">Cliente</th>
            <th>Productos</th>
            <th>Fecha</th>
            <th className="text-right">Total</th>
            <th className="text-center">Estado</th>
            <th className="text-right pr-4">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-md">
          {sales.map(({ sale, items, payments }) => (
            <tr
              key={sale.id}
              className="transition-all border-t hover:bg-gray-50 border-gray-300"
            >
              {/* Cliente */}
              <td className="py-3 pl-4">
                <p className="font-semibold text-on-surface text-sm">
                  {sale?.customer_id
                    ? `Cliente #${sale?.customer_id}`
                    : "Sin cliente"}
                </p>
                <p className="text-xs text-gray-400">
                  {payments[0]?.method ?? "Sin método de pago"}
                </p>
              </td>

              {/* Items */}
              <td className="py-2">
                <p className="text-sm text-on-surface font-medium">
                  {items.length === 1
                    ? `${items[0].quantity}x producto`
                    : `${items.length} productos`}
                </p>
                <p className="text-xs text-gray-400">
                  {items
                    .slice(0, 2)
                    .map((i) => `#${i.product_id}`)
                    .join(", ")}
                  {items.length > 2 ? ` +${items.length - 2}` : ""}
                </p>
              </td>

              {/* Fecha */}
              <td className="py-2 text-sm text-on-surface-variant">
                {new Date(sale.sold_at).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </td>

              {/* Total */}
              <td className="py-2 text-right font-bold text-on-surface pr-2">
                {formatNumber(sale.total)}
              </td>

              {/* Estado */}
              <td className="py-2 text-center">
                <StatusBadge status={sale.status} />
              </td>

              {/* Acciones */}
              <td className="py-2 text-right pr-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit({ sale, items, payments })}
                    className="p-2 text-on-surface-variant rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    aria-label="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete({ sale, items, payments })}
                    className="p-2 text-on-surface-variant hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="text-red-700" size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

type SalesFilter = {
  dateTo: string | null;
  dateFrom: string | null;
  status?: string;
};
// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const SalesPage: React.FC = () => {
  const {
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    setTotalItems,
    setTotalPages,
    setCurrentPage,
    setItemsPerPage,
  } = usePagination();

  // const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  //   .toISOString()
  //   .split("T")[0];
  // const now = new Date().toISOString().split("T")[0];

  const { user } = useUser();

  const [sales, setSales] = useState<SaleWithRelations[]>([]);
  const [editingSale, setEditingSale] = useState<SaleWithRelations | null>(
    null,
  );
  const [saleToDelete, setSaleToDelete] = useState<SaleWithRelations | null>(
    null,
  );
  const [overview, setOverview] = useState<SalesOverview>({
    total_sales: 0,
    total_amount: 0,
    total_paid: 0,
    total_pending: 0,
    pending_count: 0,
  });
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [salesFilter, setSalesFilter] = useState<SalesFilter>({
    dateFrom: null,
    dateTo: null,
  });

  const modal = useModal();
  const deleteModal = useModal();
  const filtersModal = useModal();

  useEffect(() => {
    fetchUsers();
    // fetchProducts();
  }, []);
  useEffect(() => {
    fetchSales();
  }, [currentPage]);
  useEffect(() => {
    fetchSalesOverview();
    fetchSales();
  }, [salesFilter]);
  useEffect(() => {
    setCurrentPage(1);
    fetchSales();
    fetchSalesOverview();
  }, [user]);

  const fetchUsers = async () => {
    const users = await getUsers();
    setActiveUsers(users);
  };

  const fetchSalesOverview = async (search?: string) => {
    const overview = await getSalesOverview(
      user?.id,
      salesFilter.dateFrom || undefined,
      salesFilter.dateTo || undefined,
    );

    setOverview(overview);
  };

  const fetchSales = async (search?: string) => {
    try {
      const totalItemsPerPage = getItemsPerPage();
      setItemsPerPage(totalItemsPerPage);

      const { data, total } = await getPaginatedSales({
        pageSize: totalItemsPerPage,
        page: currentPage,
        user_id: user?.id,
        search,
      });

      setSales(data);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / totalItemsPerPage));
    } catch (error) {
      console.log("Error cargando ventas", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchSales(query);
    fetchSalesOverview(query);
  };

  const handleEdit = (sale: SaleWithRelations) => {
    setEditingSale(sale);
    modal.onOpen();
  };

  const handleDelete = (sale: SaleWithRelations) => {
    setSaleToDelete(sale);
    deleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    await deleteSale(saleToDelete.sale.id);
    await fetchSales(searchQuery);
    await fetchSalesOverview();
    setSaleToDelete(null);
    deleteModal.onClose();
  };

  const handleSaveSale = async (input: CreateSaleInput) => {
    if (!input.items.length) {
      alert("Agrega al menos un producto a la venta.");
      return;
    }

    if (editingSale) {
      const updateInput: UpdateSaleInput = {
        total: input.total,
        status: input.status,
        sold_at: input.sold_at,
        user_id: input.user_id,
        customer_id: input?.customer_document,
        items: input.items,
      };
      await updateSale(editingSale.sale.id, updateInput);
    } else {
      await createSale(input);
    }

    modal.onClose();
    setEditingSale(null);
    await fetchSales(searchQuery);
    await fetchSalesOverview(searchQuery);
  };

  return (
    <div>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-end gap-6 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={filtersModal.onOpen}
            className="px-6 py-3 font-semibold rounded-md flex items-center gap-2 hover:bg-gray-200 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer outline-none"
          >
            <Filter size={18} />
            <span className="text-sm">Filtros</span>
          </button>

          <Modal
            size="lg"
            onClose={filtersModal.onClose}
            open={filtersModal.open}
          >
            <Filters
              initialValues={{
                dateFrom: salesFilter.dateFrom || undefined,
                dateTo: salesFilter.dateTo || undefined,
              }}
              onChange={() => {}}
              onApply={(filters) => {
                setSalesFilter(filters);
                filtersModal.onClose();
              }}
              filterType="sale"
            />
          </Modal>
          <button
            onClick={() => {
              setEditingSale(null);
              modal.onOpen();
            }}
            className="px-6 py-3 bg-[#005063] text-white font-semibold rounded-md shadow-lg shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-sm">Nueva venta</span>
          </button>

          <Modal
            size="xxl"
            onClose={() => {
              modal.onClose();
              setEditingSale(null);
            }}
            open={modal.open}
          >
            <NewSaleForm
              title={editingSale ? "Editar Venta" : "Registrar Venta"}
              activeUsers={activeUsers}
              initialValues={{
                total: editingSale?.sale.total.toString(),
                status: editingSale?.sale.status,
                sold_at:
                  editingSale?.sale.sold_at.slice(0, 10) ??
                  new Date().toISOString().slice(0, 10),
                user_id:
                  editingSale?.sale.user_id?.toString() ?? user?.id.toString(),
                customer_id: editingSale?.sale?.customer_id?.toString() ?? "",
                items: editingSale?.items.map((i) => ({
                  id: i.id,
                  sale_id: i.sale_id,
                  product_id: i.product_id,
                  quantity: i.quantity,
                  unit_price: i.unit_price,
                  purchase_price: i.purchase_price,
                })),
                payment: {
                  amount: editingSale?.payments[0]?.amount.toString() ?? "",
                  method: editingSale?.payments[0]?.method ?? "",
                },
              }}
              onSave={handleSaveSale}
              onCancel={() => {
                modal.onClose();
                setEditingSale(null);
              }}
            />
          </Modal>
        </div>
      </header>

      {/* Stats */}
      <StatCards
        totalRevenue={overview.total_amount}
        count={overview.total_sales}
        pendingCount={overview.pending_count}
      />

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-xl">
        <SalesTable
          sales={sales}
          onSearch={handleSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Delete modal */}
        <Modal onClose={deleteModal.onClose} open={deleteModal.open}>
          <div className="p-2">
            <h2 className="text-xl font-bold text-on-surface mb-4">
              Confirmar eliminación
            </h2>
            <p className="text-on-surface-variant mb-6 text-base">
              ¿Estás seguro de que deseas eliminar esta venta? Esta acción
              revertirá los movimientos de inventario asociados y no se puede
              deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={deleteModal.onClose}
                className="cursor-pointer px-4 py-2 bg-surface-container text-on-surface rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="cursor-pointer px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>

        <Pagination
          label="ventas"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          perPage={itemsPerPage}
        />
      </section>
    </div>
  );
};

export default SalesPage;
