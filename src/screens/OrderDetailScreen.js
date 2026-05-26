import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Screen from '../components/Screen';
import DarkHeader from '../components/DarkHeader';
import Button from '../components/Button';
import Input from '../components/Input';
import FeedbackModal from '../components/FeedbackModal';
import { colors, radii, typography } from '../theme';
import {
  fetchOrder,
  createOrder,
  updateOrder,
  closeOrder,
  deleteOrder,
} from '../services/ordersService';
import { fetchTables } from '../services/tablesService';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import useElapsedTime from '../hooks/useElapsedTime';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tela "Novo pedido" / detalhe da comanda. Aberta com:
//   route.params.id = 'new'      -> criar comanda
//   route.params.id = <id>       -> editar
//   route.params.readOnly = true -> apenas visualizar (comanda fechada)
export default function OrderDetailScreen({ route, navigation }) {
  const { id, readOnly, addItems } = route.params || {};
  const isNew = id === 'new' || id == null;
  const { user } = useAuth();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const twoCol = r.isLandscape && r.width >= 800;

  const [order,   setOrder]   = useState(null);
  const [items,   setItems]   = useState([]); // itens locais (modo "new")
  const [label,   setLabel]   = useState('');
  const [tableId, setTableId] = useState(null);
  const [people,  setPeople]  = useState(1);  // nº de pessoas para divisão
  const [tables,  setTables]  = useState([]);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const [loading,  setLoading] = useState(!isNew);
  const [busy,     setBusy]    = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const loadOrder = useCallback(async () => {
    if (isNew) { setLoading(false); return; }
    try {
      setLoading(true);
      const o = await fetchOrder(id);
      setOrder(o);
      setItems(o.items || []);
      setLabel(o.label || '');
      setTableId(o.table_id || null);
      setPeople(Math.max(1, Number(o.people) || 1));
    } catch (err) {
      Alert.alert('Erro', err?.uiMessage || 'Erro ao buscar comanda.');
      navigation.goBack();
    } finally { setLoading(false); }
  }, [id, isNew, navigation]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // Carrega mesas para o seletor
  useEffect(() => {
    fetchTables().then(setTables).catch(() => {});
  }, []);

  // Itens vindos do catálogo (route.params.addItems do AddItemsScreen)
  useEffect(() => {
    if (!addItems?.length) return;
    if (isNew) {
      setItems((prev) => mergeItems(prev, addItems));
    } else {
      // Persiste imediatamente no backend
      (async () => {
        try {
          setBusy(true);
          const updated = await updateOrder(id, { add_items: addItems });
          setOrder(updated);
          setItems(updated.items || []);
        } catch (err) {
          Alert.alert('Erro', err?.uiMessage || 'Erro ao adicionar itens.');
        } finally { setBusy(false); }
      })();
    }
    // Limpa o param para não re-aplicar
    navigation.setParams({ addItems: undefined });
  }, [addItems, id, isNew, navigation]);

  const totalRaw = useMemo(
    () => items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0),
    [items]
  );
  const total = (Number(order?.discount) || 0) > 0
    ? Math.max(0, totalRaw - Number(order.discount))
    : totalRaw;
  const perPerson = total / Math.max(1, people);

  const tableLabel = tables.find((t) => t.id === tableId)?.label;

  // Formata a data como "dd/mm/aaaa às hh:mm" — usado no subtítulo do header.
  const createdDate = order?.created_at ? new Date(order.created_at) : new Date();
  const createdDateStr = createdDate.toLocaleDateString('pt-BR');
  const createdTimeStr = createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const createdAt = `${createdDateStr} às ${createdTimeStr}`;

  // Timer de tempo decorrido. Para automaticamente quando a comanda fecha
  // (usa closed_at como fim). Em comandas novas, conta desde Date.now().
  const elapsed = useElapsedTime(order?.created_at, order?.closed_at);

  function removeLocalItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // Decrementa em 1 unidade. Se chegar a 0, remove o item.
  function decrementLocalItem(idx) {
    setItems((prev) => {
      const next = [...prev];
      const cur  = { ...next[idx] };
      cur.quantity = (cur.quantity || 1) - 1;
      if (cur.quantity <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = cur;
      return next;
    });
  }

  function incrementLocalItem(idx) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + 1 };
      return next;
    });
  }

  // Altera quantidade no servidor. Se newQty <= 0, remove o item.
  async function changeServerItemQty(itemId, newQty) {
    try {
      setBusy(true);
      const payload = newQty <= 0
        ? { remove_items: [itemId] }
        : { update_items: [{ item_id: itemId, quantity: newQty }] };
      const updated = await updateOrder(id, payload);
      setOrder(updated);
      setItems(updated.items || []);
    } catch (err) {
      Alert.alert('Erro', err?.uiMessage || 'Erro ao alterar quantidade.');
    } finally { setBusy(false); }
  }

  async function removeServerItem(itemId) {
    try {
      setBusy(true);
      const updated = await updateOrder(id, { remove_items: [itemId] });
      setOrder(updated);
      setItems(updated.items || []);
    } catch (err) {
      Alert.alert('Erro', err?.uiMessage || 'Erro ao remover item.');
    } finally { setBusy(false); }
  }

  async function onPrimary() {
    if (readOnly) return;

    if (isNew) {
      if (items.length === 0) {
        Alert.alert('Atenção', 'Adicione ao menos um item antes de abrir a comanda.');
        return;
      }
      try {
        setBusy(true);
        const created = await createOrder({
          label: label || null,
          table_id: tableId,
          people,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            notes: i.notes,
          })),
        });
        navigation.replace('Orders', { justCreatedId: created.id });
      } catch (err) {
        Alert.alert('Erro', err?.uiMessage || 'Erro ao criar comanda.');
      } finally { setBusy(false); }
    } else {
      // Comanda existente: fechar comanda (confirma antes)
      setConfirmModal('close');
    }
  }

  // Salva alterações de label/mesa e mostra modal de sucesso. Itens já são
  // salvos automaticamente quando alterados (incrementar/remover/adicionar).
  // Ao fechar o modal, o usuário volta para a lista de comandas.
  async function onSave() {
    try {
      setBusy(true);
      await updateOrder(id, {
        label:    label || null,
        table_id: tableId,
        people,
      });
      setConfirmModal('saved');
    } catch (err) {
      Alert.alert('Erro', err?.uiMessage || 'Erro ao salvar.');
    } finally { setBusy(false); }
  }

  async function confirmClose() {
    try {
      setBusy(true);
      await closeOrder(id);
      setConfirmModal(null);
      // popToTop volta para Orders mesmo após passar pelo catálogo.
      navigation.popToTop();
    } catch (err) {
      Alert.alert('Erro', err?.uiMessage || 'Erro ao fechar comanda.');
    } finally { setBusy(false); }
  }

  async function onClear() {
    if (isNew) {
      setItems([]);
      return;
    }
    Alert.alert('Limpar comanda', 'Remover todos os itens?', [
      { text: 'Cancelar' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusy(true);
            const updated = await updateOrder(id, {
              remove_items: items.map((i) => i.id),
            });
            setOrder(updated);
            setItems(updated.items || []);
          } catch (err) {
            Alert.alert('Erro', err?.uiMessage || 'Erro ao limpar.');
          } finally { setBusy(false); }
        },
      },
    ]);
  }

  function goAddItems() {
    navigation.navigate('AddItems', { orderId: isNew ? 'new' : id });
  }

  if (loading) {
    return (
      <Screen background={colors.bgScreen} statusBarBg={colors.bgDark} statusBarStyle="light-content">
        <DarkHeader title="Carregando..." onBack={() => navigation.popToTop()} />
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
      </Screen>
    );
  }

  const headerTitle    = isNew ? 'Novo pedido' : `Comanda nº ${id}`;
  const headerSubtitle = isNew ? `Iniciado em ${createdAt}` : `Aberto em ${createdAt}`;

  return (
    <Screen
      background={colors.bgScreen}
      statusBarBg={colors.bgDark}
      statusBarStyle="light-content"
      keyboardOffset={20}
    >
      <DarkHeader title={headerTitle} subtitle={headerSubtitle} onBack={() => navigation.popToTop()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 220, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{readOnly ? 'Fechada' : 'Pendente'}</Text>
        </View>

        <View style={twoCol ? styles.twoColRow : null}>
        <View style={twoCol ? styles.twoColLeft : null}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Row icon="edit-3" text={order?.attendant || user?.username || '—'} />
          {/* Pessoas: editável (incrementa/decrementa) quando comanda aberta */}
          <View style={styles.infoRow}>
            <Feather name="users" size={14} color={colors.textDark} />
            <Text style={styles.infoText}>
              {String(people).padStart(2, '0')} {people === 1 ? 'pessoa' : 'pessoas'}
            </Text>
            {!readOnly ? (
              <View style={styles.peopleControls}>
                <Pressable
                  onPress={() => setPeople((p) => Math.max(1, p - 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: 14 }}
                  style={styles.peopleBtn}
                >
                  <Feather name="minus" size={14} color={colors.textDark} />
                </Pressable>
                <Pressable
                  onPress={() => setPeople((p) => Math.min(99, p + 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: 14 }}
                  style={styles.peopleBtn}
                >
                  <Feather name="plus" size={14} color={colors.textDark} />
                </Pressable>
              </View>
            ) : null}
          </View>
          <Row icon="clock" text={elapsed} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mesa</Text>
          <View style={styles.mesaRow}>
            <Pressable
              onPress={() => !readOnly && setShowTablePicker((v) => !v)}
              style={styles.mesaSelect}
            >
              <Text style={[styles.mesaText, !tableLabel && { color: colors.textMuted }]}>
                {tableLabel || 'Selecionar...'}
              </Text>
              <Feather name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.mesaHint}>
              <Feather name="info" size={11} color={colors.textMuted} />  Deixe nulo para cadastrar pedido avulso.
            </Text>
          </View>
          {showTablePicker ? (
            <View style={styles.tableList}>
              <ScrollView
                style={{ maxHeight: 240 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  onPress={() => { setTableId(null); setShowTablePicker(false); }}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  style={styles.tableOpt}
                >
                  <Text style={{ color: colors.textMuted }}>Sem mesa</Text>
                </Pressable>
                {tables.filter((t) => t.is_active).map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => { setTableId(t.id); setShowTablePicker(false); }}
                    android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                    style={styles.tableOpt}
                  >
                    <Text style={{ color: colors.textDark }}>{t.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Input
            label="Identificação (opcional)"
            value={label}
            onChangeText={setLabel}
            placeholder='Ex.: "João", "Balcão"'
            editable={!readOnly}
            style={{ marginTop: 14 }}
          />
        </View>
        </View>

        <View style={twoCol ? styles.twoColRight : null}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedidos</Text>
          {items.length === 0 ? (
            <Text style={styles.empty}>Nenhum item adicionado.</Text>
          ) : (() => {
            // Em landscape (twoCol), a lista de itens tem rolagem própria
            // limitada por maxHeight; em portrait, deixa rolar com a página.
            const itemCards = items.map((it, idx) => (
              <ItemCard
                key={it.id || `local-${idx}`}
                item={it}
                readOnly={readOnly}
                onIncrement={() => {
                  if (it.id) changeServerItemQty(it.id, (it.quantity || 1) + 1);
                  else       incrementLocalItem(idx);
                }}
                onDecrement={() => {
                  if (it.id) changeServerItemQty(it.id, (it.quantity || 1) - 1);
                  else       decrementLocalItem(idx);
                }}
                onRemove={() => (it.id ? removeServerItem(it.id) : removeLocalItem(idx))}
              />
            ));

            return twoCol ? (
              <ScrollView
                style={{ maxHeight: 460 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {itemCards}
              </ScrollView>
            ) : (
              <View>{itemCards}</View>
            );
          })()}

          {!readOnly ? (
            <View style={styles.itemActions}>
              <Button title="Limpar" variant="ghost" onPress={onClear} icon={<Feather name="x-circle" size={16} color={colors.textDark} />} />
              <View style={{ width: 12 }} />
              <Button
                title="Adicionar novo item"
                variant="outline"
                onPress={goAddItems}
                icon={<Feather name="plus-circle" size={16} color={colors.primary} />}
              />
            </View>
          ) : null}
        </View>
        </View>
        </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 22 + insets.bottom }]}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>R$ {formatMoney(total)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalSubLabel}>Total por pessoa ({people}):</Text>
            <Text style={styles.totalSubValue}>R$ {formatMoney(perPerson)}</Text>
          </View>
        </View>
        {!readOnly ? (
          isNew ? (
            <Button
              title="Abrir comanda"
              onPress={onPrimary}
              loading={busy}
            />
          ) : (
            <View style={styles.footerActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Salvar alterações"
                  variant="outline"
                  onPress={onSave}
                  loading={busy}
                  textStyle={{ color: '#FFF' }}
                  style={{ borderColor: '#FFF' }}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Button
                  title="Fechar comanda"
                  onPress={onPrimary}
                  loading={busy}
                />
              </View>
            </View>
          )
        ) : null}
      </View>

      <FeedbackModal
        visible={confirmModal === 'close'}
        title="Fechar comanda?"
        message={`Total: R$ ${formatMoney(total)}\nApós fechar não será mais possível editar.`}
        okLabel="Fechar comanda"
        onClose={confirmClose}
      />

      <FeedbackModal
        visible={confirmModal === 'saved'}
        title="Comanda atualizada"
        message={`Comanda nº ${id} editada com sucesso!`}
        okLabel="OK"
        onClose={() => {
          setConfirmModal(null);
          // popToTop garante voltar pra lista de comandas (root do stack)
          // mesmo que o usuário tenha passado pelo catálogo de itens.
          navigation.popToTop();
        }}
      />
    </Screen>
  );
}

function Row({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={14} color={colors.textDark} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function ItemCard({ item, onRemove, onIncrement, onDecrement, readOnly }) {
  const total = Number(item.unit_price) * Number(item.quantity);
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemImg}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
        ) : (
          <Feather name="image" size={26} color="#BBB" />
        )}
      </View>
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.itemQty}>R$ {formatMoney(item.unit_price)} cada</Text>

        {!readOnly ? (
          <View style={styles.qtyControls}>
            <Pressable
              onPress={onDecrement}
              android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: 16 }}
              style={({ pressed }) => [
                styles.qtyBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="minus" size={16} color={colors.textDark} />
            </Pressable>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <Pressable
              onPress={onIncrement}
              android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: 16 }}
              style={({ pressed }) => [
                styles.qtyBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="plus" size={16} color={colors.textDark} />
            </Pressable>
          </View>
        ) : (
          <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.itemTotal}>R$ {formatMoney(total)}</Text>
        {!readOnly ? (
          <Pressable
            onPress={onRemove}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
            style={({ pressed }) => [
              styles.itemEdit,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather name="trash-2" size={14} color="#FFF" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function mergeItems(prev, incoming) {
  // Agrupa por product_id incrementando quantity quando já existe.
  const map = new Map();
  for (const p of prev) {
    const k = p.product_id;
    map.set(k, { ...p });
  }
  for (const it of incoming) {
    const k = it.product_id;
    if (map.has(k)) {
      map.get(k).quantity += it.quantity;
    } else {
      map.set(k, { ...it });
    }
  }
  return Array.from(map.values());
}

function formatMoney(n) {
  return Number(n || 0).toFixed(2).replace('.', ',');
}

const styles = StyleSheet.create({
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6D6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    borderRadius: radii.md,
  },
  statusDot:   { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.statusYellow, marginRight: 10 },
  statusText:  { ...typography.bodyBold, color: colors.textDark },

  twoColRow:   { flexDirection: 'row', gap: 8 },
  twoColLeft:  { flex: 1 },
  twoColRight: { flex: 1 },

  section:      { paddingHorizontal: 18, marginBottom: 18 },
  sectionTitle: { ...typography.h3, color: colors.textDark, fontSize: 18, marginBottom: 10 },

  infoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { ...typography.body, color: colors.textDark, marginLeft: 10 },

  // Controles +/- ao lado do campo de pessoas
  peopleControls: { flexDirection: 'row', marginLeft: 12 },
  peopleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFEAE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    overflow: 'hidden',
  },

  mesaRow: { flexDirection: 'row', alignItems: 'center' },
  mesaSelect: {
    width: 110,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mesaText:  { color: colors.textDark, fontSize: 14 },
  mesaHint:  { color: colors.textMuted, fontSize: 11, marginLeft: 10, flex: 1 },
  tableList: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  tableOpt:  { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 10,
  },
  itemImg:   { width: 56, height: 56, borderRadius: 8, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  itemName:  { ...typography.bodyBold, color: colors.textDark, fontSize: 14 },
  itemQty:   { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemTotal: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  itemEdit:  {
    marginTop: 6, width: 26, height: 26, borderRadius: 6,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  // Controles + / − para alterar quantidade do item
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFEAE4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qtyValue: {
    minWidth: 32,
    textAlign: 'center',
    color: colors.textDark,
    fontWeight: '800',
    fontSize: 15,
    marginHorizontal: 6,
  },

  itemActions: { flexDirection: 'row', marginTop: 4 },
  empty: { color: colors.textMuted, fontStyle: 'italic', paddingVertical: 8 },

  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: colors.bgDark,
    paddingHorizontal: 18,
    paddingTop: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  // Layout dos dois botões no footer (Salvar + Fechar) em telas existentes
  footerActions: { flexDirection: 'row', alignItems: 'center' },
  totalLabel:    { color: '#FFF', fontSize: 14 },
  totalValue:    { color: colors.primary, fontSize: 28, fontWeight: '900' },
  totalSubLabel: { color: '#CCC', fontSize: 11 },
  totalSubValue: { color: '#FFF', fontSize: 14 },
});
