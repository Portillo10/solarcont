import React, { useEffect } from "react";
import { Bell, Settings } from "lucide-react";
import UserSelector from "../components/UserSelector";
import { getUsers } from "../services/user.service";
import { useUserSelect } from "../hooks/useUserSelect";
import { User } from "../types/user.type";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  headerAction?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title = "Outgoings Ledger",
  onNotificationsClick,
  onSettingsClick,
  headerAction,
}) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const { handleUserChange, selectedUserId } = useUserSelect();

  useEffect(() => {
    async function loadUsers() {
      const users = await getUsers();
      setUsers(users);
      // console.log("Loaded users:", users);
    }
    loadUsers();
  }, []);

  return (
    <main className="ml-64 min-h-screen bg-[#eef4f6]">
      {/* Top App Bar */}
      <header
        className="bg-white/70 backdrop-blur-xl fixed top-0 right-0 left-64 z-40 h-16
        flex justify-between items-center px-8"
      >
        <div className="flex items-center gap-4">
          <span
            className="text-xl font-bold bg-linear-to-br from-cyan-900 to-cyan-700
            bg-clip-text text-transparent"
          >
            {title}
          </span>
          <div className="h-4 w-px bg-slate-200" />
          {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48"
              placeholder="Search shipments..."
              type="text"
            />
          </div> */}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button
              onClick={onNotificationsClick}
              className="p-2 text-slate-500 hover:bg-slate-100/50 rounded-lg transition-colors"
            >
              <Bell size={20} />
            </button>
            <button
              onClick={onSettingsClick}
              className="p-2 text-slate-500 hover:bg-slate-100/50 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>

          <UserSelector
            users={users}
            onChange={handleUserChange}
            selectedUserId={selectedUserId}
          />
          {/* <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold leading-tight">{userName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                {userRole}
              </p>
            </div>
            {userAvatar && (
              <img
                src={userAvatar}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-primary/10 object-cover"
              />
            )}
          </div> */}
          {headerAction}
        </div>
      </header>

      <div className="pt-24 pb-12 px-8">{children}</div>
    </main>
  );
};

export default Layout;
