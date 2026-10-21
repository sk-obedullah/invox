/**
 * ItemListScreen - Manage predefined items (products/services)
 */

import React, { useEffect, useCallback, useState, useMemo, memo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import useItemStore from '../../store/useItemStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchBar from '../components/common/SearchBar';
import { formatCurrency } from '../../utils/formatters';

// Memoized Item Component for peak performance
const InventoryItem = memo(({ item, index, navigation, colors, currency, enableTax, onDelete }) => {
  const profit = (item.unit_price || 0) - (item.purchase_price || 0);
  const profitMargin = item.unit_price > 0 ? ((profit / item.unit_price) * 100).toFixed(0) : 0;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(400)}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ItemForm', { itemId: item.id })}
        activeOpacity={0.7}
        style={[styles.card, elevation.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Icon name="tag-outline" size={22} color={colors.primary} />
        </View>
        
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            <View style={styles.badgeContainer}>
              {item.stock_quantity <= (item.min_stock_level || 0) && (
                <View style={[styles.statusBadge, { backgroundColor: item.stock_quantity <= 0 ? colors.errorLight : colors.warningLight }]}>
                   <Icon name={item.stock_quantity <= 0 ? "alert-circle" : "alert-outline"} size={10} color={item.stock_quantity <= 0 ? colors.error : colors.warning} />
                   <Text style={[styles.statusText, { color: item.stock_quantity <= 0 ? colors.error : colors.warning }]}>
                     {item.stock_quantity <= 0 ? "OUT" : "LOW"}
                   </Text>
                </View>
              )}
              {profitMargin > 0 && (
                <View style={[styles.profitBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.profitText, { color: colors.primary }]}>{profitMargin}%</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.textPrimary }]}>
              {formatCurrency(item.unit_price, currency)}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: colors.surfaceVariant }]}>
               <Text style={[styles.stockText, { color: colors.textSecondary }]}>
                 Stock: <Text style={{ fontWeight: '800', color: item.stock_quantity <= (item.min_stock_level || 0) ? colors.error : colors.textPrimary }}>{item.stock_quantity || 0}</Text>
               </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              Cost: {formatCurrency(item.purchase_price, currency)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => onDelete(item.id)} 
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

const ItemListScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const { items, isLoading, fetchItems, deleteItem } = useItemStore();
  const settings = useSettingsStore();
  
  const [deleteId, setDeleteId] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchItems());
    return unsub;
  }, [navigation, fetchItems]);

  // Efficient Filtering logic
  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const lower = searchText.toLowerCase();
    return items.filter(i => 
      i.name.toLowerCase().includes(lower) || 
      (i.description && i.description.toLowerCase().includes(lower))
    );
  }, [items, searchText]);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteItem(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteItem]);

  const renderItem = useCallback(({ item, index }) => (
    <InventoryItem 
      item={item} 
      index={index}
      navigation={navigation}
      colors={colors}
      currency={settings.default_currency}
      enableTax={settings.enable_tax}
      onDelete={setDeleteId}
    />
  ), [colors, navigation, settings.default_currency, settings.enable_tax]);

  // Key extractor for FlatList optimization
  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Manage your products & services</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('ArchivedItems')} style={[styles.iconBtn, { marginRight: spacing.sm }]}>
            <Icon name="archive-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ItemForm')} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Icon name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar 
          value={searchText} 
          onChangeText={setSearchText} 
          placeholder="Search products..." 
        />
      </View>

      <FlatList 
        data={filteredItems} 
        renderItem={renderItem} 
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
        // Performance Props for Large Lists
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 120, // Approximate height of our card
          offset: 120 * index,
          index,
        })}
        ListEmptyComponent={
          <EmptyState 
            icon="package-variant" 
            title={searchText ? "No matches found" : "Your inventory is empty"} 
            message={searchText ? "Try a different search term" : "Add your first product or service to start invoicing faster"} 
            actionLabel={searchText ? null : "Add New Item"} 
            onAction={() => navigation.navigate('ItemForm')} 
          />
        }
      />

      <ConfirmDialog 
        visible={!!deleteId} 
        onDismiss={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Item" 
        message="Are you sure you want to delete this item? This cannot be undone." 
        confirmLabel="Delete" 
        destructive 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', ...elevation.sm },
  searchContainer: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  listContent: { paddingBottom: 120, flexGrow: 1 },
  
  card: { 
    height: 110, // Fixed height for FlatList optimization
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: spacing.base, 
    marginBottom: spacing.md, 
    padding: spacing.md, 
    borderRadius: borderRadius.xl, 
    borderWidth: 1,
    ...elevation.sm
  },
  avatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  badgeContainer: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  profitBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  profitText: { fontSize: 10, fontWeight: '800' },
  
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '800' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stockText: { fontSize: 11, fontWeight: '600' },

  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 8, marginLeft: spacing.xs },
});

export default ItemListScreen;
