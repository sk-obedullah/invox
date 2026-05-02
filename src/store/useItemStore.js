import { create } from 'zustand';
import ItemRepository from '../data/repositories/ItemRepository';

const useItemStore = create((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  // Load all items
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await ItemRepository.getAll();
      set({ items, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch items:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Add a new item
  addItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const id = await ItemRepository.create(itemData);
      await get().fetchItems();
      return id;
    } catch (error) {
      console.error('Failed to add item:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update an existing item
  updateItem: async (id, itemData) => {
    set({ isLoading: true, error: null });
    try {
      await ItemRepository.update(id, itemData);
      await get().fetchItems();
    } catch (error) {
      console.error('Failed to update item:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Delete an item
  deleteItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await ItemRepository.delete(id);
      await get().fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Get item by ID
  getItemById: (id) => {
    return get().items.find((c) => c.id === id);
  },
}));

export default useItemStore;
