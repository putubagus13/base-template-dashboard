// src/store/auth.store.ts
// ============================================================
// Global Share CLIENT STATE
// Gunakan hook untuk mengakses state global share (misalnya: data option filter dll).
// ============================================================

import { MemberStatusType } from "@/hooks/use-member-status-type";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type GlobalShareState = {
  memberStatusType: MemberStatusType[];
};

type GlobalShareActions = {
  setMemberStatusType: (memberStatusType: MemberStatusType[]) => void;
  clearGlobalShareState: () => void;
};

export const useGlobalShareStore = create<
  GlobalShareState & GlobalShareActions
>()(
  persist(
    (set) => ({
      memberStatusType: [],
      setMemberStatusType: (memberStatusType) => set({ memberStatusType }),
      clearGlobalShareState: () => set({ memberStatusType: [] }),
    }),
    {
      name: "global-share-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
