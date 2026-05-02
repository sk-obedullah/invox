/**
 * SearchBar - Animated search input
 */

import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme';
import { spacing, borderRadius } from '../../../theme/spacing';

const SearchBar = ({ value, onChangeText, placeholder = 'Search...', onClear, style }) => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        styles.container,
        { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight },
        style,
      ]}
    >
      <Icon name="magnify" size={20} color={colors.placeholder} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, { color: colors.textPrimary }]}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <TouchableOpacity
          onPress={onClear || (() => onChangeText(''))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close-circle" size={18} color={colors.placeholder} />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 44,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: 0,
  },
});

export default React.memo(SearchBar);
