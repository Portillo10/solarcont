import React from "react";
import {
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  // PlusSquare,
  Send,
  Package,
  Wallet,
  // HelpCircle,
  // LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  activeItem?: string;
  onNavClick?: (label: string) => void;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/" },
  { label: "Ventas", icon: <ReceiptText size={20} />, href: "/sales" },
  { label: "Compras", icon: <ShoppingCart size={20} />, href: "/purchases" },
  { label: "Movimientos", icon: <Send size={20} />, href: "/transactions" },
  { label: "Inventario", icon: <Package size={20} />, href: "/inventory" },
  { label: "Resumen", icon: <Wallet size={20} />, href: "/balance" },
];

// const bottomItems = [
//   { label: "Help Center", icon: <HelpCircle size={20} />, href: "#" },
//   { label: "Sign Out", icon: <LogOut size={20} />, href: "#" },
// ];

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem = "Outgoings",
  onNavClick,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-50 flex flex-col py-6 pl-4 z-50">
      {/* Logo */}
      <div className="mb-10 px-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-900 to-cyan-700
          flex items-center justify-center text-white shadow-sm"
        >
          <Package size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-cyan-900">
            SolarCont
          </h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
            Inventory Control
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = item.label === activeItem;
          return isActive ? (
            <a
              key={item.label}
              href={item.href}
              onClick={() => onNavClick?.(item.label)}
              className="flex items-center gap-3 px-4 py-3 bg-white text-cyan-900
                font-bold rounded-l-full shadow-sm"
            >
              {item.icon}
              <span className="text-md">{item.label}</span>
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              onClick={() => onNavClick?.(item.label)}
              className="flex items-center gap-3 px-4 py-3 text-slate-600
                hover:text-cyan-800 hover:translate-x-1 transition-all duration-300"
            >
              {item.icon}
              <span className="text-md font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Bottom nav */}
      {/* <div className="mt-auto border-t border-slate-100 pt-6 space-y-1">
        {bottomItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 text-slate-600
              hover:text-cyan-800 transition-all"
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </a>
        ))}
      </div> */}
    </aside>
  );
};

export default Sidebar;
