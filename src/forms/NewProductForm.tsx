import React, { useState } from "react";
import { User } from "../services/user.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ProductForm {
  name: string;
  brand: string;
  category: string;
  purchase_price: string;
  price: string;
  stock: string;
  user_id: string;
}

const INITIAL_FORM: ProductForm = {
  name: "",
  brand: "",
  category: "Materiales Estructurales",
  purchase_price: "",
  price: "",
  stock: "0",
  user_id: "1",
};

const CATEGORIES = [
  "Otro",
  "Paneles",
  "Baterías",
  "Inversores",
  "Controladores",
];

// ---------------------------------------------------------------------------
// Sub-components
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

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

const PriceInput: React.FC<PriceInputProps> = ({ id, ...props }) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none">
      $
    </span>
    <input
      id={id}
      type="number"
      step="1000"
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

const StockInput: React.FC<TextInputProps> = ({ id, ...props }) => (
  <input
    id={id}
    type="number"
    step="1"
    min="0"
    className={[
      "w-full border border-gray-400 rounded-lg py-2 px-3",
      "focus:ring-1 focus:ring-primary text-on-surface placeholder:text-slate-400",
      "transition-shadow outline-none",
    ].join(" ")}
    {...props}
  />
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface NewProductFormProps {
  /** Called with the form values when the user submits */
  onSave?: (data: ProductForm) => void | Promise<void>;
  /** Called when the user clicks Cancel */
  onCancel?: () => void;
  /** Pre-fill values (useful when editing an existing product) */
  initialValues?: Partial<ProductForm>;
  /** Show a loading spinner on the save button */
  loading?: boolean;

  activeUsers: User[];
  title?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const NewProductForm: React.FC<NewProductFormProps> = ({
  onSave,
  onCancel,
  initialValues,
  loading = false,
  activeUsers,
  title = "Crear Nuevo Producto",
}) => {
  const [form, setForm] = useState<ProductForm>({
    ...INITIAL_FORM,
    ...initialValues,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductForm, string>>
  >({});

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const set =
    (field: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio.";
    if (!form.brand.trim()) next.brand = "La marca es obligatoria.";
    if (!form.purchase_price)
      next.purchase_price = "Ingresa el precio de compra.";
    if (!form.price) next.price = "Ingresa el precio de venta.";
    if (Number(form.purchase_price) < 0)
      next.purchase_price = "El precio no puede ser negativo.";
    if (Number(form.price) < 0) next.price = "El precio no puede ser negativo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave?.(form);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto px-6 py-3">
      {/* Breadcrumb */}

      {/* Page header */}
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">
          {title}
        </h1>
        {/* <p className="text-on-surface-variant max-w-xl text-base font-light leading-relaxed">
          Complete la información básica para registrar un nuevo ítem en el
          sistema.
        </p> */}
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-gray-400">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Product name — full width */}
            <div className="col-span-1 md:col-span-2">
              <FieldLabel htmlFor="product-name">
                Nombre del Producto
              </FieldLabel>
              <TextInput
                id="product-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Ej. Panel Arquitectónico Vantablack"
                required
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-error">{errors.name}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <FieldLabel htmlFor="product-brand">Marca</FieldLabel>
              <TextInput
                id="product-brand"
                value={form.brand}
                onChange={set("brand")}
                placeholder="Ej. LuxMaterials"
                required
              />
              {errors.brand && (
                <p className="mt-1.5 text-xs text-error">{errors.brand}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <FieldLabel htmlFor="product-category">Categoría</FieldLabel>
              <select
                id="product-category"
                value={form.category}
                onChange={set("category")}
                className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none transition-shadow"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase price */}
            <div>
              <FieldLabel htmlFor="product-purchase-price">
                Precio de Compra
              </FieldLabel>
              <PriceInput
                id="product-purchase-price"
                value={form.purchase_price}
                onChange={set("purchase_price")}
                placeholder="0.00"
                required
              />
              {errors.purchase_price && (
                <p className="mt-1.5 text-xs text-error">
                  {errors.purchase_price}
                </p>
              )}
            </div>

            {/* Sale price */}
            <div>
              <FieldLabel htmlFor="product-sale-price">
                Precio de Venta
              </FieldLabel>
              <PriceInput
                id="product-sale-price"
                value={form.price}
                onChange={set("price")}
                placeholder="0.00"
                required
              />
              {errors.price && (
                <p className="mt-1.5 text-xs text-error">{errors.price}</p>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="product-sale-price">stock</FieldLabel>
              <StockInput
                id="product-stock"
                value={form.stock}
                onChange={set("stock")}
                placeholder="0 unidades"
                required
              />
              {errors.stock && (
                <p className="mt-1.5 text-xs text-error">{errors.stock}</p>
              )}
            </div>
            <div>
              <FieldLabel htmlFor="product-sale-price">Propietario</FieldLabel>
              <select
                id="product-user-id"
                value={form.user_id}
                onChange={set("user_id")}
                className="w-full border border-gray-400 rounded-lg py-2 px-3 focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none transition-shadow"
              >
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.stock && (
                <p className="mt-1.5 text-xs text-error">{errors.stock}</p>
              )}
            </div>
          </div>
        </section>

        {/* Footer actions */}
        <div className="flex flex-col md:flex-row items-center justify-end gap-4 border-outline-variant/15">
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
            className="w-full md:w-auto cursor-pointer px-12 py-3 bg-[#005165] bg-linear-to-br from-primary to-primary-container text-white rounded-md font-bold text-sm shadow-xl shadow-primary/20 hover:bg-[#176071] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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

export default NewProductForm;
