import { create } from "zustand";

type SearchStore = {
  query: string;
  setQuery: (q: string) => void;
  clear: () => void;
};

export const useSearchStore = create<SearchStore>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
  clear: () => set({ query: "" }),
}));
