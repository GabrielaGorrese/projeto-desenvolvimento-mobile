import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadow, typography } from '../theme';
import { getRowScale } from '../utils/uiScale';

export default function PendingOrderRow({ order, onPress, onDeliverItem, onDeliverAll, isNew, partial }) {
  const { width, height } = useWindowDimensions();
  const { scale, textScale, btnScale } = getRowScale(width, height);

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
    return <View style={[styles.divider, { marginVertical: 4 * scale }]} />;
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [
        styles.row,
        {
          borderRadius: radii.lg * scale,
          marginHorizontal: 1 * scale,
          marginBottom: 8 * scale,
          paddingRight: 6 * scale,
        },
        pressed && { opacity: 0.95 }
      ]}
    >
      <View style={[styles.left, { width: 54 * scale }]}>
        <View style={[
          styles.numBox,
          {
            backgroundColor: bg,
            width: 58 * scale,
            minHeight: 82 * scale,
            borderTopLeftRadius: radii.md * scale,
            borderBottomLeftRadius: radii.md * scale,
          }
        ]}>
          <Text
            style={[
              styles.num,
              {
                fontSize: 22 * textScale,
                paddingBottom: 8 * scale,
                paddingHorizontal: 2 * scale,
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {label}
          </Text>

          {partial ? (
            <View style={[
              styles.partial,
              {
                bottom: 4 * scale,
                borderRadius: 3 * scale,
                paddingVertical: 2 * scale,
              }
            ]}>
              <Text style={[styles.partialText, { fontSize: 7 * textScale }]}>
                PARCIAL
              </Text>
            </View>
          ) : null}

          {isNew ? (
            <View style={[styles.star, { top: 2 * scale, right: 2 * scale }]}>
              <Image
                source={require('../../assets/novo.png')}
                style={{ width: 18 * scale, height: 18 * scale }}
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.items, { marginLeft: 10 * scale, marginRight: 4 * scale }]}>
        {pendingItems.length === 0 ? (
          <Text style={[styles.emptyItem, { fontSize: 12 * textScale }]}>
            Sem itens pendentes
          </Text>
        ) : (
          <>
            {pendingItems.map((it, idx) => {
              const busy = busyItems.includes(it.id);
              const last = idx === pendingItems.length - 1;
              return (
                <View
                  key={it.id ?? idx}
                  style={[
                    styles.itemRow,
                    { paddingVertical: 5 * scale },
                    !last && styles.itemDivider
                  ]}
                >
                  <View style={[
                    styles.itemThumb,
                    {
                      width: 46 * scale,
                      height: 46 * scale,
                      borderRadius: radii.md * scale,
                      marginRight: 8 * scale,
                    }
                  ]}>
                    {it.image ? (
                      <Image source={{ uri: it.image }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <Feather name="image" size={16 * scale} color="#B8B1AA" />
                    )}
                  </View>

                  <Text
                    numberOfLines={2}
                    style={[
                      styles.itemText,
                      { fontSize: 15 * textScale }
                    ]}
                  >
                    {it.product_name}
                    {Number(it.quantity) > 1 ? (
                      <Text style={[styles.itemQty, { fontSize: 13 * textScale }]}>
                        {`  ×${it.quantity}`}
                      </Text>
                    ) : ''}
                  </Text>

                  <Pressable
                    onPress={() => deliverOne(it.id)}
                    hitSlop={6}
                    android_ripple={{ color: 'rgba(204,126,74,0.14)', borderless: false }}
                    style={({ pressed }) => [
                      styles.checkBtn,
                      {
                        width: 32 * btnScale,
                        height: 32 * btnScale,
                        borderRadius: 20 * btnScale,
                        marginLeft: 4 * scale,
                        marginRight: 4 * scale,
                      },
                      (busy || busyAll || pressed) && { opacity: 0.7 }
                    ]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Feather name="check" size={16 * btnScale} color={colors.primary} />
                    )}
                  </Pressable>
                </View>
              );
            })}

            <Divider />

            <View style={[
              styles.bottomRow,
              {
                marginTop: 4 * scale,
                minHeight: 30 * scale,
              }
            ]}>
              {timeStr ? (
                <View style={styles.timeRow}>
                  <Feather name="clock" size={14 * scale} color={colors.textMuted} style={{ marginRight: 4 * scale }} />
                  <Text style={[styles.timeText, { fontSize: 12 * textScale }]}>
                    {timeStr}
                  </Text>
                </View>
              ) : null}

              {pendingItems.length > 1 ? (
                <Pressable
                  onPress={deliverEverything}
                  android_ripple={{ color: 'rgba(204,126,74,0.14)' }}
                  style={({ pressed }) => [
                    styles.deliverAllBtn,
                    {
                      borderRadius: radii.md * scale,
                      paddingHorizontal: 10 * scale,
                      paddingVertical: 5 * scale,
                      marginBottom: 6 * scale,
                    },
                    (busyAll || pressed) && { opacity: 0.85 }
                  ]}
                >
                  {busyAll ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Feather name="check-circle" size={14 * btnScale} color={colors.primary} />
                      <Text style={[styles.deliverAllText, { fontSize: 12 * textScale }]}>
                        Entregar todos
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>

      <Feather
        name="chevron-right"
        size={16 * scale}
        color={colors.textMuted}
        style={{ alignSelf: 'center', marginLeft: 4 * scale }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.bgLight,
    ...shadow.card,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  numBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  num: {
    ...typography.h2,
    color: colors.textOnDark,
    fontWeight: '900',
    width: '100%',
    textAlign: 'center',
  },
  star: {
    position: 'absolute',
  },
  partial: {
    position: 'absolute',
    width: '85%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    alignSelf: 'center',
  },
  partialText: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  items: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6DE',
  },
  itemThumb: {
    backgroundColor: '#F0ECE7',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '800',
  },
  itemQty: {
    color: colors.primary,
    fontWeight: '800',
  },
  checkBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  deliverAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  deliverAllText: {
    color: colors.primary,
    fontWeight: '800',
  },
  emptyItem: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE4',
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  timeText: {
    color: '#464646',
    fontWeight: '400',
    textAlign: 'center',
  },
});