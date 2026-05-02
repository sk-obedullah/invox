/**
 * Settings Store (Zustand)
 */

import { create } from 'zustand';
import SettingsRepository from '../data/repositories/SettingsRepository';
import { DEFAULT_SETTINGS } from '../domain/models/Settings';

export const useSettingsStore = create((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await SettingsRepository.get();
      if (settings) {
        set({ ...settings, isLoaded: true, isLoading: false });
      } else {
        set({ isLoaded: true, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const currentSettings = get();
    const newSettings = { ...currentSettings, ...updates };

    set(updates);

    try {
      await SettingsRepository.update(newSettings);
    } catch (error) {
      // Rollback on failure
      set(currentSettings);
      set({ error: error.message });
      throw error;
    }
  },

  getNextInvoiceNumber: async () => {
    try {
      const invoiceNumber = await SettingsRepository.getNextInvoiceNumber();
      // Reload to sync next_invoice_number
      const settings = await SettingsRepository.get();
      if (settings) {
        set({ next_invoice_number: settings.next_invoice_number });
      }
      return invoiceNumber;
    } catch (error) {
      throw error;
    }
  },

  updateTheme: async (theme) => {
    set({ theme });
    try {
      await SettingsRepository.updateTheme(theme);
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateLogoPath: async (path) => {
    set({ company_logo_path: path });
    try {
      await SettingsRepository.updateLogoPath(path);
    } catch (error) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
