/**
 * Invoice Store (Zustand)
 * Manages invoice list state, filters, and pagination
 */

import { create } from 'zustand';
import InvoiceRepository from '../data/repositories/InvoiceRepository';

export const useInvoiceStore = create((set, get) => ({
  // State
  invoices: [],
  currentInvoice: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  stats: null,

  // Pagination
  page: 1,
  totalPages: 1,
  total: 0,
  hasMore: false,

  // Filters
  filters: {
    status: null,
    search: '',
    startDate: null,
    endDate: null,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  },

  // Actions
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1,
      invoices: [],
    }));
    get().fetchInvoices();
  },

  clearFilters: () => {
    set({
      filters: {
        status: null,
        search: '',
        startDate: null,
        endDate: null,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      },
      page: 1,
      invoices: [],
    });
    get().fetchInvoices();
  },

  fetchInvoices: async (refresh = false) => {
    const { filters, page, isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true, error: null, isRefreshing: refresh });

    try {
      const result = await InvoiceRepository.getAll({
        page: refresh ? 1 : page,
        limit: 20,
        ...filters,
      });

      set((state) => ({
        invoices: refresh ? result.data : [...state.invoices, ...result.data],
        page: refresh ? 1 : state.page,
        totalPages: result.totalPages,
        total: result.total,
        hasMore: result.hasMore,
        isLoading: false,
        isRefreshing: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false, isRefreshing: false });
    }
  },

  loadMore: async () => {
    const { hasMore, page, isLoading } = get();
    if (!hasMore || isLoading) return;

    set({ page: page + 1 });
    await get().fetchInvoices();
  },

  fetchInvoiceById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const invoice = await InvoiceRepository.getById(id);
      set({ currentInvoice: invoice, isLoading: false });
      return invoice;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createInvoice: async (invoice, lineItems) => {
    try {
      const id = await InvoiceRepository.create(invoice, lineItems);
      // Refresh the list
      await get().fetchInvoices(true);
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateInvoice: async (id, invoice, lineItems) => {
    try {
      await InvoiceRepository.update(id, invoice, lineItems);
      await get().fetchInvoices(true);
      return true;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    try {
      await InvoiceRepository.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        total: state.total - 1,
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateInvoiceStatus: async (id, status) => {
    try {
      await InvoiceRepository.updateStatus(id, status);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, status } : inv
        ),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const stats = await InvoiceRepository.getStats();
      set({ stats });
    } catch (error) {
      console.error('[Store] Stats fetch failed:', error);
    }
  },

  clearCurrentInvoice: () => set({ currentInvoice: null }),
  clearError: () => set({ error: null }),
}));
