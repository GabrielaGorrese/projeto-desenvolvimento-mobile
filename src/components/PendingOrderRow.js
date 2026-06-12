import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadow, typography } from '../theme';

const DELIVER_GREEN = '#1E9E54';

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
              <Feather name="star" size={16} color={colors.statusYellow} />
            </View>
          ) : null}
        </View>
        {timeStr ? (
          <View style={styles.timeRow}>
            <Feather name="clock" size={12} color={colors.textMuted} />
            <Text style={styles.timeText}>{timeStr}</Text>
          </View>
        ) : null}
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
                  <View style={styles.bullet} />
                  <Text style={styles.itemText}>
                    {it.product_name}
                    {Number(it.quantity) > 1 ? (
                      <Text style={styles.itemQty}>{`  ×${it.quantity}`}</Text>
                    ) : ''}
                  </Text>
                  <Pressable
                    onPress={() => deliverOne(it.id)}
                    hitSlop={8}
                    android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
                    style={({ pressed }) => [styles.checkBtn, (busy || busyAll || pressed) && { opacity: 0.7 }]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Feather name="check" size={18} color="#FFF" />
                    )}
                  </Pressable>
                </View>
              );
            })}

            {pendingItems.length > 1 ? (
              <Pressable
                onPress={deliverEverything}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
                style={({ pressed }) => [styles.deliverAllBtn, (busyAll || pressed) && { opacity: 0.85 }]}
              >
                {busyAll ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={17} color="#FFF" />
                    <Text style={styles.deliverAllText}>Entregar todos</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <Feather name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 8,
    marginHorizontal: 6,
    marginBottom: 12,
    ...shadow.card,
  },
  left: { alignItems: 'center', width: 66 },
  numBox: {
    width: 66,
    height: 78,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  timeText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  num: {
    ...typography.h2,
    color: colors.textOnDark,
    fontWeight: '900',
    fontSize: 28,
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  star: { position: 'absolute', top: 3, right: 3 },
  partial: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  partialText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  items: { flex: 1, marginLeft: 16, marginRight: 6, paddingVertical: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6DE',
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    ...typography.body,
    color: colors.textDark,
    fontSize: 16,
    lineHeight: 22,
  },
  itemQty: {
    color: colors.primary,
    fontWeight: '800',
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: DELIVER_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    overflow: 'hidden',
  },
  deliverAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    minHeight: 38,
    backgroundColor: DELIVER_GREEN,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  deliverAllText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  emptyItem: { color: colors.textMuted, fontStyle: 'italic', fontSize: 15 },
});
