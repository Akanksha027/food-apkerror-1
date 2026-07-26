import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type VegMode = 'all' | 'pure_veg';

type VegState = {
  mode: VegMode;
  remember: boolean;
  setMode: (mode: VegMode) => void;
  setRemember: (remember: boolean) => void;
};

export const useVegPreferenceStore = create<VegState>()(
  persist(
    (set) => ({
      mode: 'all',
      remember: false,
      setMode: (mode) => set({ mode }),
      setRemember: (remember) => set({ remember }),
    }),
    {
      name: 'veg-preference-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) =>
        s.remember ? { mode: s.mode, remember: s.remember } : { remember: false, mode: 'all' },
    }
  )
);
