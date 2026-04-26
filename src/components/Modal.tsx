import React, { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ModalSize = "sm" | "md" | "lg" | "xl" | "xxl" | "full";
export type ModalVariant = "default" | "danger" | "success" | "warning";

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

export interface ModalProps {
  /** Controls visibility */
  open: boolean;
  /** Called when the modal requests to close (backdrop click, Escape, X button) */
  onClose: () => void;
  /** Modal title shown in the header */
  title?: string;
  /** Optional subtitle below the title */
  description?: string;
  /** Modal width preset */
  size?: ModalSize;
  /** Colour tone of the header accent and icon */
  variant?: ModalVariant;
  /** Optional icon rendered next to the title (lucide-react element) */
  icon?: React.ReactNode;
  /** Footer action buttons — rendered right-to-left */
  actions?: ModalAction[];
  /** Prevent closing when clicking the backdrop */
  disableBackdropClose?: boolean;
  /** Prevent closing with Escape key */
  disableEscapeClose?: boolean;
  /** Hide the × button in the header */
  hideCloseButton?: boolean;
  /** Additional className on the modal panel */
  className?: string;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------
const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  xxl: "max-w-3xl",
  full: "max-w-[95vw] h-[90vh]",
};

// ---------------------------------------------------------------------------
// Variant map — header accent colour + icon bg
// ---------------------------------------------------------------------------
const VARIANT_STYLES: Record<
  ModalVariant,
  { accent: string; iconBg: string; iconText: string }
> = {
  default: {
    accent: "from-primary/5 to-transparent",
    iconBg: "bg-secondary-container",
    iconText: "text-primary",
  },
  danger: {
    accent: "from-error/8 to-transparent",
    iconBg: "bg-error-container",
    iconText: "text-error",
  },
  success: {
    accent: "from-tertiary/8 to-transparent",
    iconBg: "bg-tertiary-fixed",
    iconText: "text-tertiary",
  },
  warning: {
    accent: "from-amber-500/8 to-transparent",
    iconBg: "bg-amber-50",
    iconText: "text-amber-700",
  },
};

// ---------------------------------------------------------------------------
// Action button styles
// ---------------------------------------------------------------------------
const ACTION_STYLES: Record<NonNullable<ModalAction["variant"]>, string> = {
  primary:
    "bg-gradient-to-br from-primary to-primary-container text-white font-semibold hover:opacity-90 shadow-sm shadow-primary/20",
  secondary:
    "bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high",
  ghost: "text-on-surface-variant font-medium hover:bg-surface-container",
  danger:
    "bg-error-container text-error font-semibold hover:bg-error hover:text-white",
};

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
const Spinner: React.FC = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
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
);

// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  variant = "default",
  icon,
  actions = [],
  disableBackdropClose = false,
  disableEscapeClose = false,
  hideCloseButton = false,
  className = "",
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const variantStyle = VARIANT_STYLES[variant];

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableEscapeClose) onClose();
    },
    [onClose, disableEscapeClose],
  );

  // Lock body scroll + listen for Escape
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    // Focus trap: focus the panel on mount
    setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !disableBackdropClose) onClose();
  };

  const hasHeader = title || icon || !hideCloseButton;
  const hasFooter = actions.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      style={{ animation: "fadeIn 150ms ease" }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "relative w-full bg-gray-50 rounded-2xl shadow-2xl shadow-black/20",
          "outline-none overflow-hidden flex flex-col",
          SIZE_CLASSES[size],
          size === "full" ? "max-h-[90vh]" : "max-h-[85vh]",
          className,
        ].join(" ")}
        style={{ animation: "slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header accent strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 bg-linear-to-b ${variantStyle.accent} pointer-events-none`}
        />

        {/* Header */}
        {hasHeader && (
          <div className="relative flex items-start justify-between px-6 pt-4 pb-2 gap-4 border-b">
            <div className="flex items-start gap-4">
              {icon && (
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${variantStyle.iconBg} ${variantStyle.iconText}`}
                >
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-bold text-on-surface tracking-tight leading-snug font-headline"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-0.5 text-sm text-on-surface-variant leading-relaxed"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="shrink-0 p-1.5 cursor-pointer rounded-full text-on-surface-variant hover:bg-gray-200 hover:text-on-surface transition-colors mt-0.5"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Divider */}
        {hasHeader && children && (
          <div className="h-px bg-outline-variant/20 mx-6" />
        )}

        {/* Body — scrollable */}
        {children && (
          <div className="relative flex-1 overflow-y-auto px-6 py-4 text-sm text-on-surface leading-relaxed">
            {children}
          </div>
        )}

        {/* Footer */}
        {hasFooter && (
          <>
            <div className="h-px bg-outline-variant/20 mx-6" />
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-surface-container-low/40">
              {[...actions].reverse().map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={[
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                    ACTION_STYLES[
                      action.variant ?? (idx === 0 ? "primary" : "secondary")
                    ],
                  ].join(" ")}
                >
                  {action.loading && <Spinner />}
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default Modal;
