/**
 * HomeScreen - Invoice List with stats, search, and filters
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, StatusBar,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { moderateScale, moderateFontScale } from '../../utils/responsive';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import InvoiceCard from '../components/invoice/InvoiceCard';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import { InvoiceListSkeleton } from '../components/common/SkeletonLoader';
import { formatCurrency } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { INVOICE_STATUS } from '../../constants/invoiceStatus';

const FILTER_TABS = [
  { key: null, label: 'All' },
  { key: INVOICE_STATUS.DRAFT, label: 'Drafts' },
  { key: INVOICE_STATUS.SENT, label: 'Sent' },
  { key: INVOICE_STATUS.PAID, label: 'Paid' },
  { key: INVOICE_STATUS.OVERDUE, label: 'Overdue' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const HomeScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const store = useInvoiceStore();
  const companyName = useSettingsStore((s) => s.company_name);
  const defaultCurrency = useSettingsStore((s) => s.default_currency);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  useEffect(() => { store.fetchInvoices(true); store.fetchStats(); }, []);
  useEffect(() => { store.setFilters({ search: debouncedSearch }); }, [debouncedSearch]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      store.fetchInvoices(true); store.fetchStats();
    });
    return unsub;
  }, [navigation]);

  const onInvoicePress = useCallback((inv) => navigation.navigate('InvoiceDetail', { invoiceId: inv.id }), [navigation]);
  const onCreatePress = useCallback(() => navigation.navigate('CreateInvoice'), [navigation]);
  const onFilterPress = useCallback((s) => store.setFilters({ status: s === store.filters.status ? null : s }), [store.filters.status]);

  const renderItem = useCallback(({ item, index }) => (
    <InvoiceCard invoice={item} onPress={onInvoicePress} index={index} />
  ), [onInvoicePress]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = useMemo(() => (
    <View>
      {store.stats && (
        <Animated.View entering={FadeIn.duration(600)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.statLabel, { color: colors.primary }]}>Total</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{store.stats.total_invoices || 0}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.statLabel, { color: colors.success }]}>Paid</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(store.stats.total_paid || 0, defaultCurrency)}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.statLabel, { color: colors.warning }]}>Pending</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>{formatCurrency(store.stats.total_pending || 0, defaultCurrency)}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.statLabel, { color: colors.error }]}>Overdue</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>{formatCurrency(store.stats.total_overdue || 0, defaultCurrency)}</Text>
            </View>
          </View>
        </Animated.View>
      )}
      <SearchBar value={searchText} onChangeText={setSearchText} placeholder="Search invoices..." />
      <View style={styles.filterContainer}>
        <FlatList
          horizontal data={FILTER_TABS} showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList} keyExtractor={(i) => String(i.key)}
          renderItem={({ item }) => {
            const active = store.filters.status === item.key;
            return (
              <TouchableOpacity onPress={() => onFilterPress(item.key)}
                style={[styles.filterTab, { backgroundColor: active ? colors.primary : colors.surfaceVariant, borderColor: active ? colors.primary : colors.borderLight }]}>
                <Text style={[styles.filterTabText, { color: active ? '#FFF' : colors.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
      <View style={styles.resultCount}>
        <Text style={[styles.resultCountText, { color: colors.textTertiary }]}>{store.total} invoice{store.total !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  ), [store.stats, searchText, store.filters.status, store.total, colors, defaultCurrency]);

  const renderEmpty = useCallback(() => store.isLoading ? <InvoiceListSkeleton /> : (
    <EmptyState icon="file-document-plus-outline" title="No invoices yet" message="Create your first invoice" actionLabel="Create Invoice" onAction={onCreatePress} />
  ), [store.isLoading, onCreatePress]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{companyName || 'Invox'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={[styles.settingsBtn, { backgroundColor: colors.surfaceVariant }]}>
          <Icon name="cog-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
      <FlatList data={store.invoices} renderItem={renderItem} keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader} ListEmptyComponent={renderEmpty}
        onEndReached={store.loadMore} onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={store.isRefreshing} onRefresh={() => store.fetchInvoices(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
        removeClippedSubviews maxToRenderPerBatch={10} windowSize={5}
      />
      <Animated.View entering={FadeIn.delay(300).duration(400)} style={[styles.fab, elevation.lg, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={onCreatePress} style={styles.fabInner} activeOpacity={0.8}>
          <Icon name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  greeting: { fontSize: moderateFontScale(13), fontWeight: '400', marginBottom: 2 },
  title: { fontSize: moderateFontScale(24), fontWeight: '700', letterSpacing: -0.3 },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { paddingHorizontal: spacing.base, marginBottom: spacing.base },
  statsRow: { flexDirection: 'row', gap: moderateScale(spacing.md), marginBottom: moderateScale(spacing.md), flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 140, padding: moderateScale(spacing.base), borderRadius: borderRadius.lg },
  statLabel: { fontSize: moderateFontScale(12), fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: moderateFontScale(16), fontWeight: '700' },
  filterContainer: { marginBottom: spacing.sm },
  filterList: { paddingHorizontal: spacing.base, gap: spacing.sm },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1 },
  filterTabText: { fontSize: moderateFontScale(13), fontWeight: '500' },
  resultCount: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  resultCountText: { fontSize: moderateFontScale(12) },
  listContent: { paddingBottom: 100, flexGrow: 1 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  fabInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default HomeScreen;
