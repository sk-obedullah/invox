/**
 * CustomerListScreen - Manage customers
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { useCustomerStore } from '../../store/useCustomerStore';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import AppCard from '../components/common/AppCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getInitials, stringToColor } from '../../utils/helpers';
import { useDebounce } from '../../hooks/useDebounce';

const CustomerListScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const { customers, isLoading, fetchCustomers, deleteCustomer } = useCustomerStore();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { fetchCustomers(debouncedSearch); }, [debouncedSearch]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchCustomers(search));
    return unsub;
  }, [navigation]);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteCustomer(deleteId);
      setDeleteId(null);
    }
  }, [deleteId]);

  const renderItem = useCallback(({ item, index }) => {
    const avatarColor = stringToColor(item.name);
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CustomerForm', { customerId: item.id })}
          activeOpacity={0.7}
          style={[styles.card, elevation.sm, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
        >
          <View style={[styles.avatar, { backgroundColor: avatarColor + '20' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{getInitials(item.name)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.email ? <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.email}</Text> : null}
            {item.phone ? <Text style={[styles.sub, { color: colors.textTertiary }]}>{item.phone}</Text> : null}
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>Customers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerForm')} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Icon name="plus" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search customers..." />

      <FlatList data={customers} renderItem={renderItem} keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="account-group-outline" title="No customers" message="Add your first customer" actionLabel="Add Customer" onAction={() => navigation.navigate('CustomerForm')} />
        }
      />

      <ConfirmDialog visible={!!deleteId} onDismiss={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Customer" message="This will not delete related invoices." confirmLabel="Delete" destructive />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.base },
  title: { fontSize: 24, fontWeight: '700' },
  addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 40, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.base, marginBottom: spacing.md, padding: spacing.base, borderRadius: borderRadius.lg, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 15, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  sub: { fontSize: 12 },
});

export default CustomerListScreen;
