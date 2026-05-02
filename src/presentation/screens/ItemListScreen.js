/**
 * ItemListScreen - Manage predefined items (products/services)
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import useItemStore from '../../store/useItemStore';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ItemListScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const { items, isLoading, fetchItems, deleteItem } = useItemStore();
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchItems());
    return unsub;
  }, [navigation]);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteItem(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteItem]);

  const renderItem = useCallback(({ item, index }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ItemForm', { itemId: item.id })}
          activeOpacity={0.7}
          style={[styles.card, elevation.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
            <Icon name="tag-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.description ? <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text> : null}
            <Text style={[styles.price, { color: colors.primary }]}>{item.unit_price ? item.unit_price.toFixed(2) : '0.00'} (Tax: {item.tax_rate}%)</Text>
          </View>
          <TouchableOpacity onPress={() => setDeleteId(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="delete-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [colors, navigation]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Items</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ItemForm')} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Icon name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList data={items} renderItem={renderItem} keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="tag-multiple-outline" title="No items" message="Add your first predefined item or service" actionLabel="Add Item" onAction={() => navigation.navigate('ItemForm')} />
        }
      />

      <ConfirmDialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Item" message="Are you sure you want to delete this item?" confirmLabel="Delete" destructive />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  title: { fontSize: 24, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 40, flexGrow: 1, paddingTop: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.base, marginBottom: spacing.md, padding: spacing.base, borderRadius: borderRadius.lg, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  info: { flex: 1, paddingRight: spacing.sm },
  name: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  sub: { fontSize: 12, marginBottom: 2 },
  price: { fontSize: 12, fontWeight: '600' },
});

export default ItemListScreen;
