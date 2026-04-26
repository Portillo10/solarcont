import React, { useEffect, useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
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
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsOverview,
  getPaginatedTransactions,
} from "../services/transaction.service";
import NewTransactionForm from "../forms/NewTransactionForm";
import {
  CreateTransactionInput,
  Transaction,
  TransactionsOverview,
} from "../types/transaction.type";
import Filters from "../components/Filters";
import { formatNumber, getEndOfDay, getStartOfDay } from "../lib/formatter";
import { User } from "../types/user.type";
import { getUsers } from "../services/user.service";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const StatCards: React.FC<{
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}> = ({ totalIncome, totalExpenses, balance }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
    {/* Total Ingresos */}
    <div className="md:col-span-4 bg-white border border-gray-100 shadow-md shadow-gray-300 rounded-xl py-4 px-6 flex flex-col justify-between">
      <div className="flex justify-between items-end">
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
          Total Ingresos
        </p>
        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
          <TrendingUp size={20} />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-green-700">
        {formatNumber(totalIncome)}
      </h2>
      <p className="text-[10px] text-gray-400 mt-3 uppercase font-semibold">
        Últimos 30 días
      </p>
    </div>

    {/* Total Salidas */}
    <div className="md:col-span-4 bg-white border border-gray-100 shadow-md shadow-gray-300 rounded-xl py-4 px-6 flex flex-col justify-between">
      <div className="flex items-end justify-between">
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
          Total Salidas
        </p>
        <div className="p-2 bg-red-100 text-red-700 rounded-lg">
          <TrendingDown size={20} />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-red-700">
        {formatNumber(totalExpenses)}
      </h2>
      <p className="text-[10px] text-gray-400 mt-3 uppercase font-semibold">
        Últimos 30 días
      </p>
    </div>

    {/* Balance General */}
    <div className="md:col-span-4 bg-[#005063] rounded-xl py-4 px-6 flex flex-col justify-between shadow-md shadow-gray-300">
      <div className="flex items-end justify-between">
        <p className="text-xs uppercase tracking-wider font-semibold text-blue-200 mb-1">
          Balance General
        </p>
        <div className="p-2 bg-white/10 text-white rounded-lg">
          <Wallet size={20} />
        </div>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-white">
        {formatNumber(balance)}
      </h2>
      <p className="text-[10px] text-blue-300 mt-3 uppercase font-semibold">
        Fondos consolidados
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Transaction type badge
// ---------------------------------------------------------------------------
// const TypeBadge: React.FC<{ type: TransactionSource }> = ({ type }) => {
//   if (type === "payment") {
//     return (
//       <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
//         Ingreso
//       </span>
//     );
//   }
//   return (
//     <span className="bg-red-100 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">
//       Salida
//     </span>
//   );
// };

// ---------------------------------------------------------------------------
// Transaction table
// ---------------------------------------------------------------------------
interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onSearch: (query: string) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onSearch,
}) => (
  <div className="overflow-x-auto bg-white shadow-md shadow-gray-300 rounded-lg border border-gray-200">
    <div className="flex items-center justify-center w-full p-3 gap-3">
      <SearchInput
        onSearch={onSearch}
        placeholder="Buscar por descripción..."
      />
    </div>
    {transactions.length === 0 ? (
      <div className="p-10 text-center text-on-surface-variant">
        No se encontraron coincidencias.
      </div>
    ) : (
      <table className="w-full border-spacing-y-2">
        <thead className="bg-[#dae6ec]">
          <tr className="text-left text-sm uppercase tracking-widest font-bold text-on-surface-variant">
            <th className="py-3 pl-4">Descripción</th>
            <th>Fecha</th>
            <th className="text-right">Monto</th>
            {/* <th className="text-center">Tipo</th> */}
            <th className="text-right pr-4">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-md">
          {transactions.map((tx, index) => (
            <tr
              key={index}
              className="transition-all border-t hover:bg-gray-50 border-gray-300"
            >
              <td className="py-3 pl-4 font-semibold text-on-surface">
                {tx.description}
              </td>
              <td className="py-2 text-sm text-on-surface-variant">
                {new Date(tx.date).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </td>
              <td
                className={[
                  "py-2 text-right font-bold text-on-surface pr-2",
                  tx.source == "expense" ? "text-red-700" : "text-green-700",
                ].join(" ")}
              >
                {(tx.source == "expense" ? "" : "+") + formatNumber(tx.amount)}
              </td>
              {/* <td className="py-2 text-center">
                <TypeBadge type={tx.source} />
              </td> */}
              <td className="py-2 text-right pr-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(tx)}
                    className="p-2 text-on-surface-variant rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    aria-label="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(tx)}
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const TransactionsPage: React.FC = () => {
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

  const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const now = new Date().toISOString().split("T")[0];
  const { user } = useUser();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [overview, setOverview] = useState<TransactionsOverview | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<
    Partial<Transaction>
  >({});
  const [dateFilter, setDateFilter] = useState<{
    dateFrom: string | null;
    dateTo: string | null;
  }>({ dateFrom: null, dateTo: null });
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const modal = useModal();
  const deleteModal = useModal();
  const filtersModal = useModal();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchTransactions();
    fetchOverview();
  }, [user, dateFilter]);

  function getItemsPerPage() {
    const windowHeight = window.innerHeight;
    if (windowHeight < 700) return 1;
    const availableHeight = windowHeight - 560;
    const rowHeight = 57;
    return Math.floor(availableHeight / rowHeight);
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction || null);
    modal.onOpen();
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    deleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete.id || !transactionToDelete.source) return;
    await deleteTransaction(transactionToDelete.id, transactionToDelete.source);
    await fetchTransactions();
    await fetchOverview();
    setTransactionToDelete({});
    deleteModal.onClose();
  };

  const handleSaveTransaction = async (form: CreateTransactionInput) => {
    if (!form.description || !form.amount || isNaN(Number(form.amount))) {
      alert(
        "Por favor completa todos los campos requeridos con valores válidos.",
      );
      return;
    }

    if (editingTransaction) {
      await updateTransaction(
        editingTransaction.id,
        editingTransaction.source,
        form,
      );
    } else {
      await createTransaction(form);
    }

    modal.onClose();
    setEditingTransaction(null);
    await fetchTransactions();
    await fetchOverview();
  };

  const handleSearch = async (query: string) => {
    await fetchTransactions(query);
    await fetchOverview(query);
  };

  const fetchOverview = async (_search?: string) => {
    try {
      const dateFrom = dateFilter.dateFrom
        ? getStartOfDay(dateFilter.dateFrom)
        : undefined;
      const dateTo = dateFilter.dateTo
        ? getEndOfDay(dateFilter.dateTo)
        : undefined;

      const result = await getTransactionsOverview(user?.id, dateFrom, dateTo);
      setOverview(result);
    } catch (error) {
      console.log("Error cargando resumen de transacciones", error);
    }
  };

  const fetchTransactions = async (search?: string) => {
    try {
      const totalItemsPerPage = getItemsPerPage();
      setItemsPerPage(totalItemsPerPage);
      const { data, total } = await getPaginatedTransactions({
        page: currentPage,
        pageSize: totalItemsPerPage,
        user_id: user?.id,
        search,
        dateFrom: dateFilter.dateFrom
          ? getStartOfDay(dateFilter.dateFrom)
          : undefined,
        dateTo: dateFilter.dateTo ? getEndOfDay(dateFilter.dateTo) : undefined,
      });
      setTransactions(data);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / totalItemsPerPage));
    } catch (error) {
      console.log("Error cargando transacciones", error);
    }
  };

  const fetchUsers = async () => {
    const users = await getUsers();
    setActiveUsers(users);
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
                dateFrom: dateFilter.dateFrom || undefined,
                dateTo: dateFilter.dateTo || undefined,
              }}
              onApply={(filters) => {
                const { dateFrom, dateTo } = filters;
                setDateFilter({ dateFrom, dateTo });
                filtersModal.onClose();
              }}
              onChange={() => {}}
            />
          </Modal>

          <button
            onClick={() => {
              setEditingTransaction(null);
              modal.onOpen();
            }}
            className="px-6 py-3 bg-[#005063] text-white font-semibold rounded-md shadow-lg shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-sm">Registrar movimiento</span>
          </button>

          <Modal
            size="xl"
            onClose={() => {
              modal.onClose();
              setEditingTransaction(null);
            }}
            open={modal.open}
          >
            <NewTransactionForm
              title={
                editingTransaction
                  ? "Editar Movimiento"
                  : "Registrar Movimiento"
              }
              activeUsers={activeUsers}
              initialValues={{
                description: editingTransaction?.description || "",
                amount:
                  Math.abs(editingTransaction?.amount || 0).toString() || "",
                source: editingTransaction?.source || "expense",
                date: editingTransaction?.date || new Date().toISOString(),
                user_id:
                  editingTransaction?.user_id?.toString() ||
                  user?.id.toString() ||
                  activeUsers[0]?.id.toString(),
              }}
              onSave={handleSaveTransaction}
              onCancel={() => {
                modal.onClose();
                setEditingTransaction(null);
              }}
            />
          </Modal>
        </div>
      </header>

      {/* Stats */}
      <StatCards
        totalIncome={overview?.income || 0}
        totalExpenses={overview?.expenses || 0}
        balance={overview?.balance || 0}
      />

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-xl">
        <TransactionTable
          transactions={transactions}
          onSearch={handleSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Delete confirmation modal */}
        <Modal onClose={deleteModal.onClose} open={deleteModal.open}>
          <div className="p-2">
            <h2 className="text-xl font-bold text-on-surface mb-4">
              Confirmar eliminación
            </h2>
            <p className="text-on-surface-variant mb-6 text-base">
              ¿Estás seguro de que deseas eliminar este movimiento? Esta acción
              no se puede deshacer.
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
          label="movimientos"
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

export default TransactionsPage;
