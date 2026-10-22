/**
 * InventoryMultiPickerModal - Multi-select inventory picker with in-modal quantity selector
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';
import { formatCurrency } from '../../../utils/formatters';
import SearchBar from '../common/SearchBar';

const InventoryMultiPickerModal = ({
  visible,
  items,
  recentItems = [],
  currency = 'INR',
  onClose,
  onAddSelected,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  
  // Map of itemId -> { item, quantity }
  const [selectedMap, setSelectedMap] = useState({});

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const all = !search
      ? [
          ...recentItems.map((i) => ({ ...i, isRecent: true })),
          ...items.filter((i) => !recentItems.some((r) => r.id === i.id)),
        ]
      : items.filter((i) => i.name.toLowerCase().includes(query) || (i.description && i.description.toLowerCase().includes(query)));
    return all;
  }, [items, recentItems, search]);

  const toggleItem = useCallback((item) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = { item, quantity: 1 };
      }
      return next;
    });
  }, []);

  const changeQty = useCallback((itemId, delta, maxStock) => {
    setSelectedMap((prev) => {
      const entry = prev[itemId];
      if (!entry) return prev;
      let newQty = entry.quantity + delta;
      if (newQty < 1) newQty = 1;
      if (maxStock !== undefined && maxStock > 0 && newQty > maxStock) {
        newQty = maxStock;
      }
      return {
        ...prev,
        [itemId]: { ...entry, quantity: newQty },
      };
    });
  }, []);

  const selectedCount = Object.keys(selectedMap).length;

  const totalSelectedValue = useMemo(() => {
    return Object.values(selectedMap).reduce((sum, { item, quantity }) => {
      return sum + (parseFloat(item.unit_price) || 0) * quantity;
    }, 0);
  }, [selectedMap]);

  const handleAdd = () => {
    const list = Object.values(selectedMap).map(({ item, quantity }) => ({
      ...item,
      quantity,
    }));
    onAddSelected(list);
    setSelectedMap({});
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSelectedMap({});
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Select From Inventory</Text>
            <Text style={[styles.subTitle, { color: colors.textTertiary }]}>Multi-select items to add</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search items by name or SKU..."
          />
        </View>

        {/* Item List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
          renderItem={({ item }) => {
            const isSelected = !!selectedMap[item.id];
            const selectedQty = selectedMap[item.id]?.quantity || 1;
            const isOutOfStock = item.stock_quantity <= 0;
            const isLowStock = !isOutOfStock && item.stock_quantity <= (item.min_stock_level || 0);

            return (
              <TouchableOpacity
                onPress={() => !isOutOfStock && toggleItem(item)}
                activeOpacity={isOutOfStock ? 1 : 0.7}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.borderLight },
                  isSelected && { backgroundColor: colors.surfaceVariant },
                  isOutOfStock && { opacity: 0.5 },
                ]}
              >
                <View style={styles.cardMain}>
                  {/* Checkbox */}
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: isSelected ? colors.primary : colors.textTertiary },
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                  >
                    {isSelected && <Icon name="check" size={14} color="#fff" />}
                  </View>

                  {/* Item Info */}
                  <View style={styles.itemInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.isRecent && !isOutOfStock && (
                        <View style={[styles.recentBadge, { backgroundColor: colors.primaryLight }]}>
                          <Icon name="history" size={10} color={colors.primary} />
                          <Text style={[styles.recentText, { color: colors.primary }]}>RECENT</Text>
                        </View>
                      )}
                    </View>

                    {item.description ? (
                      <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}

                    <View style={styles.priceRow}>
                      <View>
                        <Text style={[styles.itemPrice, { color: colors.primary }]}>
                          {formatCurrency(item.unit_price, currency)}
                        </Text>
                        <Text style={[styles.stockSubText, { color: isOutOfStock ? colors.error : colors.textTertiary }]}>
                          {isOutOfStock ? 'Out of stock' : `Stock: ${item.stock_quantity}`}
                        </Text>
                      </View>

                      {isSelected ? (
                        /* In-card compact stepper without expanding card height */
                        <View style={[styles.stepperWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              changeQty(item.id, -1, item.stock_quantity);
                            }}
                            style={styles.stepBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="minus" size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                          <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{selectedQty}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              changeQty(item.id, 1, item.stock_quantity);
                            }}
                            style={styles.stepBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Icon name="plus" size={14} color={colors.textPrimary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.stockBadge,
                            {
                              backgroundColor: isOutOfStock
                                ? colors.errorLight
                                : isLowStock
                                ? colors.warningLight || '#FEF3C7'
                                : colors.successLight || '#D1FAE5',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockText,
                              {
                                color: isOutOfStock
                                ? colors.error
                                : isLowStock
                                ? colors.warning || '#D97706'
                                : colors.success || '#059669',
                              },
                            ]}
                          >
                            {isOutOfStock ? 'OUT' : `${item.stock_quantity} left`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package-variant-closed" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No inventory items found</Text>
            </View>
          }
        />

        {/* Sticky Action Bottom Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderLight, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomSummary}>
            <Text style={[styles.countText, { color: colors.textPrimary }]}>
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </Text>
            <Text style={[styles.subtotalText, { color: colors.textSecondary }]}>
              {selectedCount > 0 ? `Total: ${formatCurrency(totalSelectedValue, currency)}` : 'Tap items to select'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            disabled={selectedCount === 0}
            style={[
              styles.addBtn,
              { backgroundColor: colors.primary },
              selectedCount === 0 && { opacity: 0.4 },
            ]}
          >
            <Icon name="check" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Selected ({selectedCount})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  itemCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  recentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recentText: {
    fontSize: 9,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    minHeight: 34,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stockSubText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    ...elevation.md,
  },
  bottomSummary: {
    flex: 1,
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtotalText: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default InventoryMultiPickerModal;
