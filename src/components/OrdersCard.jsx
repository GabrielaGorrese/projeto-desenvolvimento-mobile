import React from 'react';
import { View, StyleSheet } from 'react-native';
import OrderItem from './OrderItem';
import { colors } from '../theme/colors';

export default function OrdersCard({ items, onEditItem }) {
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <OrderItem
          key={item.id}
          name={item.name}
          quantity={item.quantity}
          unitPrice={item.unitPrice}
          totalPrice={item.totalPrice}
          imageUri={item.imageUri}
          showDivider={index > 0}
          onEditPress={() => onEditItem?.(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
