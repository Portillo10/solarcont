import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ShoppingCart, CreditCard } from "lucide-react";
import { SaleStatus } from "../types/sale.type";
import { CreateSaleInput } from "../services/sale.service";
import { User } from "../types/user.type";
import { ProductWithStock } from "../types/product.type";
import { getProductsWithStock } from "../services/product.service";
import { SaleItem } from "../types/sale_item.type";
import Modal from "@/components/Modal";
import { useModal } from "@/hooks/useModal";
import ProductSelector from "@/components/ProductSelector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SaleItemForm = Omit<SaleItem, "product_id" | "id"> & {
  product_id: number | null;
  id?: number;
};
export interface SaleFormValues {
  total: string;
  status: SaleStatus;
  sold_at: string;
  user_id: string;
  customer_id: string;
  customer_name: string;
  items: SaleItemForm[];
  payment: {
    amount: string;
    method: string;
  };
}

const PAYMENT_METHODS = [
  "Efectivo",
  "Transferencia",
  "Tarjeta de crédito",
  "Tarjeta de débito",
  "Cheque",
];

const EMPTY_ITEM: SaleItem = {
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  id: 0,
  sale_id: 0,
  purchase_price: 0,
};

const INITIAL_FORM: SaleFormValues = {
  customer_name: "",
  total: "0",
  status: "PENDING",
  sold_at: new Date().toISOString().slice(0, 10),
  user_id: "",
  customer_id: "",
  items: [{ ...EMPTY_ITEM }],
  payment: { amount: "", method: "Efectivo" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({
  htmlFor,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider"
  >
    {children}
  </label>
);

const inputClass = [
  "w-full border border-gray-400 rounded-lg py-2 px-3",
  "focus:ring-1 focus:ring-[#005063] text-on-surface placeholder:text-slate-400",
  "transition-shadow outline-none text-sm",
].join(" ");

const selectClass = [
  "w-full border border-gray-400 rounded-lg py-2 px-3",
  "focus:ring-1 focus:ring-[#005063] text-on-surface",
  "appearance-none outline-none transition-shadow text-sm",
].join(" ");

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NewSaleFormProps {
  onSave?: (data: CreateSaleInput) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<SaleFormValues>;
  loading?: boolean;
  activeUsers: User[];
  title?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const NewSaleForm: React.FC<NewSaleFormProps> = ({
  onSave,
  onCancel,
  initialValues,
  loading = false,
  activeUsers,
  title = "Registrar Venta",
}) => {
  const initialValuesForm = {
    ...INITIAL_FORM,
    ...initialValues,
    items: initialValues?.items?.length
      ? initialValues.items
      : [{ ...EMPTY_ITEM }],
    payment: {
      method: initialValues?.payment?.method || INITIAL_FORM.payment.method,
      amount: initialValues?.payment?.amount || INITIAL_FORM.payment.amount,
    },
  };
  const [form, setForm] = useState<SaleFormValues>(initialValuesForm);

  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  const productsModal = useModal();

  useEffect(() => {
    loadProducts();
  }, []);

  const mappedProducts = useMemo(() => {
    return Object.fromEntries(products.map((p) => [p.id, p])) as Record<
      number,
      ProductWithStock
    >;
  }, [products]);

  // Recalculate total whenever items change
  useEffect(() => {
    const computed = form.items.reduce((acc, item) => {
      const qty = item.quantity || 0;
      const price = item.unit_price || 0;
      return acc + qty * price;
    }, 0);
    setForm((prev) => ({
      ...prev,
      total: computed.toFixed(0),
      payment: { ...prev.payment, amount: computed.toFixed(0) },
    }));
  }, [form.items]);

  const loadProducts = async () => {
    try {
      const data = await getProductsWithStock();
      setProducts(data);
    } catch {
      console.log("Error cargando productos");
    }
  };

  // -------------------------------------------------------------------------
  // Item handlers
  // -------------------------------------------------------------------------
  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i != index),
    }));
  };

  const setItem = (index: number, field: keyof SaleItem, value: number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // Auto-fill unit_price when product is selected
      if (field === "product_id") {
        const product = products.find((p) => p.id === value);
        if (product) {
          items[index].unit_price = product.price;
        }
      }

      return { ...prev, items };
    });

    // Clear item error
    const key = `item_${index}_${field}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // -------------------------------------------------------------------------
  // Top-level field setter
  // -------------------------------------------------------------------------
  const set =
    (field: keyof Omit<SaleFormValues, "items" | "payment">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const setPayment =
    (field: "amount" | "method") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({
        ...prev,
        payment: { ...prev.payment, [field]: e.target.value },
      }));
    };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.sold_at) next.sold_at = "La fecha es obligatoria.";
    if (!form.items.length) next.items = "Agrega al menos un producto.";

    form.items.forEach((item, i) => {
      if (!item.product_id)
        next[`item_${i}_product_id`] = "Selecciona un producto.";
      if (!item.quantity || Number(item.quantity) <= 0)
        next[`item_${i}_quantity`] = "Cantidad inválida.";
      if (!item.unit_price || Number(item.unit_price) <= 0)
        next[`item_${i}_unit_price`] = "Precio inválido.";
    });

    if (!form.payment.method) next.payment_method = "Selecciona un método.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateSaleInput = {
      total: parseFloat(form.total),
      status: form.status,
      sold_at: form.sold_at,
      user_id: form.user_id ? parseInt(form.user_id) : null,
      customer_document: form.customer_id ? parseInt(form.customer_id) : null,
      items: form.items
        .filter((item) => !!item.product_id)
        .map((item) => ({
          id: item.id,
          product_id: item.product_id!,
          quantity: item.quantity,
          unit_price: item.unit_price,
          purchase_price: item.purchase_price,
        })),
      payment: {
        amount: parseFloat(form.payment.amount || form.total),
        method: form.payment.method,
        type: "SALE",
      },
    };

    await onSave?.(payload);
  };

  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------
  const totalFormatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(parseFloat(form.total) || 0);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-6 py-3">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline">
          {title}
        </h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* ── General info ─────────────────────────────────────── */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Fecha */}
            <div>
              <FieldLabel htmlFor="sale-date">Fecha de venta</FieldLabel>
              <input
                id="sale-date"
                type="date"
                value={form.sold_at}
                onChange={set("sold_at")}
                className={inputClass}
              />
              {errors.sold_at && (
                <p className="mt-1 text-xs text-red-600">{errors.sold_at}</p>
              )}
            </div>

            {/* Propietario */}
            <div>
              <FieldLabel htmlFor="sale-user">Vendedor</FieldLabel>
              <select
                id="sale-user"
                value={form.user_id}
                onChange={set("user_id")}
                className={selectClass}
              >
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel htmlFor="sale-customer-id">
                Cedula del cliente
              </FieldLabel>
              <input
                id="sale-customer-id"
                type="text"
                value={form.customer_id}
                placeholder="Cedula (opcional)"
                onChange={set("customer_id")}
                className={inputClass}
              />
              {errors.sold_at && (
                <p className="mt-1 text-xs text-red-600">{errors.sold_at}</p>
              )}
            </div>

            {/* Propietario */}
            <div>
              <FieldLabel htmlFor="sale-customer">
                Nombre del cliente
              </FieldLabel>
              <input
                id="sale-customer"
                value={form.customer_name}
                onChange={set("customer_name")}
                className={inputClass}
                placeholder="Nombre (opcional)"
              />
            </div>
          </div>
        </section>

        {/* ── Items ────────────────────────────────────────────── */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-gray-300">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-[#005063]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Productos
            </h2>
          </div>

          {errors.items && (
            <p className="mb-3 text-xs text-red-600">{errors.items}</p>
          )}

          <div className="space-y-3">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-1">
              <span className="col-span-6 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Producto
              </span>
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Cantidad
              </span>
              <span className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Precio unitario
              </span>
              <span className="col-span-1" />
            </div>

            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-start">
                {/* Producto */}
                <div className="col-span-12 md:col-span-6">
                  <input
                    value={mappedProducts[item.product_id || 0]?.name || ""}
                    placeholder="Click para seleccionar producto"
                    onClick={() => {
                      setSelectedItemIndex(i);
                      productsModal.onOpen();
                    }}
                    readOnly
                    type="text"
                    className={[inputClass, "cursor-pointer "].join(" ")}
                  />
                  {errors[`item_${i}_product_id`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`item_${i}_product_id`]}
                    </p>
                  )}
                </div>

                {/* Cantidad */}
                <div className="col-span-5 md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      setItem(i, "quantity", parseInt(e.target.value))
                    }
                    placeholder="1"
                    className={[
                      inputClass,
                      errors[`item_${i}_quantity`] ? "border-red-500" : "",
                    ].join(" ")}
                  />
                  {errors[`item_${i}_quantity`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`item_${i}_quantity`]}
                    </p>
                  )}
                </div>

                {/* Precio unitario */}
                <div className="col-span-5 md:col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.unit_price}
                      onChange={(e) =>
                        setItem(i, "unit_price", parseInt(e.target.value))
                      }
                      placeholder="0"
                      className={[
                        inputClass,
                        "pl-6",
                        errors[`item_${i}_unit_price`] ? "border-red-500" : "",
                      ].join(" ")}
                    />
                  </div>
                  {errors[`item_${i}_unit_price`] && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors[`item_${i}_unit_price`]}
                    </p>
                  )}
                </div>

                {/* Remove */}
                <div className="col-span-2 md:col-span-1 flex items-center justify-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={form.items.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <Modal onClose={productsModal.onClose} open={productsModal.open}>
              <ProductSelector
                onSelect={(data) => {
                  const itemIsSelected = form.items.find(
                    (item) => item.product_id == data.id,
                  );
                  if (itemIsSelected) return;
                  setItem(selectedItemIndex, "product_id", data.id);
                  productsModal.onClose();
                }}
                selectedIds={form.items
                  .filter((item) => item.product_id != null)
                  .map((item) => parseInt(item.product_id!.toString()))}
                products={products}
                users={activeUsers}
              />
            </Modal>
          </div>

          {/* Add item + subtotal */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm font-semibold text-[#005063] hover:text-[#003d4d] transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Agregar producto
            </button>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-0.5">
                Total calculado
              </p>
              <p className="text-xl font-extrabold text-[#005063]">
                {totalFormatted}
              </p>
            </div>
          </div>
        </section>

        {/* ── Payment ──────────────────────────────────────────── */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-gray-300">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-[#005063]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Pago
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Método */}
            <div>
              <FieldLabel htmlFor="payment-method">Método de pago</FieldLabel>
              <select
                id="payment-method"
                value={form.payment.method}
                onChange={setPayment("method")}
                className={[
                  selectClass,
                  errors.payment_method ? "border-red-500" : "",
                ].join(" ")}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.payment_method && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.payment_method}
                </p>
              )}
            </div>

            {/* Monto pagado */}
            <div>
              <FieldLabel htmlFor="payment-amount">Monto recibido</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
                  $
                </span>
                <input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.payment.amount}
                  onChange={setPayment("amount")}
                  className={[inputClass, "pl-6"].join(" ")}
                />
              </div>
              {parseFloat(form.payment.amount) < parseFloat(form.total) && (
                <p className="mt-1 text-xs text-yellow-600 font-medium">
                  El monto recibido es menor al total de la venta.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full md:w-auto px-8 py-3 text-sm font-bold text-on-surface-variant hover:bg-gray-200 transition-colors rounded-md cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto cursor-pointer px-12 py-3 bg-[#005165] text-white rounded-md font-bold text-sm shadow-xl shadow-primary/20 hover:bg-[#176071] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            )}
            {loading ? "Guardando…" : "Guardar venta"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewSaleForm;
