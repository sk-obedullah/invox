/**
 * ArchivedItemsScreen - View and restore archived products
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import ItemRepository from '../../data/repositories/ItemRepository';
import { formatCurrency } from '../../utils/formatters';
import { useSettingsStore } from '../../store/useSettingsStore';
import useItemStore from '../../store/useItemStore';
import EmptyState from '../components/common/EmptyState';

const ArchivedItemsScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const { fetchItems } = useItemStore();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = useCallback(async () => {
    try {
      const results = await ItemRepository.getArchived();
      setItems(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleRestore = async (id) => {
    try {
      await ItemRepository.restore(id);
      Alert.alert('Restored', 'Product has been moved back to active inventory.');
      fetchArchived();
      fetchItems(); // Refresh main list too
    } catch (err) {
      Alert.alert('Error', 'Failed to restore item.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={() => navigation.navigate('ItemForm', { itemId: item.id, isArchived: true })}
    >
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.sub, { color: colors.textTertiary }]}>
          Last Price: {formatCurrency(item.unit_price, settings.default_currency)}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => handleRestore(item.id)} 
        style={[styles.restoreBtn, { backgroundColor: colors.primaryLight }]}
      >
        <Icon name="backup-restore" size={20} color={colors.primary} />
        <Text style={[styles.restoreText, { color: colors.primary }]}>RESTORE</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Archive Vault</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList 
        data={items}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState 
            icon="archive-off-outline" 
            title="Archive is Empty" 
            message="Items you delete from inventory will appear here for historical reference." 
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: spacing.base },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md, borderWidth: 1 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 12 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  restoreText: { fontSize: 11, fontWeight: '800' },
});

export default ArchivedItemsScreen;
