import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { User } from "../types/user.type";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserSelectorProps {
  users: User[];
  onChange?: (user: User | null) => void;
  placeholder?: string;
  selectedUserId?: number | null;
}

// ---------------------------------------------------------------------------
// Avatar — initials fallback when no image is provided
// ---------------------------------------------------------------------------
const Avatar: React.FC<{ user?: Partial<User>; size?: "sm" | "md" }> = ({
  user,
  size = "md",
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = user?.name
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const sizeClasses =
    size === "md" ? "w-10 h-10 text-sm" : "w-7 h-7 text-[10px]";

  if (false && !imgError) {
    return (
      <img
        src={""}
        alt={user?.name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full border-2 border-primary/10 object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full border-2 border-primary/10 bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center shrink-0`}
    >
      {initials}
    </div>
  );
};

// ---------------------------------------------------------------------------
// UserSelector
// ---------------------------------------------------------------------------
const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  onChange,
  placeholder = "Seleccione un usuario",
  selectedUserId,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (user: User | null) => {
    onChange?.(user);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative bg-white">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-container transition-colors group"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedUserId ? (
          <>
            {/* Name + role */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-tight text-on-surface">
                {users.find((user) => user.id === selectedUserId)?.name}
              </p>
            </div>
            <Avatar user={users.find((user) => user.id === selectedUserId)} />
          </>
        ) : (
          <span className="text-sm text-on-surface-variant">{placeholder}</span>
        )}
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl shadow-black/10 border border-outline-variant/20 overflow-hidden z-50"
          style={{ animation: "dropDown 150ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="p-1.5">
            {[...users, { id: null, name: "Todos los usuarios" }].map(
              (user) => {
                const isSelected = selectedUserId == user.id;
                return (
                  <button
                    key={user.id || "all"}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelect(user.id ? user : null)}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer hover:bg-gray-200",
                      isSelected
                        ? "bg-secondary-container"
                        : "hover:bg-surface-container",
                    ].join(" ")}
                  >
                    <Avatar user={user.id ? user : undefined} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {user.name}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0" />
                    )}
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default UserSelector;
