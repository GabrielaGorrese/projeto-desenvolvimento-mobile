import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

function formatPrice(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export default function OrderItem({
  name,
  quantity,
  unitPrice,
  totalPrice,
  imageUri,
  onEditPress,
  showDivider = false,
}) {
  return (
    <View>
      {showDivider && <View style={styles.divider} />}
      <View style={styles.row}>
        <Image
          source={imageUri ? { uri: imageUri } : undefined}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            <Text style={styles.price}>{formatPrice(totalPrice)}</Text>
          </View>
          <Text style={styles.quantity}>
            Qtd: {quantity} x {formatPrice(unitPrice)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Editar item"
        >
          <Ionicons name="pencil" size={10} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  image: {
    width: 53,
    height: 53,
    borderRadius: 8,
    backgroundColor: colors.chipBackground,
    marginRight: 12,
  },
  details: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.sectionTitle,
    lineHeight: 15,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.priceAccent,
    textAlign: 'right',
  },
  quantity: {
    fontSize: 10,
    color: colors.placeholder,
    marginTop: 6,
    lineHeight: 12,
  },
  editButton: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
});
