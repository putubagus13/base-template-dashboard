// src/store/auth.store.ts
// ============================================================
// AUTH CLIENT STATE
// Gunakan hook useAuthStore di client components.
// Server components gunakan getAuthUser() dari lib/auth/helpers.
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  isHydrated: boolean;
};

type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  setHydrated: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
