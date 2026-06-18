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
  reopenOrder,
} from '../services/ordersService';
import { fetchTables, createTable, deleteTable } from '../services/tablesService';
import { getShowTable, getShowLabel } from '../services/appSettings';
import { onSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { usePendingItems } from '../contexts/PendingItemsContext';
import useResponsive from '../hooks/useResponsive';
import ScrollFade from '../components/ScrollFade';
import { formatMoney } from '../utils/format';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tela "Novo pedido" / detalhe da comanda. Aberta com:
//   route.params.id = 'new'      -> criar comanda
//   route.params.id = <id>       -> editar
//   route.params.readOnly = true -> apenas visualizar (comanda fechada)
export default function OrderDetailScreen({ route, navigation }) {
  const { id, readOnly } = route.params || {};
  const isNew = id === 'new' || id == null;
  const { user, isManager } = useAuth();
  const { takePendingItems } = usePendingItems();
  const r = useResponsive();
  const insets = useSafeAreaInsets();

  // Campos opcionais (ligados/desligados nas configurações). Lidos no mount.
  const showTable = getShowTable();
  const showLabel = getShowLabel();
  const twoCol = r.isLandscape && r.width >= 800;

  const sz = useMemo(() => ({
    section:   r.isTablet ? 26 : 24,
    body:      r.isTablet ? 22 : 19,
    bodyBold:  r.isTablet ? 22 : 19,
    caption:   r.isTablet ? 18 : 16,
    inputH:    r.isTablet ? 86 : 72,
    inputPad:  r.isTablet ? 24 : 20,
    iconSize:  r.isTablet ? 28 : 24,
    peopleBtn: r.isTablet ? 32 : 32,
    mesaH:     r.isTablet ? 78 : 68,
    mesaMinW:  r.isTablet ? 230 : 180,
    itemImg:   r.isTablet ? 92 : 74,
    itemName:  r.isTablet ? 22 : 19,
    itemPrice: r.isTablet ? 18 : 16,
    itemTotal: r.isTablet ? 23 : 20,
    qtyBtn:    r.isTablet ? 50 : 44,
    qtyVal:    r.isTablet ? 23 : 20,
    totalBig:  r.isTablet ? 44 : 34,
    totalSub:  r.isTablet ? 22 : 19,
  }), [r.isTablet]);

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
  const [errorModal, setErrorModal] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const [showNewTable,      setShowNewTable]      = useState(false);
  const [newTableLabel,     setNewTableLabel]      = useState('');
  const [creatingTable,     setCreatingTable]      = useState(false);

  const [confirmDeleteTable, setConfirmDeleteTable] = useState(null);
  const [deletingTable,      setDeletingTable]      = useState(false);

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

  useEffect(() => {
    fetchTables().then(setTables).catch(() => {});

    const onCreated = (table) => setTables((prev) => [...prev, table]);
    const onDeleted = ({ id }) => {
      setTables((prev) => prev.filter((t) => t.id !== id));
      setTableId((cur) => (cur === id ? null : cur));
    };
    const subs = [
      onSocket('table:created', onCreated),
      onSocket('table:deleted', onDeleted),
    ];
    return () => subs.forEach((off) => off());
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
    const onGone = (payload) => {
      if (closingSelfRef.current) return;            // foi este atendente
      if (String(payload?.id) !== String(id)) return; // outra comanda
      setConfirmModal('alreadyClosed');
    };
    // Atualização ao vivo (ex.: outro tablet entregou/alterou itens desta comanda).
    // Atualiza só os itens — não mexe em label/pessoas que o usuário pode estar editando.
    const onUpdated = (payload) => {
      if (String(payload?.id) !== String(id)) return;
      setOrder(payload);
      setItems(payload.items || []);
    };
    const onReconnect = async () => {
      try {
        const fresh = await fetchOrder(id);
        setOrder(fresh);
        setItems(fresh.items || []);
      } catch {}
    };
    const subs = [
      onSocket('order:closed', onGone),
      onSocket('order:deleted', onGone),
      onSocket('order:updated', onUpdated),
      onSocket('connect', onReconnect),
    ];
    return () => subs.forEach((off) => off());
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

  // Só é possível fechar a comanda quando todos os itens já foram entregues.
  const allDelivered = items.length > 0 && items.every((it) => it.delivered);

  const tableLabel = tables.find((t) => t.id === tableId)?.label;

  // Formata a data como "dd/mm/aaaa às hh:mm" — usado no subtítulo do header.
  const createdDate = order?.created_at ? new Date(order.created_at) : new Date();
  const createdDateStr = createdDate.toLocaleDateString('pt-BR');
  const createdTimeStr = createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const createdAt = `${createdDateStr} às ${createdTimeStr}`;

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

  // Entrega de itens (apenas comandas já criadas). Reaproveita o PATCH /orders/:id.
  async function applyOrderPatch(payload, errMsg) {
    try {
      setBusy(true);
      const updated = await updateOrder(id, payload);
      setOrder(updated);
      setItems(updated.items || []);
    } catch (err) {
      setErrorModal({ title: 'Erro', message: err?.uiMessage || errMsg });
    } finally { setBusy(false); }
  }
  const deliverItem    = (itemId) => applyOrderPatch({ deliver_items: [itemId] },   'Erro ao entregar item.');
  const undeliverItem  = (itemId) => applyOrderPatch({ undeliver_items: [itemId] }, 'Erro ao desfazer entrega.');
  const deliverAllItems = ()      => applyOrderPatch({ deliver_all: true },          'Erro ao entregar itens.');

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

  async function confirmReopen() {
    try {
      setBusy(true);
      await reopenOrder(id);
      setConfirmModal(null);
      // Reabre a mesma comanda em modo editável.
      navigation.replace('OrderDetail', { id });
    } catch (err) {
      setConfirmModal(null);
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao reabrir comanda.' });
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

  async function doDeleteTable() {
    if (!confirmDeleteTable) return;
    try {
      setDeletingTable(true);
      await deleteTable(confirmDeleteTable.id);
      setTables((prev) => prev.filter((t) => t.id !== confirmDeleteTable.id));
      if (tableId === confirmDeleteTable.id) setTableId(null);
      setConfirmDeleteTable(null);
    } catch (err) {
      setConfirmDeleteTable(null);
      const is409 = err?.response?.status === 409;
      setErrorModal({
        title: 'Não foi possível excluir',
        message: is409
          ? 'Esta mesa possui comandas abertas. Feche todas as comandas desta mesa antes de excluí-la.'
          : err?.uiMessage || 'Erro ao excluir a mesa.',
      });
    } finally { setDeletingTable(false); }
  }

  async function doCreateTable() {
    if (!newTableLabel.trim()) return;
    try {
      setCreatingTable(true);
      const t = await createTable(newTableLabel.trim());
      setTables((prev) => [...prev, t]);
      setTableId(t.id);
      setNewTableLabel('');
      setShowNewTable(false);
      setShowTablePicker(false);
    } catch (err) {
      setErrorModal({ title: 'Erro', message: err?.uiMessage || 'Erro ao criar mesa.' });
    } finally { setCreatingTable(false); }
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

      <ScrollFade
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 + kbHeight }]}
        keyboardShouldPersistTaps="handled"
        fadeColor="#FFFFFF"
      >

      {/*
      <View style={styles.statusPill}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{readOnly ? 'Fechada' : 'Pendente'}</Text>
      </View>
      */}

      <View ref={contentRef} style={[styles.content, { maxWidth: r.isTablet ? Math.min(r.width - 32, 1100) : r.contentMaxWidth }]}>
      

        {isNew ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: sz.section, marginTop: 18 }]}>Número da comanda</Text>
            <Input
              ref={numberInputRef}
              value={dailyNumber}
              onChangeText={updateDailyNumber}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Ex.: 1, 2, 3..."
              onFocus={() => scrollInputIntoView(numberInputRef)}
              fieldStyle={[styles.inputField, { height: 64, paddingHorizontal: sz.inputPad }]}
              inputStyle={[styles.inputText, { fontSize: sz.body }]}
              style={[styles.numberInputWrap, { maxWidth: '100%' }]}
            />
          </View>
        ) : null}

        <View style={styles.sectionDivider} />  

        <View style={twoCol ? styles.twoColRow : null}>
        <View style={twoCol ? styles.twoColLeft : null}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sz.section, marginBottom: 30 }]}>Informações</Text>
          <Row icon="edit-3" text={order?.attendant || user?.username || '—'} sz={sz} />
          <View style={styles.infoRow}>
            <Feather name="users" size={sz.iconSize} color={colors.textDark} />
            <Text style={[styles.infoText, { fontSize: sz.body }]}>
              {String(people).padStart(2, '0')} {people === 1 ? 'pessoa' : 'pessoas'}
            </Text>
            {!readOnly ? (
              <View style={styles.peopleControls}>
                <Pressable
                  onPress={() => setPeople((p) => Math.max(1, p - 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: sz.peopleBtn / 2 }}
                  style={[styles.peopleBtn, { width: sz.peopleBtn, height: sz.peopleBtn, borderRadius: 9 }]}
                >
                  <Feather name="minus" size={sz.iconSize} color={colors.textDark} />
                </Pressable>
                <Pressable
                  onPress={() => setPeople((p) => Math.min(99, p + 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: sz.peopleBtn / 2 }}
                  style={[styles.peopleBtn, { width: sz.peopleBtn, height: sz.peopleBtn, borderRadius: 9 }]}
                >
                  <Feather name="plus" size={sz.iconSize} color={colors.textDark} />
                </Pressable>
              </View>
            ) : null}
          </View>
          <Row icon="clock" text={`Aberta às ${createdTimeStr}`} sz={sz} />
        </View>

        <View style={styles.sectionDivider} />        

        {showTable ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sz.section }]}>Mesa</Text>
          <View style={styles.mesaRow}>
            <Pressable
              onPress={() => !readOnly && setShowTablePicker((v) => !v)}
              style={[styles.mesaSelect, { height: sz.mesaH, minWidth: sz.mesaMinW }]}
            >
              <Text style={[styles.mesaText, { fontSize: sz.body }, !tableLabel && { color: colors.textMuted }]}>
                {tableLabel || 'Selecionar...'}
              </Text>
              <Feather name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            <Text style={[styles.mesaHint, { fontSize: sz.caption }]}>
              <Feather name="info" size={sz.caption} color={colors.textMuted} />  Deixe nulo para pedido avulso.
            </Text>
          </View>

          {showTablePicker ? (
            <View style={styles.tableList}>
              <ScrollView
                style={{ maxHeight: 280 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  onPress={() => { setTableId(null); setShowTablePicker(false); }}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  style={styles.tableOpt}
                >
                  <Text style={styles.tableOptText}>Sem mesa</Text>
                </Pressable>
                {tables.filter((t) => t.is_active).map((t) => (
                  <View key={t.id} style={styles.tableOptRow}>
                    <Pressable
                      onPress={() => { setTableId(t.id); setShowTablePicker(false); }}
                      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                      style={styles.tableOptPressable}
                    >
                      <Text style={[styles.tableOptText, { color: colors.textDark }]}>{t.label}</Text>
                    </Pressable>
                    {isManager && !readOnly ? (
                      <Pressable
                        onPress={() => setConfirmDeleteTable(t)}
                        hitSlop={8}
                        style={styles.tableDeleteBtn}
                        android_ripple={{ color: 'rgba(255,0,0,0.08)', borderless: true, radius: 20 }}
                      >
                        <Feather name="trash-2" size={18} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </ScrollView>

              {/* Criação rápida de mesa — visível apenas para gerentes */}
              {isManager && !readOnly ? (
                showNewTable ? (
                  <View style={styles.newTableRow}>
                    <Input
                      value={newTableLabel}
                      onChangeText={setNewTableLabel}
                      placeholder="Nome da mesa..."
                      autoFocus
                      fieldStyle={styles.compactInputField}
                      inputStyle={styles.compactInputText}
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <Pressable
                      onPress={doCreateTable}
                      style={styles.newTableConfirm}
                      android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {creatingTable
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Feather name="check" size={20} color="#FFF" />}
                    </Pressable>
                    <Pressable
                      onPress={() => { setShowNewTable(false); setNewTableLabel(''); }}
                      style={[styles.newTableConfirm, { backgroundColor: '#888', marginLeft: 6 }]}
                    >
                      <Feather name="x" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowNewTable(true)}
                    style={styles.newTableAdd}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  >
                    <Feather name="plus" size={18} color={colors.primary} />
                    <Text style={styles.newTableAddText}>Nova mesa</Text>
                  </Pressable>
                )
              ) : null}
            </View>
          ) : null}
          
          <View style={[styles.sectionDivider, { marginTop: 48, marginBottom: 12 }]} />  

          </View>
        
        ) : null}

        {showLabel ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificação (opcional)</Text>
          <Input
            ref={labelInputRef}
            value={label}
            onChangeText={setLabel}
            placeholder='Ex.: "João", "Balcão"'
            editable={!readOnly}
            onFocus={() => scrollInputIntoView(labelInputRef)}
            fieldStyle={[styles.inputField, { height: sz.inputH, paddingHorizontal: sz.inputPad }]}
            inputStyle={[styles.inputText, { fontSize: sz.body }]}
            style={styles.labelInputWrap}
          />
        </View>
        ) : null}
        </View>

        <View style={twoCol ? styles.twoColRight : null}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sz.section }]}>Itens</Text>
          {items.length === 0 ? (
            <EmptySection text={'Nenhum item adicionado'} />
          ) : (() => {
            // Separa em duas listas: pendentes e entregues. Mantém o índice
            // original (necessário para os itens locais de comanda nova).
            const pendingCards = [];
            const deliveredCards = [];
            items.forEach((it, idx) => {
              const card = (
                <ItemCard
                  key={it.id || `local-${idx}`}
                  item={it}
                  readOnly={readOnly}
                  sz={sz}
                  onIncrement={() => {
                    if (it.id) changeServerItemQty(it.id, (it.quantity || 1) + 1);
                    else       incrementLocalItem(idx);
                  }}
                  onDecrement={() => {
                    if (it.id) changeServerItemQty(it.id, (it.quantity || 1) - 1);
                    else       decrementLocalItem(idx);
                  }}
                  onRemove={() => (it.id ? removeServerItem(it.id) : removeLocalItem(idx))}
                  onDeliver={it.id ? () => deliverItem(it.id) : null}
                  onUndeliver={it.id ? () => undeliverItem(it.id) : null}
                />
              );
              if (it.delivered) deliveredCards.push(card); else pendingCards.push(card);
            });

            return (
              <View>
                <View style={styles.subHeaderRow}>
                  <Text style={[styles.subHeader, { fontSize: sz.body, color: '#797979' }]}>Itens pendentes ({pendingCards.length})</Text>
                  {!readOnly && !isNew && pendingCards.length > 0 ? (
                    <Pressable onPress={deliverAllItems} hitSlop={8} style={styles.deliverAllBtn} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
                      <Feather name="check-circle" size={22} color={colors.primary} />
                      <Text style={styles.deliverAllText}>Entregar todos</Text>
                    </Pressable>
                  ) : null}
                </View>
                {pendingCards.length ? pendingCards : <Text style={styles.emptySub}>Nenhum item pendente.</Text>}

                <Text style={[styles.subHeader, { fontSize: sz.body, marginTop: 18, marginBottom: 24, color: '#797979' }]}>Itens entregues ({deliveredCards.length})</Text>
                {deliveredCards.length ? deliveredCards : <Text style={[styles.emptySub, {marginTop: -12}]}>Nenhum item entregue.</Text>}
              </View>
            );
          })()}
          
          <View style={[styles.sectionDivider, { marginTop: 48, marginBottom: 12 }]} />  

          {!readOnly ? (
            <View style={styles.itemActions}>
              <Button
                title="Limpar"
                variant="ghost"
                onPress={onClear}
                icon={<Feather name="x-circle" size={26} color={colors.textDark} />}
                size="lg"
                style={styles.actionButton}
                textStyle={styles.actionButtonText}
              />
              <View style={styles.actionSpacer} />
              <Button
                title="Adicionar novo item"
                onPress={goAddItems}
                icon={<Feather name="plus-circle" size={28} color="#FFF" />}
                size="lg"
                style={styles.actionButton}
                textStyle={styles.actionButtonText}
              />
            </View>
          ) : null}
        </View>
        </View>
        </View>
        </View>
      </ScrollFade>

      <View
        style={[
          styles.footer,
          {
            bottom: kbHeight,
            paddingBottom: kbHeight > 0 ? 16 : 22 + insets.bottom,
          },
        ]}
      >
        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { fontSize: sz.totalSub }]}>Total:</Text>
            <Text style={[styles.totalValue, { fontSize: sz.totalBig }]}>R$ {formatMoney(total)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.totalSubLabel, { fontSize: sz.caption }]}>Total por pessoa ({people}):</Text>
            <Text style={[styles.totalSubValue, { fontSize: sz.totalSub }]}>R$ {formatMoney(perPerson)}</Text>
          </View>
        </View>
        {!readOnly ? (
          isNew ? (
            <Button
              title="Abrir comanda"
              onPress={onPrimary}
              loading={busy}
              size="lg"
              style={styles.footerButton}
              textStyle={styles.footerButtonText}
            />
          ) : allDelivered ? (
            <View style={styles.footerActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Salvar alterações"
                  variant="outline"
                  onPress={onSave}
                  loading={busy}
                  size="lg"
                  textStyle={[styles.footerButtonText, { color: '#FFF' }]}
                  style={[styles.footerButton, { borderColor: '#FFF' }]}
                />
              </View>
              <View style={styles.footerSpacer} />
              <View style={{ flex: 1 }}>
                <Button
                  title="Fechar comanda"
                  onPress={onPrimary}
                  loading={busy}
                  size="lg"
                  style={styles.footerButton}
                  textStyle={styles.footerButtonText}
                />
              </View>
            </View>
          ) : (
            <>
              <Button
                title="Salvar alterações"
                variant="outline"
                onPress={onSave}
                loading={busy}
                size="lg"
                textStyle={[styles.footerButtonText, { color: '#FFF' }]}
                style={[styles.footerButton, { borderColor: '#FFF' }]}
              />
              <Text style={styles.closeHint}>
                Entregue todos os itens para poder fechar a comanda.
              </Text>
            </>
          )
        ) : isManager ? (
          <Button
            title="Reabrir comanda"
            onPress={() => setConfirmModal('reopen')}
            loading={busy}
            icon={<Feather name="rotate-ccw" size={26} color="#FFF" />}
            size="lg"
            style={styles.footerButton}
            textStyle={styles.footerButtonText}
          />
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

      <ConfirmModal
        visible={!!confirmDeleteTable}
        variant="danger"
        title={`Excluir mesa "${confirmDeleteTable?.label}"?`}
        message="Se esta mesa tiver comandas abertas, a exclusão será bloqueada automaticamente pelo sistema."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        loading={deletingTable}
        onConfirm={doDeleteTable}
        onCancel={() => setConfirmDeleteTable(null)}
      />

      <ConfirmModal
        visible={confirmModal === 'reopen'}
        title="Reabrir comanda?"
        message="A comanda voltará para 'aberta' e poderá ser editada novamente."
        confirmLabel="Reabrir"
        cancelLabel="Cancelar"
        loading={busy}
        onConfirm={confirmReopen}
        onCancel={() => setConfirmModal(null)}
      />
    </Screen>
  );
}

function EmptySection({ text }) {
  return (
    <View style={styles.emptyWrap}>
      <Image source={require('../../assets/vazio.png')} style={{ width: 76, height: 76, marginTop: 12 }} resizeMode="contain" />
      <Text style={styles.empty}>{text}</Text>
    </View>
  );
}

function Row({ icon, text, sz = {} }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={sz.iconSize || 14} color={colors.textDark} />
      <Text style={[styles.infoText, sz.body && { fontSize: sz.body }]}>{text}</Text>
    </View>
  );
}

function ItemCard({ item, onRemove, onIncrement, onDecrement, onDeliver, onUndeliver, readOnly, sz = {} }) {
  const total   = Number(item.unit_price) * Number(item.quantity);
  const imgSize = sz.itemImg || 52;
  const qtySize = sz.qtyBtn  || 28;
  const delivered = !!item.delivered;
  return (
    <View style={[styles.itemCard, delivered && styles.itemCardDelivered]}>
      <View style={[styles.itemImg, { width: 120, height: 120 }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <Feather name="image" size={imgSize * 0.5} color="#BBB" />
        )}
      </View>
      <View style={{ flex: 1, marginHorizontal: 20 }}>
        <Text style={[styles.itemName, { fontSize: 26, marginTop: 2 }]} numberOfLines={2}>{item.product_name}</Text>
        <Text style={[styles.itemQty, { fontSize: sz.itemPrice || 11 }]}>R$ {formatMoney(item.unit_price)} cada</Text>

        {!readOnly ? (
          <View style={styles.qtyControls}>
            <Pressable
              onPress={onDecrement}
              android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: qtySize / 2 }}
              style={({ pressed }) => [styles.qtyBtn, { width: 40, height: 40, borderRadius: 12 }, pressed && { opacity: 0.7 }]}
            >
              <Feather name="minus" size={qtySize * 0.5} color={colors.textDark} />
            </Pressable>
            <Text style={[styles.qtyValue, { fontSize: sz.qtyVal || 14 }]}>{item.quantity}</Text>
            <Pressable
              onPress={onIncrement}
              android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: qtySize / 2 }}
              style={({ pressed }) => [styles.qtyBtn, { width: 40, height: 40, borderRadius: 12 }, pressed && { opacity: 0.7 }]}
            >
              <Feather name="plus" size={qtySize * 0.5} color={colors.textDark} />
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.itemQty, { fontSize: sz.itemPrice || 11 }]}>Qtd: {item.quantity}</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.itemTotal, { fontSize: 32, paddingBottom: 2 }]}>R$ {formatMoney(total)}</Text>
        {delivered ? (
          <View style={styles.deliveredTag}>
            <Feather name="check-circle" size={13} color='#0b8b2b' />
            <Text style={styles.deliveredTagText}>Entregue</Text>
          </View>
        ) : <View style={styles.deliveredTagEmpty}></View>}
        {!readOnly ? (
          <View style={styles.itemSideActions}>
            {!delivered && onDeliver ? (
              <Pressable onPress={onDeliver} hitSlop={6} style={styles.deliverBtn} android_ripple={{ color: 'rgba(255,255,255,0.25)' }}>
                <Feather name="check" size={20} color="#FFF" />
                <Text style={styles.deliverText}>Entregar</Text>
              </Pressable>
            ) : null}
            {delivered && onUndeliver ? (
              <Pressable onPress={onUndeliver} hitSlop={6} style={styles.undeliverBtn} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
                <Feather name="rotate-ccw" size={18} color={colors.textMuted} />
                <Text style={styles.undeliverText}>Desfazer entrega</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onRemove}
              android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
              style={({ pressed }) => [styles.itemEdit, pressed && { opacity: 0.7 }]}
            >
              <Feather name="trash-2" size={sz.iconSize || 14} color="#FFF" />
            </Pressable>
          </View>
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

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  content: {
    width: '90%',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6D6',
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginBottom: 16,
    borderRadius: radii.lg,
    width: '100%',
    alignSelf: 'stretch',
  },
  statusDot:  { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.statusYellow, marginRight: 14 },
  statusText: { ...typography.bodyBold, color: colors.textDark, fontSize: 23, lineHeight: 30, textTransform: 'uppercase' },

  twoColRow:   { flexDirection: 'row', gap: 24 },
  twoColLeft:  { flex: 1 },
  twoColRight: { flex: 1 },

  section:      { marginBottom: 30 },
  sectionTitle: { ...typography.bodyBold, color: colors.textDark, fontSize: 24, marginBottom: 14 },
  sectionDivider: {
    height: 2,
    backgroundColor: '#F0EBE4',
    width: '100%',
    marginTop: 2,
    marginBottom: 30,
  },
  inputField: {
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  inputText: {
    lineHeight: 28,
  },
  numberInputWrap: {
    marginBottom: 0,
  },
  labelInputWrap: {
    marginTop: 14,
  },

  infoRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoText: { ...typography.body, color: colors.textDark, marginLeft: 14, fontSize: 19, lineHeight: 27 },

  peopleControls: { flexDirection: 'row', marginLeft: 16 },
  peopleBtn: {
    width: 20, height: 20, borderRadius: 17,
    backgroundColor: '#EFEAE4',
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 5,
    overflow: 'hidden',
  },

  mesaRow:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  mesaSelect: {
    height: 52,
    minWidth: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.inputBg,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  mesaText:     { color: colors.textDark, fontSize: 19 },
  mesaHint:     { color: colors.textMuted, fontSize: 16, lineHeight: 24, flex: 1 },
  tableList:      { marginTop: 14, backgroundColor: '#FFF', borderWidth: 2, borderColor: colors.inputBorder, borderRadius: radii.lg, overflow: 'hidden' },
  tableOpt:       { paddingVertical: 20, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  tableOptPressable: { flex: 1, paddingVertical: 20, paddingHorizontal: 22 },
  tableOptText:   { fontSize: 19, color: colors.textMuted },
  tableOptRow:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  tableDeleteBtn: { paddingHorizontal: 22, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },

  newTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
    gap: 10,
  },
  compactInputField: {
    height: 62,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  compactInputText: {
    fontSize: 19,
  },
  newTableConfirm: {
    width: 58, height: 58, borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  newTableAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
    gap: 10,
  },
  newTableAddText: { color: colors.primary, fontWeight: '700', fontSize: 19 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 14,
  },
  // Item entregue: leve destaque verde à esquerda.
  itemCardDelivered: {
    backgroundColor: '#F1F8F3',
  },

  // Cabeçalhos das sublistas (pendentes / entregues)
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  subHeader:    { ...typography.bodyBold, color: colors.textDark, fontWeight: '800', lineHeight: 27 },
  emptySub:     { color: colors.textMuted, fontStyle: 'italic', paddingVertical: 10, marginBottom: 8, fontSize: 17, lineHeight: 24 },

  deliverAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10 },
  deliverAllText: { color: colors.primary, fontWeight: '700', fontSize: 20 },

  // Botão "Entregar" dentro do card pendente
  deliverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#1E9E54', borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 10, overflow: 'hidden',
  },
  deliverText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  // Botão "Desfazer entrega" dentro do card entregue
  undeliverBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8 },
  undeliverText: { color: colors.textMuted, fontWeight: '700', fontSize: 20, marginRight: 12 },
  // Selo "Entregue" no canto do card
  deliveredTag:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  deliveredTagText: { color: '#0b8b2b', fontWeight: '800', fontSize: 14 },
  itemImg:   { width: 80, height: 80, borderRadius: radii.lg, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemName:  { ...typography.bodyBold, color: colors.textDark, fontSize: 19, lineHeight: 25 },
  itemQty:   { color: colors.textMuted, fontSize: 16, marginTop: 5 },
  itemTotal: { color: colors.primary, fontWeight: '800', fontSize: 20 },
  itemSideActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  itemEdit:  {
    width: 42, height: 42, borderRadius: radii.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  qtyControls: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFEAE4',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  qtyValue: {
    minWidth: 36,
    textAlign: 'center',
    color: colors.textDark,
    fontWeight: '800',
    fontSize: 18,
    marginHorizontal: 8,
  },

  itemActions: { flexDirection: 'row', marginTop: 14 },
  actionButton: { flex: 1, height: 70, borderRadius: radii.lg },
  actionButtonText: { fontSize: 22 },
  actionSpacer: { width: 14 },
  closeHint:   { color: '#E8C44E', fontSize: 16, lineHeight: 22, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  empty:       { color: colors.textMuted, fontStyle: 'italic', paddingVertical: 12, fontSize: 18, lineHeight: 25 },

  footer: {
    position: 'absolute',
    width: '100%',
    alignSelf: 'center', bottom: 0,
    backgroundColor: colors.bgDark,
    paddingHorizontal: 34,
    paddingTop: 20
  },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, marginTop: 12 },
  footerActions: { flexDirection: 'row', alignItems: 'center' },
  footerButton: { height: 70, borderRadius: radii.lg },
  footerButtonText: { fontSize: 24 },
  footerSpacer: { width: 14 },
  totalLabel:    { color: '#FFF', fontSize: 19 },
  totalValue:    { color: colors.primary, fontSize: 34, fontWeight: '900' },
  totalSubLabel: { color: '#CCC', fontSize: 16 },
  totalSubValue: { color: '#FFF', fontSize: 19 },
    emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingBottom: 18,
    paddingHorizontal: 0,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 22,
    lineHeight: 28,
    paddingTop: 10,
    paddingBottom: 6,
    textAlign: 'center',
  },
  deliveredTagEmpty: {
    height: 12,
    marginTop: 6
  }
});
