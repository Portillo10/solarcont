import React from "react";

export function useModal(defaultOpen = false) {
  const [open, setOpen] = React.useState(defaultOpen);
  return {
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
  };
}
