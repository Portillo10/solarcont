import React, { useEffect, useState } from "react";
import { AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { ProductWithStock } from "../types/product.type";
import {
  getPaginatedProducts,
  createProduct,
  getProductsOverview,
  ProductsOverview,
  updateProduct,
  deleteProduct,
} from "../services/product.service";
import { useModal } from "../hooks/useModal";
import Modal from "../components/Modal";
import NewProductForm, { ProductForm } from "../forms/NewProductForm";
import { getUsers } from "../services/user.service";
import { User } from "../types/user.type";
import { createInventoryMovement } from "../services/inventory.service";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import { useUser } from "../hooks/useUser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
// const PRODUCTS: ProductWithStock[] = [
//   {
//     id: 1,
//     name: "Tempered Facade Glass 12mm",
//     brand: "Vitreos Lux",
//     category: "Structural Glazing",
//     stock: 422,
//     purchase_price: 185,
//     price: 245,
//   },
//   {
//     id: 2,
//     name: "I-Beam Structural Steel Grade A",
//     brand: "IronForge",
//     category: "Framework",
//     stock: 4,
//     purchase_price: 890,
//     price: 1120,
//   },
//   {
//     id: 3,
//     name: "Hydraulic Piston System v.4",
//     brand: "MechFlow",
//     category: "Mechanical",
//     stock: 12,
//     purchase_price: 10200,
//     price: 14500,
//   },
//   {
//     id: 4,
//     name: "Natural Oak Acoustic Panels",
//     brand: "EcoTimber",
//     category: "Finishing",
//     stock: 1240,
//     purchase_price: 62,
//     price: 85,
//   },
// ];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const StockCell: React.FC<{ product: ProductWithStock }> = ({ product }) => {
  if (product.stock < 5) {
    return (
      <div className="flex items-center gap-1 text-red-700 font-bold text-sm uppercase tracking-tighter">
        {/* <AlertTriangle size={14} /> */}
        <span>{product.stock} Units</span>
      </div>
    );
  }

  return (
    <span className="text-sm font-bold text-tertiary">
      {product.stock.toLocaleString()} Units
    </span>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const StatCards: React.FC<{
  totalCatalogValue: string;
  itemsCount: number;
  stockAlertsCount: number;
}> = ({ totalCatalogValue, itemsCount, stockAlertsCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6 ">
    {/* Total Catalog Value */}
    <div className="md:col-span-8 bg-surface-container-lowest rounded-xl py-6 px-8 flex items-center justify-between overflow-hidden relative bg-white border border-gray-100 shadow-md shadow-gray-300">
      <div className="z-10">
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1">
          Capital total en inventario
        </p>
        <h2 className="text-4xl font-bold text-primary tracking-tight text-green-700">
          {totalCatalogValue}
        </h2>
        <div className="mt-4 flex items-center gap-4"></div>
      </div>

      {/* Decorative background icon */}

      <div className="flex gap-12 z-10 ">
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">
            Total items
          </p>
          <p className="text-xl font-bold">{itemsCount}</p>
        </div>
      </div>
    </div>

    {/* Critical alerts */}
    <div className="md:col-span-4 bg-error-container rounded-xl py-6 px-8 flex flex-col justify-between bg-red-200 text-red-700 shadow-md shadow-gray-300">
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-on-error-container mb-1">
          Alerta de stock
        </p>
        <h2 className="text-4xl font-bold text-error tracking-tight">
          {stockAlertsCount}
        </h2>
      </div>
      <div className="flex items-center justify-between text-on-error-container">
        <span className="text-sm font-medium">
          Productos con stock muy bajo
        </span>
        <AlertTriangle size={22} />
      </div>
    </div>
  </div>
);

interface ProductTableProps {
  products: ProductWithStock[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onSearch: (query: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onSearch,
}) => {
  return (
    <div className="overflow-x-auto bg-white shadow-md shadow-gray-300 rounded-lg border border-gray-200">
      {/* 🔍 Buscador */}
      <div className="flex items-center justify-center w-full p-3 gap-3">
        <SearchInput onSearch={onSearch} />
      </div>
      {products.length === 0 ? (
        <div className="p-10 text-center text-on-surface-variant">
          No se encontraron coincidencias.
        </div>
      ) : (
        <table className="w-full  border-spacing-y-2 ">
          <thead className="bg-[#dae6ec]">
            <tr className="text-left text-sm uppercase tracking-widest font-bold text-on-surface-variant ">
              <th className="py-3 pl-4">Nombre de producto</th>
              <th className="">Marca</th>
              {/* <th className="">Categoría</th> */}
              <th className="">Stock</th>
              <th className="text-right">Precio de compra</th>
              <th className="text-right">Precio</th>
              <th className="text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-md">
            {products.map((product) => (
              <tr
                key={product.id}
                className="transition-all border-t hover:bg-gray-50 border-gray-300"
              >
                <td className="py-3 pl-4 font-semibold text-on-surface">
                  {product.name}
                </td>
                <td className="py-2 text-on-surface">{product.brand}</td>
                {/* <td className="py-2 text-on-surface-variant">
                  {product.category}
                </td> */}
                <td className="py-2">
                  <StockCell product={product} />
                </td>
                <td className="py-2 text-right font-medium text-secondary pr-2">
                  {fmt(product.purchase_price)}
                </td>
                <td className="py-2 text-right font-semibold text-on-surface">
                  {fmt(product.price)}
                </td>
                <td className="py-2 text-right pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(product.id)}
                      className="p-2 text-on-surface-variant rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                      aria-label="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                      aria-label="Delete"
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
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const InventoryPage: React.FC = () => {
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

  const { user } = useUser();

  //states
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(
    null,
  );
  const [users, setUsers] = useState<User[]>([]);
  const [productsOverview, setProductsOverview] =
    useState<ProductsOverview | null>(null);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const modal = useModal();
  const deleteModal = useModal();

  //useEffects
  useEffect(() => {
    fetchUsers();
    fetchProductsOverview();
  }, []);
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts();
    fetchProductsOverview();
  }, [user]);

  function getItemsPerPage() {
    const windowHeight = window.innerHeight;
    if (windowHeight < 700) {
      return 1;
    }
    const availableHeight = windowHeight - 560; // restamos el espacio ocupado
    const rowHeight = 50.8;

    // Redondeamos hacia abajo para no tener filas incompletas
    const rowCount = Math.floor(availableHeight / rowHeight);
    return rowCount;
  }

  const handleEdit = (id: number) => {
    const product = products.find((p) => p.id === id);
    setEditingProduct(product || null);
    modal.onOpen();
  };

  const handleDelete = (id: number) => {
    deleteModal.onOpen();
    setIdToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;
    await deleteProduct(idToDelete);
    await fetchProducts();
    await fetchProductsOverview();
    setIdToDelete(null);
    deleteModal.onClose();
  };

  const handleNewEntry = () => {
    modal.onOpen();
  };

  const handleEditProduct = async (product: ProductForm) => {
    if (!editingProduct) {
      console.log("Editing product null");
      return;
    }
    await updateProduct(editingProduct.id, {
      name: product.name,
      price: parseInt(product.price),
      brand: product.brand || undefined,
      category: product.category || undefined,
      purchase_price: parseInt(product.purchase_price),
      user_id: product.user_id ? parseInt(product.user_id) : undefined,
    });
    if (editingProduct.stock !== parseInt(product.stock || "0")) {
      const quantityDifference =
        parseInt(product.stock || "0") - (editingProduct?.stock || 0);
      await createInventoryMovement({
        type: quantityDifference > 0 ? "IN" : "OUT",
        product_id: editingProduct.id,
        quantity: quantityDifference,
      });
    }
    await fetchProducts();
    await fetchProductsOverview();
    setEditingProduct(null);
    modal.onClose();
  };

  const handleSaveProduct = async (product: ProductForm) => {
    if (
      !product.name ||
      !product.price ||
      !product.purchase_price ||
      isNaN(Number(product.price)) ||
      isNaN(Number(product.purchase_price))
    ) {
      alert(
        "Por favor completa todos los campos requeridos con valores válidos.",
      );
      return;
    }

    const { id } = await createProduct({
      name: product.name,
      price: parseInt(product.price),
      brand: product.brand || undefined,
      category: product.category || undefined,
      purchase_price: parseInt(product.purchase_price),
      user_id: product.user_id ? parseInt(product.user_id) : 1,
    });

    const productStock = parseInt(product.stock || "0");
    if (productStock > 0) {
      await createInventoryMovement({
        type: "IN",
        product_id: id,
        quantity: productStock,
      });
    }

    modal.onClose();
    fetchProducts();
    fetchProductsOverview();
  };

  const handleSearch = async (query: string) => {
    await fetchProducts(query);
    await fetchProductsOverview(query);
  };

  const fetchProductsOverview = async (search?: string) => {
    try {
      const result = await getProductsOverview(user?.id, search);
      setProductsOverview(result);
    } catch (error) {
      console.log("Error cargando productos");
      console.log(error);
    }
  };

  const fetchProducts = async (search?: string) => {
    try {
      const totalItemsPerPage = getItemsPerPage();
      setItemsPerPage(totalItemsPerPage);
      const { data, total } = await getPaginatedProducts({
        page: currentPage,
        pageSize: totalItemsPerPage,
        user_id: user?.id,
        search,
      });

      const totalPages = Math.ceil(total / totalItemsPerPage);
      setProducts(data);
      setTotalItems(total);
      setTotalPages(totalPages);
    } catch (error) {
      console.log("Error cargando productos");
      console.log(error);
    }
  };

  const fetchUsers = async () => {
    const users = await getUsers();
    setUsers(users);
  };

  return (
    <div>
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-end gap-6 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewEntry}
            className="px-6 py-3 bg-[#005063] bg-linear-to-br from-primary to-primary-container text-white font-semibold rounded-md shadow-lg shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-sm">Nuevo producto</span>
          </button>
          <Modal
            size="xl"
            onClose={() => {
              modal.onClose();
              setEditingProduct(null);
            }}
            open={modal.open}
          >
            <NewProductForm
              title={editingProduct ? "Editar Producto" : undefined}
              initialValues={{
                name: editingProduct?.name || "",
                brand: editingProduct?.brand || "",
                category: editingProduct?.category || "",
                price: editingProduct?.price.toString() || "",
                stock: editingProduct?.stock.toString() || "0",
                user_id:
                  editingProduct?.user_id?.toString() ||
                  user?.id.toString() ||
                  "",
                purchase_price: editingProduct?.purchase_price.toString() || "",
              }}
              activeUsers={users}
              onSave={(product) => {
                if (editingProduct) {
                  handleEditProduct(product);
                } else {
                  handleSaveProduct(product);
                }
              }}
              onCancel={modal.onClose}
            />
          </Modal>
        </div>
      </header>

      {/* Stats */}
      <StatCards
        stockAlertsCount={productsOverview?.lowStockCount || 0}
        totalCatalogValue={fmt(productsOverview?.totalCapital || 0)}
        itemsCount={productsOverview?.totalProducts || 0}
      />

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-xl ">
        <ProductTable
          onSearch={(searchTerm) => {
            handleSearch(searchTerm);
          }}
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <Modal onClose={deleteModal.onClose} open={deleteModal.open}>
          <div className="p-2">
            <h2 className="text-xl font-bold text-on-surface mb-4">
              Confirmar eliminación
            </h2>
            <p className="text-on-surface-variant mb-6 text-base">
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no
              se puede deshacer.
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
          label="productos"
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

export default InventoryPage;
