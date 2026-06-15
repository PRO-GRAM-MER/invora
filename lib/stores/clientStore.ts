import { create } from "zustand";

export type Client = {
  id: string;
  userId: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  createdAt: string;
};

type ClientStore = {
  clients: Client[];
  isLoading: boolean;
  error: string | null;

  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  removeClient: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  isLoading: false,
  error: null,

  setClients: (clients) => set({ clients }),
  addClient: (client) =>
    set((s) => ({ clients: [client, ...s.clients] })),
  updateClient: (id, data) =>
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeClient: (id) =>
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
