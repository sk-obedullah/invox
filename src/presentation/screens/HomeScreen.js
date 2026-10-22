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
import PdfService from '../../services/PdfService';

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

  // Fine-grained Zustand selectors for minimal re-renders
  const invoices = useInvoiceStore((s) => s.invoices);
  const stats = useInvoiceStore((s) => s.stats);
  const total = useInvoiceStore((s) => s.total);
  const isLoading = useInvoiceStore((s) => s.isLoading);
  const isRefreshing = useInvoiceStore((s) => s.isRefreshing);
  const filters = useInvoiceStore((s) => s.filters);
  const fetchInvoices = useInvoiceStore((s) => s.fetchInvoices);
  const fetchStats = useInvoiceStore((s) => s.fetchStats);
  const setFilters = useInvoiceStore((s) => s.setFilters);
  const loadMore = useInvoiceStore((s) => s.loadMore);

  const companyName = useSettingsStore((s) => s.company_name);
  const defaultCurrency = useSettingsStore((s) => s.default_currency);
  const enableAnalytics = useSettingsStore((s) => s.enable_analytics);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 400);

  useEffect(() => { 
    fetchInvoices(true); 
    fetchStats(); 
    PdfService.cleanupCache(); // Lightweight: Clean old PDFs on startup
  }, [fetchInvoices, fetchStats]);

  useEffect(() => { 
    setFilters({ search: debouncedSearch }); 
  }, [debouncedSearch, setFilters]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      fetchInvoices(true); 
      fetchStats();
    });
    return unsub;
  }, [navigation, fetchInvoices, fetchStats]);

  const onInvoicePress = useCallback((inv) => navigation.navigate('InvoiceDetail', { invoiceId: inv.id }), [navigation]);
  const onCreatePress = useCallback(() => navigation.navigate('CreateInvoice'), [navigation]);
  const onFilterPress = useCallback((s) => setFilters({ status: s === filters.status ? null : s }), [filters.status, setFilters]);

  const renderItem = useCallback(({ item, index }) => (
    <InvoiceCard invoice={item} onPress={onInvoicePress} index={index} />
  ), [onInvoicePress]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const ListHeader = useMemo(() => (
    <View>
      {enableAnalytics && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.9}
            style={[styles.dashboardCard, { backgroundColor: colors.primary }]}
          >
            <View style={styles.dashboardCardContent}>
              <View>
                <Text style={styles.dashboardCardLabel}>Business Insights</Text>
                <Text style={styles.dashboardCardTitle}>View Profit & Sales Analytics</Text>
              </View>
              <View style={[styles.dashboardIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Icon name="chart-line" size={24} color="#FFF" />
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.7)" style={styles.dashboardArrow} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {stats && (
        <Animated.View entering={FadeIn.duration(600)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.statLabel, { color: colors.primary }]}>Total</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total_invoices || 0}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.statLabel, { color: colors.success }]}>Paid</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(stats.total_paid || 0, defaultCurrency)}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.warningLight }]}>
              <Text style={[styles.statLabel, { color: colors.warning }]}>Pending</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>{formatCurrency(stats.total_pending || 0, defaultCurrency)}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.statLabel, { color: colors.error }]}>Overdue</Text>
              <Text style={[styles.statValue, { color: colors.error }]}>{formatCurrency(stats.total_overdue || 0, defaultCurrency)}</Text>
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
            const active = filters.status === item.key;
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
        <Text style={[styles.resultCountText, { color: colors.textTertiary }]}>{total} invoice{total !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  ), [enableAnalytics, navigation, stats, searchText, filters.status, total, colors, defaultCurrency, onFilterPress]);

  const renderEmpty = useCallback(() => isLoading ? <InvoiceListSkeleton /> : (
    <EmptyState icon="file-document-plus-outline" title="No invoices yet" message="Create your first invoice" actionLabel="Create Invoice" onAction={onCreatePress} />
  ), [isLoading, onCreatePress]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{companyName || 'Invox'}</Text>
        </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ArchivedInvoices')} 
              style={styles.archiveBtn}
            >
              <Icon name="archive-clock-outline" size={moderateScale(24)} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('EditSettings')}
              style={[styles.profileBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Icon name="cog-outline" size={moderateScale(20)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
      </Animated.View>
      <FlatList 
        data={invoices} 
        renderItem={renderItem} 
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader} 
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore} 
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => fetchInvoices(true)} 
            tintColor={colors.primary} 
            colors={[colors.primary]} 
          />
        }
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
        // Performance Optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 130, // Approximate height of InvoiceCard
          offset: 130 * index + 450, // 450 is approx height of ListHeader
          index,
        })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  archiveBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: { fontSize: moderateFontScale(13), fontWeight: '400', marginBottom: 2 },
  title: { fontSize: moderateFontScale(24), fontWeight: '700', letterSpacing: -0.3 },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  dashboardBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  dashboardCard: { marginHorizontal: spacing.base, padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.lg, ...elevation.md },
  dashboardCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dashboardCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  dashboardCardTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  dashboardIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  dashboardArrow: { alignSelf: 'flex-end', marginTop: 8 },
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
  listContent: { paddingBottom: 120, flexGrow: 1 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  fabInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default HomeScreen;
