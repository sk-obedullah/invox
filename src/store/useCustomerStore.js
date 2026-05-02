/**
 * Customer Store (Zustand)
 */

import { create } from 'zustand';
import CustomerRepository from '../data/repositories/CustomerRepository';

export const useCustomerStore = create((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,
  total: 0,

  fetchCustomers: async (search = '') => {
    set({ isLoading: true, error: null });
    try {
      const result = await CustomerRepository.getAll({ search });
      set({ customers: result.data, total: result.total, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createCustomer: async (customer) => {
    try {
      const id = await CustomerRepository.create(customer);
      get().fetchCustomers();
      return id;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateCustomer: async (id, customer) => {
    try {
      await CustomerRepository.update(id, customer);
      get().fetchCustomers();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      await CustomerRepository.delete(id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        total: state.total - 1,
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
