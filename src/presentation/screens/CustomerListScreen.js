/**
 * CustomerListScreen - Manage customers
 */

import React, { useEffect, useCallback, useState, memo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { spacing, borderRadius, elevation } from '../../theme/spacing';
import { useCustomerStore } from '../../store/useCustomerStore';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getInitials, stringToColor } from '../../utils/helpers';
import { useDebounce } from '../../hooks/useDebounce';

// Memoized Customer Item for performance
const CustomerItem = memo(({ item, index, navigation, colors, onDelete }) => {
  const avatarColor = stringToColor(item.name);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(400)}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CustomerForm', { customerId: item.id })}
        activeOpacity={0.7}
        style={[styles.card, elevation.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor + '15' }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.contactRow}>
            {item.email ? (
              <View style={styles.contactItem}>
                <Icon name="email-outline" size={12} color={colors.textTertiary} />
                <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
              </View>
            ) : null}
            {item.phone ? (
              <View style={[styles.contactItem, { marginLeft: item.email ? 12 : 0 }]}>
                <Icon name="phone-outline" size={12} color={colors.textTertiary} />
                <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => onDelete(item.id)} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteBtn}
        >
          <Icon name="trash-can-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

const CustomerListScreen = ({ navigation }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const insets = useSafeAreaInsets();
  const { customers, isLoading, fetchCustomers, deleteCustomer } = useCustomerStore();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { fetchCustomers(debouncedSearch); }, [debouncedSearch, fetchCustomers]);
  
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchCustomers(search));
    return unsub;
  }, [navigation, search, fetchCustomers]);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteCustomer(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteCustomer]);

  const renderItem = useCallback(({ item, index }) => (
    <CustomerItem 
      item={item} 
      index={index} 
      navigation={navigation} 
      colors={colors} 
      onDelete={setDeleteId} 
    />
  ), [colors, navigation]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Customers</Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Your business directory</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CustomerForm')} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or email..." />
      </View>

      <FlatList 
        data={customers} 
        renderItem={renderItem} 
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 90,
          offset: 90 * index,
          index,
        })}
        ListEmptyComponent={
          <EmptyState 
            icon="account-group-outline" 
            title={search ? "No matches found" : "No customers yet"} 
            message={search ? "Try searching for a different name" : "Add your first customer to start invoicing"} 
            actionLabel={search ? null : "Add Customer"} 
            onAction={() => navigation.navigate('CustomerForm')} 
          />
        }
      />

      <ConfirmDialog 
        visible={!!deleteId} 
        onDismiss={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Customer" 
        message="Are you sure? This will not delete their past invoices but will remove them from your directory." 
        confirmLabel="Delete" 
        destructive 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', ...elevation.sm },
  searchContainer: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  listContent: { paddingBottom: 120, flexGrow: 1 },
  
  card: { 
    height: 82, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: spacing.base, 
    marginBottom: spacing.md, 
    padding: spacing.md, 
    borderRadius: borderRadius.xl, 
    borderWidth: 1,
    ...elevation.sm
  },
  avatar: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 16, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub: { fontSize: 12, fontWeight: '400' },
  deleteBtn: { padding: 8, marginLeft: spacing.xs },
});

export default CustomerListScreen;
