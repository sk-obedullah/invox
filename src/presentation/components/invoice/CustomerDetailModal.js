/**
 * CustomerDetailModal - Clean bottom sheet to view full details of selected customer
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, elevation } from '../../../theme/spacing';

const CustomerDetailModal = ({
  visible,
  customer,
  onClose,
  onChangeCustomer,
  onRemoveCustomer,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  if (!customer) return null;

  const initials = (customer.customer_name || customer.name || 'C')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                {customer.customer_name || customer.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Details Body */}
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Phone */}
            {(customer.customer_phone || customer.phone) ? (
              <View style={[styles.detailRow, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                  <Icon name="phone" size={18} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>PHONE NUMBER</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {customer.customer_phone || customer.phone}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Email */}
            {(customer.customer_email || customer.email) ? (
              <View style={[styles.detailRow, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                  <Icon name="email-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>EMAIL ADDRESS</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {customer.customer_email || customer.email}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Address */}
            {(customer.customer_address || customer.address) ? (
              <View style={[styles.detailRow, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                  <Icon name="map-marker-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>BILLING ADDRESS</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary, lineHeight: 20 }]}>
                    {customer.customer_address || customer.address}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* GSTIN */}
            {customer.gstin ? (
              <View style={[styles.detailRow, { backgroundColor: colors.surfaceVariant }]}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                  <Icon name="card-account-details-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>GSTIN / TAX ID</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                    {customer.gstin}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onRemoveCustomer();
              }}
              style={[styles.removeBtn, { backgroundColor: colors.errorLight }]}
            >
              <Icon name="account-remove-outline" size={18} color={colors.error} />
              <Text style={[styles.removeBtnText, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                onChangeCustomer();
              }}
              style={[styles.changeBtn, { backgroundColor: colors.primary }]}
            >
              <Icon name="account-switch-outline" size={18} color="#fff" />
              <Text style={styles.changeBtnText}>Change Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    ...elevation.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  customerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  removeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  changeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomerDetailModal;
