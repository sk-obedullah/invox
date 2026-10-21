/**
 * ArchivedInvoicesScreen - View and restore archived invoices
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import InvoiceRepository from '../../data/repositories/InvoiceRepository';
import { formatCurrency } from '../../utils/formatters';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import EmptyState from '../components/common/EmptyState';

const ArchivedInvoicesScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const { fetchInvoices, fetchStats } = useInvoiceStore();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = useCallback(async () => {
    try {
      const results = await InvoiceRepository.getArchived();
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
      await InvoiceRepository.restore(id);
      Alert.alert('Restored', 'Invoice has been moved back to active list.');
      fetchArchived();
      fetchInvoices(true); // Refresh main list
      fetchStats(); // Refresh dashboard stats if needed
    } catch (err) {
      Alert.alert('Error', 'Failed to restore invoice.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id, isArchived: true })}
    >
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.invNumber, { color: colors.primary }]}>#{item.invoice_number}</Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{item.issue_date}</Text>
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{item.customer_name}</Text>
        <Text style={[styles.total, { color: colors.textSecondary }]}>
          {formatCurrency(item.total, item.currency || settings.default_currency)}
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Invoice Vault</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList 
        data={items}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState 
            icon="archive-clock-outline" 
            title="Invoice Archive is Empty" 
            message="Archived invoices are stored here to keep your history clean and accessible." 
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, marginRight: spacing.md },
  invNumber: { fontSize: 12, fontWeight: '800' },
  date: { fontSize: 11 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  total: { fontSize: 13, fontWeight: '600' },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  restoreText: { fontSize: 11, fontWeight: '800' },
});

export default ArchivedInvoicesScreen;
