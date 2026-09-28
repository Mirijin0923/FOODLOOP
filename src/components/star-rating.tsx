import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/foodloop-theme';

export function StarRating({ value, onChange, readOnly = false }: { value: number; onChange?: (value: number) => void; readOnly?: boolean }) {
  return <View style={styles.row}>{[1, 2, 3, 4, 5].map((star) => {
    const icon = star <= value ? 'star' : 'star-outline';
    const content = <Ionicons name={icon} size={readOnly ? 14 : 28} color={colors.primary} />;
    return readOnly ? <View key={star}>{content}</View> : <Pressable key={star} onPress={() => onChange?.(star)} hitSlop={6}>{content}</Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' } });
