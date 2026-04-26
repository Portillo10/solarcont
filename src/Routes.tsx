import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LayoutWithSidebar } from "./layouts/LayoutWithSidebar";

// ---------------------------------------------------------------------------
// Lazy page imports
// ---------------------------------------------------------------------------
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const SalesPage = lazy(() => import("./pages/Sales"));
const PurchasesPage = lazy(() => import("./pages/Purchases"));
const TransactionsPage = lazy(() => import("./pages/Transactions"));
const InventoryPage = lazy(() => import("./pages/Inventory"));
const BalancePage = lazy(() => import("./pages/Resume"));
// const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// ---------------------------------------------------------------------------
// Route ↔ sidebar label mapping
// Used by the shell to derive the active nav item from the current pathname.
// ---------------------------------------------------------------------------
const PATH_TO_LABEL: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sales": "Ventas",
  "/purchases": "Compras",
  "/transactions": "Movimientos",
  "/inventory": "Inventario",
  "/balance": "Resumen de ingresos y egresos",
};

const LABEL_TO_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(PATH_TO_LABEL).map(([path, label]) => [label, path]),
);

// ---------------------------------------------------------------------------
// Page metadata — drives the top-bar title per route
// ---------------------------------------------------------------------------
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sales": "Ventas",
  "/purchases": "Compras",
  "/transactions": "Movimientos",
  "/inventory": "Inventario",
  "/balance": "Resumen de ingresos y egresos",
};

// ---------------------------------------------------------------------------
// Shell — wraps every authenticated route with LayoutWithSidebar.
// Lives as the <Outlet /> parent so the sidebar/header are never re-mounted.
// ---------------------------------------------------------------------------
const Shell: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeItem = PATH_TO_LABEL[pathname] ?? "Dashboard";
  const pageTitle = PAGE_TITLES[pathname] ?? "Digital Curator";

  const handleNavClick = (label: string) => {
    const path = LABEL_TO_PATH[label];
    if (path) navigate(path);
  };

  return (
    <LayoutWithSidebar
      activeItem={activeItem}
      pageTitle={pageTitle}
      userName="Marcus Thorne"
      userRole="Operations Director"
      userAvatar="https://lh3.googleusercontent.com/aida-public/AB6AXuA3TGq7zaA8B5lKueObEVTty9SshGmvotH8suh_LzAA5pJhsnmxNVL_xn58HEYjJQjpKeJdQXpbhTIhZRNJh7L99yGqDXL3m568QXsMc_8-iZ-OqNpGjc4cLMd3jRa_ngR9WSUHdS1boMqMLQB43sMAjl1AHCK9pHC1nb8x3Y7TQmyX4tEHjaoASNh_cSHJsCXylrwzDxr-FjXJmuUhxScsnmpGG88A-Bs8nbILxTNV43bOdLrMzzusJpa7ZbvP0s7AKfUi9RC6bbo"
      onNavClick={handleNavClick}
      onNotificationsClick={() => console.log("Notifications clicked")}
      onSettingsClick={() => console.log("Settings clicked")}
    >
      {/* Each page renders here without remounting the sidebar/header */}
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </LayoutWithSidebar>
  );
};

// ---------------------------------------------------------------------------
// Minimal suspense fallback — replace with your own skeleton if needed
// ---------------------------------------------------------------------------
const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-sm">
    Cargando…
  </div>
);

// ---------------------------------------------------------------------------
// Router definition
// ---------------------------------------------------------------------------
const router = createBrowserRouter([
  {
    // Root redirect — sends "/" to the default page
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    // Authenticated shell — all children inherit the sidebar + top bar
    element: <Shell />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/sales", element: <SalesPage /> },
      { path: "/purchases", element: <PurchasesPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/inventory", element: <InventoryPage /> },
      { path: "/balance", element: <BalancePage /> },
    ],
  },
  {
    // 404 — rendered outside the shell so the sidebar is hidden
    path: "*",
    element: (
      <Suspense fallback={null}>
        <h1>Not found</h1>
        {/* <NotFoundPage /> */}
      </Suspense>
    ),
  },
]);

// ---------------------------------------------------------------------------
// App entry-point — mount this in main.tsx / index.tsx
// ---------------------------------------------------------------------------
const AppRoutes: React.FC = () => <RouterProvider router={router} />;

export default AppRoutes;
