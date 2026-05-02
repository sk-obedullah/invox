/**
 * App Store (Zustand)
 * Global app state - initialization, modals, etc.
 */

import { create } from 'zustand';
import databaseManager from '../data/database/DatabaseManager';
import { useSettingsStore } from './useSettingsStore';

export const useAppStore = create((set) => ({
  isInitialized: false,
  isInitializing: true,
  initError: null,
  snackbar: { visible: false, message: '', type: 'info' },

  initialize: async () => {
    set({ isInitializing: true, initError: null });
    try {
      // Initialize database
      await databaseManager.initialize();

      // Load settings
      await useSettingsStore.getState().loadSettings();

      set({ isInitialized: true, isInitializing: false });
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      set({ initError: error.message, isInitializing: false });
    }
  },

  showSnackbar: (message, type = 'info') => {
    set({ snackbar: { visible: true, message, type } });
  },

  hideSnackbar: () => {
    set((state) => ({
      snackbar: { ...state.snackbar, visible: false },
    }));
  },
}));
