import { create } from 'zustand';

type UiState = {
  /** True once home categories chrome is pinned under the status bar. */
  homeCategoriesPinned: boolean;
  setHomeCategoriesPinned: (pinned: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  homeCategoriesPinned: false,
  setHomeCategoriesPinned: (homeCategoriesPinned) =>
    set({ homeCategoriesPinned }),
}));
