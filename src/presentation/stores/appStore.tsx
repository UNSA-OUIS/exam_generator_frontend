import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  dopen: boolean;
  updateOpen: (dopen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      dopen: true,
      updateOpen: (dopen: boolean) => set({ dopen }),
    }),
    {
      name: 'appStore', // nombre único en localStorage
    }
  )
);