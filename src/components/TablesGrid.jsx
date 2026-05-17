import React from 'react';
import { View, StyleSheet } from 'react-native';
import TableCard from './TableCard';

export default function TablesGrid({ items, onItemPress }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <TableCard
          key={item.id}
          number={item.number}
          status={item.status}
          showBadge={item.showBadge}
          onPress={() => onItemPress?.(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
