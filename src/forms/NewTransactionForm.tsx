import React, { useState } from "react";
import {
  TransactionSource,
  CreateTransactionInput,
} from "../types/transaction.type";
import { User } from "../types/user.type";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TransactionForm {
  description: string;
  amount: string;
  date: string;
  user_id: string;
  source: TransactionSource;
  method: string;
  category: string;
}

const INITIAL_FORM: TransactionForm = {
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  user_id: "",
  source: "payment",
  method: "",
  category: "",
};

const PAYMENT_METHODS = [
  "Efectivo",
  "Transferencia",
  "Tarjeta de crédito",
  "Tarjeta de débito",
  "Cheque",
];

// ---------------------------------------------------------------------------
// Sub-components (reutilizados de NewProductForm)
// ---------------------------------------------------------------------------

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
}

const FieldLabel: React.FC<LabelProps> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wider"
  >
    {children}
  </label>
);

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  className = "",
  ...props
}) => (
  <input
    id={id}
    className={[
      "w-full border border-gray-400 rounded-lg py-2 px-3",
      "focus:ring-1 focus:ring-primary text-on-surface placeholder:text-slate-400",
      "transition-shadow outline-none",
      className,
    ].join(" ")}
    {...props}
  />
);

const PriceInput: React.FC<TextInputProps> = ({ id, ...props }) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none">
      $
    </span>
    <input
      id={id}
      type="number"
      step="0.01"
      min="0"
      className={[
        "w-full border border-gray-400 rounded-lg py-2 pl-7 pr-3",
        "focus:ring-1 focus:ring-primary text-on-surface placeholder:text-slate-400",
        "transition-shadow outline-none",
      ].join(" ")}
      {...props}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NewTransactionFormProps {
  onSave?: (data: CreateTransactionInput) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<TransactionForm>;
  loading?: boolean;
  title?: string;
  activeUsers?: User[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const NewTransactionForm: React.FC<NewTransactionFormProps> = ({
  onSave,
  onCancel,
  initialValues,
  loading = false,
  title = "Registrar Movimiento",
  activeUsers = [],
}) => {
  const [form, setForm] = useState<TransactionForm>({
    ...INITIAL_FORM,
    ...initialValues,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof TransactionForm, string>>
  >({});

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const set =
    (field: keyof TransactionForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.description.trim())
      next.description = "La descripción es obligatoria.";
    if (!form.amount) next.amount = "Ingresa el monto.";
    if (Number(form.amount) <= 0)
      next.amount = "El monto debe ser mayor a cero.";
    if (!form.date) next.date = "La fecha es obligatoria.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!validate()) return;
    console.log(form.user_id);

    const payload: CreateTransactionInput = {
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      user_id: form.user_id ? parseInt(form.user_id) : null,
      source: form.source,
      ...(form.source === "payment" && {
        method: form.method || undefined,
      }),
    };

    await onSave?.(payload);
  };

  const isPayment = form.source === "payment";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-6 py-3">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">
          {title}
        </h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-gray-400">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Fuente — determina si es ingreso o gasto */}
            <div className="col-span-1 md:col-span-2">
              <FieldLabel htmlFor="tx-source">Tipo de movimiento</FieldLabel>
              <div className="flex gap-3">
                {(["payment", "expense"] as TransactionSource[]).map((s) => {
                  const isSelected = form.source === s;
                  const label =
                    s === "payment" ? "Ingreso (Pago)" : "Gasto / Egreso";
                  const selectedStyle =
                    s === "payment"
                      ? "bg-green-100 border-green-600 text-green-800"
                      : "bg-red-100 border-red-600 text-red-800";
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, source: s }))
                      }
                      className={[
                        "flex-1 py-2 px-4 rounded-lg border-2 font-bold text-sm transition-all cursor-pointer",
                        isSelected
                          ? selectedStyle
                          : "border-gray-300 text-gray-500 hover:border-gray-400",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descripción — full width */}
            <div className="col-span-1 md:col-span-2">
              <FieldLabel htmlFor="tx-description">Descripción</FieldLabel>
              <TextInput
                id="tx-description"
                value={form.description}
                onChange={set("description")}
                placeholder="Ej. Venta de vidrio templado — Proyecto Horizon"
                required
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-error">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Monto */}
            <div>
              <FieldLabel htmlFor="tx-amount">Monto</FieldLabel>
              <PriceInput
                id="tx-amount"
                value={form.amount}
                onChange={set("amount")}
                placeholder="0.00"
                required
              />
              {errors.amount && (
                <p className="mt-1.5 text-xs text-error">{errors.amount}</p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <FieldLabel htmlFor="tx-date">Fecha</FieldLabel>
              <TextInput
                id="tx-date"
                type="date"
                value={form.date.slice(0, 10)}
                onChange={set("date")}
                required
              />
              {errors.date && (
                <p className="mt-1.5 text-xs text-error">{errors.date}</p>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="tx-type">Usuario responsable</FieldLabel>
              <select
                id="tx-type"
                value={form.user_id}
                onChange={set("user_id")}
                className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none transition-shadow"
              >
                {activeUsers.map((user, index) => (
                  <option key={index} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos exclusivos de payment */}
            {isPayment ? (
              <>
                {/* <div>
                  <FieldLabel htmlFor="tx-type">Categoría de pago</FieldLabel>
                  <select
                    id="tx-type"
                    value={form.source}
                    onChange={set("source")}
                    className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none transition-shadow"
                  >
                    <option value="payment">Entrada</option>
                    <option value="expense">Salida</option>
                  </select>
                </div> */}

                <div>
                  <FieldLabel htmlFor="tx-method">Método de pago</FieldLabel>
                  <select
                    id="tx-method"
                    value={form.method}
                    onChange={set("method")}
                    className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none transition-shadow"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <FieldLabel htmlFor="tx-method">Categoría</FieldLabel>
                <select
                  id="tx-category"
                  value={form.category}
                  onChange={set("category")}
                  className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none transition-shadow"
                >
                  {["Otro", "Casa", "Oficina", "Taller"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Footer actions */}
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
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTransactionForm;
