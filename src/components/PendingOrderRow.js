import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadow, typography } from '../theme';

export default function PendingOrderRow({ order, onPress, onDeliverItem, onDeliverAll, isNew, partial }) {
  const [busyAll, setBusyAll] = useState(false);
  const [busyItems, setBusyItems] = useState([]);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const bg =
    order.color_status === 'red'
      ? colors.statusRed
      : order.color_status === 'yellow'
        ? colors.statusYellow
        : colors.statusGreen;

  const label = String(order.daily_number ?? order.id).padStart(2, '0');
  const pendingItems = (order.items || []).filter((it) => !it.delivered);

  const created = order.created_at ? new Date(order.created_at) : null;
  const timeStr = created && !isNaN(created)
    ? created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  async function deliverOne(itemId) {
    if (!onDeliverItem || !itemId || busyAll || busyItems.includes(itemId)) return;
    setBusyItems((prev) => [...prev, itemId]);
    try {
      await onDeliverItem(order.id, itemId);
    } finally {
      if (mountedRef.current) setBusyItems((prev) => prev.filter((x) => x !== itemId));
    }
  }

  async function deliverEverything() {
    if (!onDeliverAll || busyAll) return;
    setBusyAll(true);
    try {
      await onDeliverAll(order.id);
    } finally {
      if (mountedRef.current) setBusyAll(false);
    }
  }

  function Divider() {
    return <View style={styles.divider} />;
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.95 }]}
    >
      <View style={styles.left}>
        <View style={[styles.numBox, { backgroundColor: bg }]}>
          <Text
            style={styles.num}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
          >
            {label}
          </Text>
          {partial ? (
            <View style={styles.partial}>
              <Text style={styles.partialText}>PARCIAL</Text>
            </View>
          ) : null}
          
          
          {isNew ? (
            <View style={styles.star}>
              <Image source={require('../../assets/novo.png')} style={styles.newBadge} resizeMode="contain" />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.items}>
        {pendingItems.length === 0 ? (
          <Text style={styles.emptyItem}>Sem itens pendentes</Text>
        ) : (
          <>
            {pendingItems.map((it, idx) => {
              const busy = busyItems.includes(it.id);
              const last = idx === pendingItems.length - 1;
              return (
                <View key={it.id ?? idx} style={[styles.itemRow, !last && styles.itemDivider]}>
                  <View style={styles.itemThumb}>
                    {it.image ? (
                      <Image source={{ uri: it.image }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <Feather name="image" size={22} color="#B8B1AA" />
                    )}
                  </View>
                  <Text style={styles.itemText}>
                    {it.product_name}
                    {Number(it.quantity) > 1 ? (
                      <Text style={styles.itemQty}>{`  ×${it.quantity}`}</Text>
                    ) : ''}
                  </Text>
                  <Pressable
                    onPress={() => deliverOne(it.id)}
                    hitSlop={8}
                    android_ripple={{ color: 'rgba(204,126,74,0.14)', borderless: false }}
                    style={({ pressed }) => [styles.checkBtn, (busy || busyAll || pressed) && { opacity: 0.7 }]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Feather name="check" size={22} color={colors.primary} />
                    )}
                  </Pressable>
                </View>

              );
            })}

            <Divider />

            <View style={styles.bottomRow}>
            {timeStr ? (
            <View style={styles.timeRow}>
              <Feather name="clock" size={20} color={colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>
          ) : null}

            {pendingItems.length > 1 ? (
              <Pressable
                onPress={deliverEverything}
                android_ripple={{ color: 'rgba(204,126,74,0.14)' }}
                style={({ pressed }) => [styles.deliverAllBtn, (busyAll || pressed) && { opacity: 0.85 }]}
              >
                {busyAll ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Feather name="check-circle" size={18} color={colors.primary} />
                    <Text style={styles.deliverAllText}>Entregar todos</Text>
                  </>
                )}
              </Pressable>
            ) : null}
            </View>

          </>
        )}
      </View>

      <Feather name="chevron-right" size={22} color={colors.textMuted} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.bgLight,
    borderRadius: radii.lg,
    paddingRight: 8,
    marginHorizontal: 6,
    marginBottom: 12,
    ...shadow.card,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    minHeight: 48,
  },
  left: { alignItems: 'center', width: 66, alignSelf: 'stretch' },
  numBox: {
    width: 74,
    flex: 1,
    minHeight: 128,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chevron: { alignSelf: 'center', marginLeft: 6 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginTop: -3
  },
  timeText: { color: '#464646', fontSize: 18, fontWeight: '400', textAlign: 'center' },
  num: {
    ...typography.h2,
    color: colors.textOnDark,
    fontWeight: '900',
    fontSize: 32,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingBottom: 16
  },
  star: { position: 'absolute', top: 3, right: 3 },
  newBadge: { width: 28, height: 28 },
  partial: {
    position: 'absolute',
    bottom: 6,
    width: '85%',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 2,
    alignItems: 'center',
    alignSelf: 'center'
  },
  partialText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  items: { flex: 1, marginLeft: 16, marginRight: 6, paddingVertical: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6DE',
  },
  itemThumb: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: '#F0ECE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6DED6',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemText: {
    flex: 1,
    ...typography.body,
    color: colors.textDark,
    fontSize: 26,
    fontWeight: '800',
  },
  itemQty: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 24,
  },
  checkBtn: {
    width: 46,
    height: 46,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  deliverAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 0,
    overflow: 'hidden',
    marginBottom: 16
  },
  deliverAllText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  emptyItem: { color: colors.textMuted, fontStyle: 'italic', fontSize: 17 },
  divider: {
    height: 2,
    backgroundColor: '#F0EBE4',
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
});
