// src/hooks/use-disclosure.ts
// ============================================================
// DISCLOSURE HOOK — Manage open/close state untuk dialogs, dropdowns, dsb.
//
// @example
// const { isOpen, open, close, toggle } = useDisclosure()
// <Dialog open={isOpen} onClose={close}>...</Dialog>
// <Button onClick={open}>Open</Button>
// ============================================================

import { useState, useCallback } from "react";

type UseDisclosureReturn = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle };
}
