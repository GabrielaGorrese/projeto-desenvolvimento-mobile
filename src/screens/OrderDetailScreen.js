import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
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
import ConfirmModal from '../components/ConfirmModal';
import { colors, radii, typography } from '../theme';
import {
  fetchOrder,
  createOrder,
  updateOrder,
  closeOrder,
  deleteOrder,
} from '../services/ordersService';
import { fetchTables } from '../services/tablesService';
import { connectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { usePendingItems } from '../contexts/PendingItemsContext';
import useResponsive from '../hooks/useResponsive';
import useElapsedTime from '../hooks/useElapsedTime';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tela "Novo pedido" / detalhe da comanda. Aberta com:
//   route.params.id = 'new'      -> criar comanda
//   route.params.id = <id>       -> editar
//   route.params.readOnly = true -> apenas visualizar (comanda fechada)
export default function OrderDetailScreen({ route, navigation }) {
  const { id, readOnly } = route.params || {};
  const isNew = id === 'new' || id == null;
  const { user } = useAuth();
  const { takePendingItems } = usePendingItems();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const twoCol = r.isLandscape && r.width >= 800;

  const [order,   setOrder]   = useState(null);
  const [items,   setItems]   = useState([]); // itens locais (modo "new")
  const [label,   setLabel]   = useState('');
  const [tableId, setTableId] = useState(null);
  const [people,  setPeople]  = useState(1);  // nº de pessoas para divisão
  const [dailyNumber, setDailyNumber] = useState(''); // número visível escolhido (só na criação)
  const [tables,  setTables]  = useState([]);
  const [showTablePicker, setShowTablePicker] = useState(false);

  const [loading,  setLoading] = useState(!isNew);
  const [busy,     setBusy]    = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null); // { title, message }
  const [confirmClear, setConfirmClear] = useState(false); // confirmação "limpar comanda"

  // Flag para ignorar o evento order:closed disparado pelo próprio fechamento
  // deste atendente — só queremos o aviso quando OUTRO fecha a comanda.
  const closingSelfRef = useRef(false);

  const scrollRef       = useRef(null);
  const contentRef      = useRef(null);
  const labelInputRef   = useRef(null);
  const numberInputRef  = useRef(null);
  const [kbHeight, setKbHeight] = useState(0);

  const updateDailyNumber = useCallback((value) => {
    setDailyNumber(String(value).replace(/[^0-9]/g, '').slice(0, 6));
  }, []);

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
      setErrorModal({
        title: 'Erro',
        message: err?.uiMessage || 'Erro ao buscar comanda.',
        onClose: () => navigation.goBack(),
      });
    } finally { setLoading(false); }
  }, [id, isNew, navigation]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // Carrega mesas para o seletor
  useEffect(() => {
    fetchTables().then(setTables).catch(() => {});
  }, []);


  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates?.height || 0));
    const hideSub = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);


  function scrollInputIntoView(inputRef) {
    setTimeout(() => {
      const input   = inputRef?.current;
      const content = contentRef.current;
      const scroll  = scrollRef.current;
      if (!input || !content || !scroll || !input.measureLayout) return;
      input.measureLayout(
        content,
        (_x, y) => scroll.scrollTo({ y: Math.max(0, y - 16), animated: true }),
        () => {}
      );
    }, Platform.OS === 'ios' ? 60 : 220);
  }

  // Socket: se outro atendente fechar/excluir ESTA comanda enquanto ela está
  // aberta aqui, mostra um aviso com saída em vez de deixar o usuário preso.
  useEffect(() => {
    if (isNew || readOnly) return;
    const s = connectSocket();
    const onGone = (payload) => {
      if (closingSelfRef.current) return;            // foi este atendente
      if (String(payload?.id) !== String(id)) return; // outra comanda
      setConfirmModal('alreadyClosed');
    };
    s.on('order:closed', onGone);
    s.on('order:deleted', onGone);
    return () => {
      s.off('order:closed', onGone);
      s.off('order:deleted', onGone);
    };
  }, [id, isNew, readOnly]);


  useFocusEffect(
    useCallback(() => {
      const pending = takePendingItems(id);
      if (!pending?.items?.length) return;

      if (isNew) {
        setItems((prev) => mergeItems(prev, pending.items));
      } else {
        // Persiste imediatamente no backend
        (async () => {
          try {
            setBusy(true);
            const updated = await updateOrder(id, { add_items: pending.items });
            setOrder(updated);
            setItems(updated.items || []);
          } catch (err) {
            setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao adicionar itens.' });
          } finally { setBusy(false); }
        })();
      }
    }, [id, isNew, takePendingItems])
  );

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
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao alterar quantidade.' });
    } finally { setBusy(false); }
  }

  async function removeServerItem(itemId) {
    try {
      setBusy(true);
      const updated = await updateOrder(id, { remove_items: [itemId] });
      setOrder(updated);
      setItems(updated.items || []);
    } catch (err) {
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao remover item.' });
    } finally { setBusy(false); }
  }

  async function onPrimary() {
    if (readOnly) return;

    if (isNew) {
      if (items.length === 0) {
        setErrorModal({ title: 'Atenção', message: 'Adicione ao menos um item antes de abrir a comanda.' });
        return;
      }
      const parsedNumber = parseInt(dailyNumber, 10);
      if (!parsedNumber || parsedNumber < 1) {
        setErrorModal({ title: 'Atenção', message: 'Informe o número da comanda (inteiro maior que zero).' });
        return;
      }
      try {
        setBusy(true);
        const created = await createOrder({
          label: label || null,
          table_id: tableId,
          people,
          daily_number: parsedNumber,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            notes: i.notes,
          })),
        });
        navigation.replace('Orders', {
          justCreatedId: created.id,
          justCreatedNumber: created.daily_number,
        });
      } catch (err) {
        setErrorModal({ title: 'Erro ao abrir comanda', message: err?.uiMessage || 'Erro ao criar comanda.' });
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
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao salvar.' });
    } finally { setBusy(false); }
  }

  async function confirmClose() {
    try {
      setBusy(true);
      closingSelfRef.current = true; // ignora o order:closed do nosso fechamento
      await closeOrder(id);
      setConfirmModal(null);
      // popToTop volta para Orders mesmo após passar pelo catálogo.
      navigation.popToTop();
    } catch (err) {
      closingSelfRef.current = false;
      const status = err?.response?.status;
      // 404/409 = a comanda já foi fechada por outro atendente: troca para o
      // aviso com botão de saída em vez de manter o modal de confirmação preso.
      if (status === 404 || status === 409) {
        setConfirmModal('alreadyClosed');
      } else {
        setConfirmModal(null);
        setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao fechar comanda.' });
      }
    } finally { setBusy(false); }
  }

  function onClear() {
    if (isNew) {
      setItems([]);
      return;
    }
    setConfirmClear(true);
  }

  async function doClear() {
    try {
      setBusy(true);
      const updated = await updateOrder(id, {
        remove_items: items.map((i) => i.id),
      });
      setOrder(updated);
      setItems(updated.items || []);
      setConfirmClear(false);
    } catch (err) {
      setConfirmClear(false);
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao limpar.' });
    } finally { setBusy(false); }
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

  const displayNumber  = order?.daily_number ?? id;
  const headerTitle    = isNew ? 'Novo pedido' : `Comanda nº ${displayNumber}`;
  const headerSubtitle = isNew ? `Iniciado em ${createdAt}` : `Aberto em ${createdAt}`;

  return (
    <Screen
      background={colors.bgScreen}
      statusBarBg={colors.bgDark}
      statusBarStyle="light-content"
      avoidKeyboard={false}
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
            <Feather name="users" size={18} color={colors.textDark} />
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
                  <Feather name="minus" size={18} color={colors.textDark} />
                </Pressable>
                <Pressable
                  onPress={() => setPeople((p) => Math.min(99, p + 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: 14 }}
                  style={styles.peopleBtn}
                >
                  <Feather name="plus" size={18} color={colors.textDark} />
                </Pressable>
              </View>
            ) : null}
          </View>
          <Row icon="clock" text={elapsed} />
        </View>

        <View
          style={{
            height: 2,
            backgroundColor: '#e0e0e0',
            width: '100%',
            marginVertical: 10,
            marginBottom: 24
          }}
        />        

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
              <Feather name="info" size={18} color={colors.textMuted} />  Deixe nulo para cadastrar pedido avulso.
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
              <Button title="Limpar" variant="ghost" onPress={onClear} icon={<Feather name="x-circle" size={24} color={colors.textDark} />} />
              <View style={{ width: 12 }} />
              <Button
                title="Adicionar novo item"
                onPress={goAddItems}
                icon={<Feather name="plus-circle" size={24} color='#FFF' />}
              />
            </View>
          ) : null}
        </View>
        </View>
        </View>
        </View>
      </ScrollView>

      {/* Esconde o rodapé (Total + ações) enquanto o teclado está aberto:
          libera espaço e evita os botões flutuando no meio da tela ao digitar. */}
      {kbHeight === 0 ? (
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
      ) : null}

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
        message={`Comanda nº ${displayNumber} editada com sucesso!`}
        okLabel="OK"
        onClose={() => {
          setConfirmModal(null);
          // popToTop garante voltar pra lista de comandas (root do stack)
          // mesmo que o usuário tenha passado pelo catálogo de itens.
          navigation.popToTop();
        }}
      />

      <FeedbackModal
        visible={confirmModal === 'alreadyClosed'}
        variant="danger"
        title="Comanda já fechada"
        message="Esta comanda foi fechada por outro atendente e não pode mais ser editada."
        okLabel="Voltar para comandas"
        onClose={() => {
          setConfirmModal(null);
          navigation.popToTop();
        }}
      />

      <FeedbackModal
        visible={!!errorModal}
        variant="danger"
        title={errorModal?.title || 'Erro'}
        message={errorModal?.message || ''}
        okLabel="OK"
        onClose={() => { const cb = errorModal?.onClose; setErrorModal(null); cb?.(); }}
      />

      <ConfirmModal
        visible={confirmClear}
        variant="danger"
        title="Limpar comanda"
        message="Remover todos os itens desta comanda?"
        confirmLabel="Limpar"
        cancelLabel="Cancelar"
        destructive
        loading={busy}
        onConfirm={doClear}
        onCancel={() => setConfirmClear(false)}
      />
    </Screen>
  );
}

function Row({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={18} color={colors.textDark} />
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
  statusPillBg: {
    backgroundColor: '#fffbec',
    width: '100%',
    marginBottom: 32,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6D6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    borderRadius: radii.md,
    width: '98%'
  },
  statusDot:   { width: 24, height: 24, borderRadius: 24, backgroundColor: colors.statusYellow, marginRight: 16 },
  statusText:  { fontSize: 18, fontWeight: 700, color: colors.textDark },

  twoColRow:   { flexDirection: 'row', gap: 8 },
  twoColLeft:  { flex: 1 },
  twoColRight: { flex: 1 },

  section:      { paddingHorizontal: 24, marginBottom: 18 },
  sectionTitle: { ...typography.h3, color: colors.textDark, fontSize: 24, paddingBottom: 12 },

  infoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 18, color: colors.textDark, marginLeft: 10 },

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
    width: 152,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  mesaText:  { color: colors.textDark, fontSize: 18 },
  mesaHint:  { color: colors.textMuted, fontSize: 16, marginLeft: 10, flex: 1 },
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
