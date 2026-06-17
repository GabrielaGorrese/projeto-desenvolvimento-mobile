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

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

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
  const minSide = Math.min(r.width, r.height);
  const s = (value) => scaleSize(value, minSide);

  // Campos opcionais (ligados/desligados nas configurações). Lidos no mount.
  const showTable = getShowTable();
  const showLabel = getShowLabel();
  const twoCol = r.isLandscape && r.width >= 800;

  const sz = useMemo(() => ({
    section:   s(26),
    body:      s(22),
    bodyBold:  s(22),
    caption:   s(18),
    inputH:    s(86),
    inputPad:  s(24),
    iconSize:  s(28),
    peopleBtn: s(32),
    mesaH:     s(78),
    mesaMinW:  s(230),
    itemImg:   s(120),
    itemName:  s(26),
    itemPrice: s(18),
    itemTotal: s(32),
    qtyBtn:    s(40),
    qtyBtnRadius: s(12),
    qtyVal:    s(23),
    totalBig:  s(44),
    totalSub:  s(22),
    numberInputH: s(64),
    scrollPadH: s(16),
    scrollPadTop: s(16),
    scrollPadBottom: s(220),
    sectionMarginBottom: s(30),
    sectionTitleMarginBottom: s(14),
    sectionTitleMarginTop: s(18),
    infoSectionTitleMarginBottom: s(30),
    sectionDividerMarginTop: s(2),
    sectionDividerMarginBottom: s(30),
    sectionDividerLargeMarginTop: s(48),
    sectionDividerLargeMarginBottom: s(12),
    infoRowMarginBottom: s(16),
    infoTextMarginLeft: s(14),
    infoLineHeight: s(27),
    peopleControlsMarginLeft: s(16),
    peopleBtnRadius: s(9),
    peopleBtnMarginH: s(5),
    mesaRowGap: s(16),
    mesaSelectPaddingH: s(22),
    mesaSelectMarginTop: s(6),
    chevronSize: s(18),
    tableListMaxHeight: s(280),
    tableListMarginTop: s(14),
    tableOptPaddingV: s(20),
    tableOptPaddingH: s(22),
    tableDeletePaddingH: s(22),
    tableDeletePaddingV: s(20),
    newTableRowPadding: s(14),
    newTableRowGap: s(10),
    compactInputH: s(62),
    compactInputPadH: s(18),
    compactInputFont: s(19),
    newTableConfirmSize: s(58),
    newTableAddPaddingV: s(18),
    newTableAddPaddingH: s(22),
    newTableAddGap: s(10),
    newTableAddFont: s(19),
    newTableIconSize: s(18),
    newTableActionIcon: s(20),
    labelInputMarginTop: s(14),
    subHeaderMarginBottom: s(14),
    subHeaderMarginTop: s(18),
    subHeaderDeliveredMarginBottom: s(24),
    deliverAllIcon: s(22),
    deliverAllFont: s(20),
    deliverAllPaddingV: s(8),
    deliverAllPaddingH: s(10),
    deliverAllGap: s(8),
    emptySubFont: s(17),
    emptySubLineHeight: s(24),
    emptySubPaddingV: s(10),
    emptySubMarginBottom: s(8),
    emptySubNegativeMarginTop: s(-12),
    actionButtonHeight: s(70),
    actionButtonFont: s(22),
    actionSpacer: s(14),
    actionIconSize: s(26),
    addIconSize: s(28),
    itemActionsMarginTop: s(14),
    itemCardPadding: s(18),
    itemCardMarginBottom: s(14),
    itemContentMarginH: s(20),
    itemNameMarginTop: s(2),
    itemQtyMarginTop: s(5),
    itemTotalPaddingBottom: s(2),
    deliveredTagGap: s(5),
    deliveredTagMarginTop: s(8),
    deliveredTagIcon: s(13),
    deliveredTagFont: s(14),
    deliveredTagEmptyHeight: s(12),
    deliveredTagEmptyMarginTop: s(6),
    deliverBtnGap: s(6),
    deliverBtnPaddingH: s(16),
    deliverBtnPaddingV: s(10),
    deliverBtnIcon: s(20),
    deliverBtnFont: s(16),
    undeliverGap: s(8),
    undeliverPaddingV: s(8),
    undeliverIcon: s(18),
    undeliverFont: s(20),
    undeliverTextMarginRight: s(12),
    itemSideActionsGap: s(10),
    itemSideActionsMarginTop: s(10),
    itemEditSize: s(42),
    qtyControlsMarginTop: s(12),
    qtyValueMinWidth: s(36),
    qtyValueMarginH: s(8),
    qtyValueFont: s(18),
    footerPaddingH: s(34),
    footerPaddingTop: s(20),
    footerPaddingBottom: s(22),
    footerPaddingBottomKb: s(16),
    footerButtonHeight: s(70),
    footerButtonFont: s(24),
    footerSpacer: s(14),
    totalRowMarginBottom: s(32),
    totalRowMarginTop: s(12),
    closeHintFont: s(16),
    closeHintLineHeight: s(22),
    closeHintMarginTop: s(10),
    reopenIconSize: s(26),
    emptyImage: s(76),
    emptyFont: s(22),
    emptyLineHeight: s(28),
    emptyPaddingTop: s(10),
    emptyPaddingBottom: s(6),
    emptyWrapPaddingBottom: s(18),
    loadingMarginTop: s(60),
    twoColGap: s(24),
    scrollIntoViewOffset: s(16),
  }), [minSide]);

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
        (_x, y) => scroll.scrollTo({ y: Math.max(0, y - sz.scrollIntoViewOffset), animated: true }),
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
    const subs = [
      onSocket('order:closed', onGone),
      onSocket('order:deleted', onGone),
      onSocket('order:updated', onUpdated),
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
        <ActivityIndicator style={{ marginTop: sz.loadingMarginTop }} color={colors.primary} />
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
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: sz.scrollPadH,
            paddingTop: sz.scrollPadTop,
            paddingBottom: sz.scrollPadBottom + kbHeight,
          },
        ]}
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
            <Text style={[styles.sectionTitle, { fontSize: sz.section, marginTop: sz.sectionTitleMarginTop }]}>Número da comanda</Text>
            <Input
              ref={numberInputRef}
              value={dailyNumber}
              onChangeText={updateDailyNumber}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Ex.: 1, 2, 3..."
              onFocus={() => scrollInputIntoView(numberInputRef)}
              fieldStyle={[styles.inputField, { height: sz.numberInputH, paddingHorizontal: sz.inputPad }]}
              inputStyle={[styles.inputText, { fontSize: sz.body, lineHeight: sz.infoLineHeight }]}
              style={[styles.numberInputWrap, { maxWidth: '100%' }]}
            />
          </View>
        ) : null}

        <View style={[styles.sectionDivider, { marginTop: sz.sectionDividerMarginTop, marginBottom: sz.sectionDividerMarginBottom }]} />  

        <View style={twoCol ? [styles.twoColRow, { gap: sz.twoColGap }] : null}>
        <View style={twoCol ? styles.twoColLeft : null}>
        <View style={[styles.section, { marginBottom: sz.sectionMarginBottom }]}>
          <Text style={[styles.sectionTitle, { fontSize: sz.section, marginBottom: sz.infoSectionTitleMarginBottom }]}>Informações</Text>
          <Row icon="edit-3" text={order?.attendant || user?.username || '—'} sz={sz} />
          <View style={[styles.infoRow, { marginBottom: sz.infoRowMarginBottom }]}>
            <Feather name="users" size={sz.iconSize} color={colors.textDark} />
            <Text style={[styles.infoText, { fontSize: sz.body, marginLeft: sz.infoTextMarginLeft, lineHeight: sz.infoLineHeight }]}>
              {String(people).padStart(2, '0')} {people === 1 ? 'pessoa' : 'pessoas'}
            </Text>
            {!readOnly ? (
              <View style={[styles.peopleControls, { marginLeft: sz.peopleControlsMarginLeft }]}>
                <Pressable
                  onPress={() => setPeople((p) => Math.max(1, p - 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: sz.peopleBtn / 2 }}
                  style={[
                    styles.peopleBtn,
                    {
                      width: sz.peopleBtn,
                      height: sz.peopleBtn,
                      borderRadius: sz.peopleBtnRadius,
                      marginHorizontal: sz.peopleBtnMarginH,
                    },
                  ]}
                >
                  <Feather name="minus" size={sz.iconSize} color={colors.textDark} />
                </Pressable>
                <Pressable
                  onPress={() => setPeople((p) => Math.min(99, p + 1))}
                  android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: sz.peopleBtn / 2 }}
                  style={[
                    styles.peopleBtn,
                    {
                      width: sz.peopleBtn,
                      height: sz.peopleBtn,
                      borderRadius: sz.peopleBtnRadius,
                      marginHorizontal: sz.peopleBtnMarginH,
                    },
                  ]}
                >
                  <Feather name="plus" size={sz.iconSize} color={colors.textDark} />
                </Pressable>
              </View>
            ) : null}
          </View>
          <Row icon="clock" text={`Aberta às ${createdTimeStr}`} sz={sz} />
        </View>

        <View style={[styles.sectionDivider, { marginTop: sz.sectionDividerMarginTop, marginBottom: sz.sectionDividerMarginBottom }]} />        

        {showTable ? (
        <View style={[styles.section, { marginBottom: sz.sectionMarginBottom }]}>
          <Text style={[styles.sectionTitle, { fontSize: sz.section, marginBottom: sz.sectionTitleMarginBottom }]}>Mesa</Text>
          <View style={[styles.mesaRow, { gap: sz.mesaRowGap }]}>
            <Pressable
              onPress={() => !readOnly && setShowTablePicker((v) => !v)}
              style={[
                styles.mesaSelect,
                {
                  height: sz.mesaH,
                  minWidth: sz.mesaMinW,
                  paddingHorizontal: sz.mesaSelectPaddingH,
                  marginTop: sz.mesaSelectMarginTop,
                },
              ]}
            >
              <Text style={[styles.mesaText, { fontSize: sz.body }, !tableLabel && { color: colors.textMuted }]}>
                {tableLabel || 'Selecionar...'}
              </Text>
              <Feather name="chevron-down" size={sz.chevronSize} color={colors.textMuted} />
            </Pressable>
            <Text style={[styles.mesaHint, { fontSize: sz.caption, lineHeight: sz.infoLineHeight }]}>
              <Feather name="info" size={sz.caption} color={colors.textMuted} />  Deixe nulo para pedido avulso.
            </Text>
          </View>

          {showTablePicker ? (
            <View style={[styles.tableList, { marginTop: sz.tableListMarginTop }]}>
              <ScrollView
                style={{ maxHeight: sz.tableListMaxHeight }}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  onPress={() => { setTableId(null); setShowTablePicker(false); }}
                  android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                  style={[styles.tableOpt, { paddingVertical: sz.tableOptPaddingV, paddingHorizontal: sz.tableOptPaddingH }]}
                >
                  <Text style={[styles.tableOptText, { fontSize: sz.body }]}>Sem mesa</Text>
                </Pressable>
                {tables.filter((t) => t.is_active).map((t) => (
                  <View key={t.id} style={styles.tableOptRow}>
                    <Pressable
                      onPress={() => { setTableId(t.id); setShowTablePicker(false); }}
                      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                      style={[styles.tableOptPressable, { paddingVertical: sz.tableOptPaddingV, paddingHorizontal: sz.tableOptPaddingH }]}
                    >
                      <Text style={[styles.tableOptText, { fontSize: sz.body, color: colors.textDark }]}>{t.label}</Text>
                    </Pressable>
                    {isManager && !readOnly ? (
                      <Pressable
                        onPress={() => setConfirmDeleteTable(t)}
                        hitSlop={8}
                        style={[styles.tableDeleteBtn, { paddingHorizontal: sz.tableDeletePaddingH, paddingVertical: sz.tableDeletePaddingV }]}
                        android_ripple={{ color: 'rgba(255,0,0,0.08)', borderless: true, radius: 20 }}
                      >
                        <Feather name="trash-2" size={sz.chevronSize} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </ScrollView>

              {/* Criação rápida de mesa — visível apenas para gerentes */}
              {isManager && !readOnly ? (
                showNewTable ? (
                  <View style={[styles.newTableRow, { padding: sz.newTableRowPadding, gap: sz.newTableRowGap }]}>
                    <Input
                      value={newTableLabel}
                      onChangeText={setNewTableLabel}
                      placeholder="Nome da mesa..."
                      autoFocus
                      fieldStyle={[styles.compactInputField, { height: sz.compactInputH, paddingHorizontal: sz.compactInputPadH }]}
                      inputStyle={[styles.compactInputText, { fontSize: sz.compactInputFont }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    />
                    <Pressable
                      onPress={doCreateTable}
                      style={[styles.newTableConfirm, { width: sz.newTableConfirmSize, height: sz.newTableConfirmSize }]}
                      android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {creatingTable
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Feather name="check" size={sz.newTableActionIcon} color="#FFF" />}
                    </Pressable>
                    <Pressable
                      onPress={() => { setShowNewTable(false); setNewTableLabel(''); }}
                      style={[styles.newTableConfirm, { width: sz.newTableConfirmSize, height: sz.newTableConfirmSize, backgroundColor: '#888', marginLeft: sz.newTableRowGap }]}
                    >
                      <Feather name="x" size={sz.newTableActionIcon} color="#FFF" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowNewTable(true)}
                    style={[styles.newTableAdd, { paddingVertical: sz.newTableAddPaddingV, paddingHorizontal: sz.newTableAddPaddingH, gap: sz.newTableAddGap }]}
                    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                  >
                    <Feather name="plus" size={sz.newTableIconSize} color={colors.primary} />
                    <Text style={[styles.newTableAddText, { fontSize: sz.newTableAddFont }]}>Nova mesa</Text>
                  </Pressable>
                )
              ) : null}
            </View>
          ) : null}
          
          <View
            style={[
              styles.sectionDivider,
              {
                marginTop: sz.sectionDividerLargeMarginTop,
                marginBottom: sz.sectionDividerLargeMarginBottom,
              },
            ]}
          />  

          </View>
        
        ) : null}

        {showLabel ? (
          <View style={[styles.section, { marginBottom: sz.sectionMarginBottom }]}>
            <Text style={[styles.sectionTitle, { fontSize: sz.section, marginBottom: sz.sectionTitleMarginBottom }]}>Identificação (opcional)</Text>
          <Input
            ref={labelInputRef}
            value={label}
            onChangeText={setLabel}
            placeholder='Ex.: "João", "Balcão"'
            editable={!readOnly}
            onFocus={() => scrollInputIntoView(labelInputRef)}
            fieldStyle={[styles.inputField, { height: sz.inputH, paddingHorizontal: sz.inputPad }]}
            inputStyle={[styles.inputText, { fontSize: sz.body, lineHeight: sz.infoLineHeight }]}
            style={[styles.labelInputWrap, { marginTop: sz.labelInputMarginTop }]}
          />
        </View>
        ) : null}
        </View>

        <View style={twoCol ? styles.twoColRight : null}>
        <View style={[styles.section, { marginBottom: sz.sectionMarginBottom }]}>
          <Text style={[styles.sectionTitle, { fontSize: sz.section, marginBottom: sz.sectionTitleMarginBottom }]}>Itens</Text>
          {items.length === 0 ? (
            <EmptySection text={'Nenhum item adicionado'} sz={sz} />
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
                <View style={[styles.subHeaderRow, { marginBottom: sz.subHeaderMarginBottom }]}>
                  <Text style={[styles.subHeader, { fontSize: sz.body, color: '#797979' }]}>Itens pendentes ({pendingCards.length})</Text>
                  {!readOnly && !isNew && pendingCards.length > 0 ? (
                    <Pressable
                      onPress={deliverAllItems}
                      hitSlop={8}
                      style={[
                        styles.deliverAllBtn,
                        {
                          gap: sz.deliverAllGap,
                          paddingVertical: sz.deliverAllPaddingV,
                          paddingHorizontal: sz.deliverAllPaddingH,
                        },
                      ]}
                      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                    >
                      <Feather name="check-circle" size={sz.deliverAllIcon} color={colors.primary} />
                      <Text style={[styles.deliverAllText, { fontSize: sz.deliverAllFont }]}>Entregar todos</Text>
                    </Pressable>
                  ) : null}
                </View>
                {pendingCards.length ? pendingCards : (
                  <Text
                    style={[
                      styles.emptySub,
                      {
                        fontSize: sz.emptySubFont,
                        lineHeight: sz.emptySubLineHeight,
                        paddingVertical: sz.emptySubPaddingV,
                        marginBottom: sz.emptySubMarginBottom,
                      },
                    ]}
                  >
                    Nenhum item pendente.
                  </Text>
                )}

                <Text
                  style={[
                    styles.subHeader,
                    {
                      fontSize: sz.body,
                      marginTop: sz.subHeaderMarginTop,
                      marginBottom: sz.subHeaderDeliveredMarginBottom,
                      color: '#797979',
                    },
                  ]}
                >
                  Itens entregues ({deliveredCards.length})
                </Text>
                {deliveredCards.length ? deliveredCards : (
                  <Text
                    style={[
                      styles.emptySub,
                      {
                        fontSize: sz.emptySubFont,
                        lineHeight: sz.emptySubLineHeight,
                        paddingVertical: sz.emptySubPaddingV,
                        marginBottom: sz.emptySubMarginBottom,
                        marginTop: sz.emptySubNegativeMarginTop,
                      },
                    ]}
                  >
                    Nenhum item entregue.
                  </Text>
                )}
              </View>
            );
          })()}
          
          <View
            style={[
              styles.sectionDivider,
              {
                marginTop: sz.sectionDividerLargeMarginTop,
                marginBottom: sz.sectionDividerLargeMarginBottom,
              },
            ]}
          />  

          {!readOnly ? (
            <View style={[styles.itemActions, { marginTop: sz.itemActionsMarginTop }]}>
              <Button
                title="Limpar"
                variant="ghost"
                onPress={onClear}
                icon={<Feather name="x-circle" size={sz.actionIconSize} color={colors.textDark} />}
                size="lg"
                style={[styles.actionButton, { height: sz.actionButtonHeight }]}
                textStyle={[styles.actionButtonText, { fontSize: sz.actionButtonFont }]}
              />
              <View style={[styles.actionSpacer, { width: sz.actionSpacer }]} />
              <Button
                title="Adicionar novo item"
                onPress={goAddItems}
                icon={<Feather name="plus-circle" size={sz.addIconSize} color="#FFF" />}
                size="lg"
                style={[styles.actionButton, { height: sz.actionButtonHeight }]}
                textStyle={[styles.actionButtonText, { fontSize: sz.actionButtonFont }]}
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
            paddingHorizontal: sz.footerPaddingH,
            paddingTop: sz.footerPaddingTop,
            paddingBottom: kbHeight > 0 ? sz.footerPaddingBottomKb : sz.footerPaddingBottom + insets.bottom,
          },
        ]}
      >
        <View style={[styles.totalRow, { marginBottom: sz.totalRowMarginBottom, marginTop: sz.totalRowMarginTop }]}>
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
              style={[styles.footerButton, { height: sz.footerButtonHeight }]}
              textStyle={[styles.footerButtonText, { fontSize: sz.footerButtonFont }]}
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
                  textStyle={[styles.footerButtonText, { fontSize: sz.footerButtonFont, color: '#FFF' }]}
                  style={[styles.footerButton, { height: sz.footerButtonHeight, borderColor: '#FFF' }]}
                />
              </View>
              <View style={[styles.footerSpacer, { width: sz.footerSpacer }]} />
              <View style={{ flex: 1 }}>
                <Button
                  title="Fechar comanda"
                  onPress={onPrimary}
                  loading={busy}
                  size="lg"
                  style={[styles.footerButton, { height: sz.footerButtonHeight }]}
                  textStyle={[styles.footerButtonText, { fontSize: sz.footerButtonFont }]}
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
                textStyle={[styles.footerButtonText, { fontSize: sz.footerButtonFont, color: '#FFF' }]}
                style={[styles.footerButton, { height: sz.footerButtonHeight, borderColor: '#FFF' }]}
              />
              <Text style={[styles.closeHint, { fontSize: sz.closeHintFont, lineHeight: sz.closeHintLineHeight, marginTop: sz.closeHintMarginTop }]}>
                Entregue todos os itens para poder fechar a comanda.
              </Text>
            </>
          )
        ) : isManager ? (
          <Button
            title="Reabrir comanda"
            onPress={() => setConfirmModal('reopen')}
            loading={busy}
            icon={<Feather name="rotate-ccw" size={sz.reopenIconSize} color="#FFF" />}
            size="lg"
            style={[styles.footerButton, { height: sz.footerButtonHeight }]}
            textStyle={[styles.footerButtonText, { fontSize: sz.footerButtonFont }]}
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

function EmptySection({ text, sz }) {
  return (
    <View style={[styles.emptyWrap, { paddingBottom: sz.emptyWrapPaddingBottom }]}>
      <Image
        source={require('../../assets/vazio.png')}
        style={{ width: sz.emptyImage, height: sz.emptyImage, marginTop: sz.emptyPaddingTop }}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.empty,
          {
            fontSize: sz.emptyFont,
            lineHeight: sz.emptyLineHeight,
            paddingTop: sz.emptyPaddingTop,
            paddingBottom: sz.emptyPaddingBottom,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function Row({ icon, text, sz = {} }) {
  return (
    <View style={[styles.infoRow, sz.infoRowMarginBottom && { marginBottom: sz.infoRowMarginBottom }]}>
      <Feather name={icon} size={sz.iconSize || 14} color={colors.textDark} />
      <Text
        style={[
          styles.infoText,
          sz.body && { fontSize: sz.body, marginLeft: sz.infoTextMarginLeft, lineHeight: sz.infoLineHeight },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function ItemCard({ item, onRemove, onIncrement, onDecrement, onDeliver, onUndeliver, readOnly, sz = {} }) {
  const total   = Number(item.unit_price) * Number(item.quantity);
  const imgSize = sz.itemImg || 52;
  const qtySize = sz.qtyBtn  || 28;
  const delivered = !!item.delivered;
  return (
    <View style={[styles.itemCard, delivered && styles.itemCardDelivered, { padding: sz.itemCardPadding, marginBottom: sz.itemCardMarginBottom }]}>
      <View style={[styles.itemImg, { width: imgSize, height: imgSize }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <Feather name="image" size={imgSize * 0.5} color="#BBB" />
        )}
      </View>
      <View style={{ flex: 1, marginHorizontal: sz.itemContentMarginH }}>
        <Text style={[styles.itemName, { fontSize: sz.itemName, marginTop: sz.itemNameMarginTop, lineHeight: sz.itemName * 0.96 }]} numberOfLines={2}>{item.product_name}</Text>
        <Text style={[styles.itemQty, { fontSize: sz.itemPrice, marginTop: sz.itemQtyMarginTop }]}>R$ {formatMoney(item.unit_price)} cada</Text>

        {!readOnly ? (
          <View style={[styles.qtyControls, { marginTop: sz.qtyControlsMarginTop }]}>
            <Pressable
              onPress={onDecrement}
              android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: qtySize / 2 }}
              style={({ pressed }) => [
                styles.qtyBtn,
                {
                  width: qtySize,
                  height: qtySize,
                  borderRadius: sz.qtyBtnRadius,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="minus" size={qtySize * 0.5} color={colors.textDark} />
            </Pressable>
            <Text
              style={[
                styles.qtyValue,
                {
                  fontSize: sz.qtyVal,
                  minWidth: sz.qtyValueMinWidth,
                  marginHorizontal: sz.qtyValueMarginH,
                },
              ]}
            >
              {item.quantity}
            </Text>
            <Pressable
              onPress={onIncrement}
              android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: true, radius: qtySize / 2 }}
              style={({ pressed }) => [
                styles.qtyBtn,
                {
                  width: qtySize,
                  height: qtySize,
                  borderRadius: sz.qtyBtnRadius,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="plus" size={qtySize * 0.5} color={colors.textDark} />
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.itemQty, { fontSize: sz.itemPrice, marginTop: sz.itemQtyMarginTop }]}>Qtd: {item.quantity}</Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.itemTotal, { fontSize: sz.itemTotal, paddingBottom: sz.itemTotalPaddingBottom }]}>R$ {formatMoney(total)}</Text>
        {delivered ? (
          <View style={[styles.deliveredTag, { gap: sz.deliveredTagGap, marginTop: sz.deliveredTagMarginTop }]}>
            <Feather name="check-circle" size={sz.deliveredTagIcon} color='#0b8b2b' />
            <Text style={[styles.deliveredTagText, { fontSize: sz.deliveredTagFont }]}>Entregue</Text>
          </View>
        ) : (
          <View style={[styles.deliveredTagEmpty, { height: sz.deliveredTagEmptyHeight, marginTop: sz.deliveredTagEmptyMarginTop }]} />
        )}
        {!readOnly ? (
          <View style={[styles.itemSideActions, { gap: sz.itemSideActionsGap, marginTop: sz.itemSideActionsMarginTop }]}>
            {!delivered && onDeliver ? (
              <Pressable
                onPress={onDeliver}
                hitSlop={6}
                style={[
                  styles.deliverBtn,
                  {
                    gap: sz.deliverBtnGap,
                    paddingHorizontal: sz.deliverBtnPaddingH,
                    paddingVertical: sz.deliverBtnPaddingV,
                  },
                ]}
                android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
              >
                <Feather name="check" size={sz.deliverBtnIcon} color="#FFF" />
                <Text style={[styles.deliverText, { fontSize: sz.deliverBtnFont }]}>Entregar</Text>
              </Pressable>
            ) : null}
            {delivered && onUndeliver ? (
              <Pressable
                onPress={onUndeliver}
                hitSlop={6}
                style={[styles.undeliverBtn, { gap: sz.undeliverGap, paddingVertical: sz.undeliverPaddingV }]}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                <Feather name="rotate-ccw" size={sz.undeliverIcon} color={colors.textMuted} />
                <Text style={[styles.undeliverText, { fontSize: sz.undeliverFont, marginRight: sz.undeliverTextMarginRight }]}>Desfazer entrega</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onRemove}
              android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 18 }}
              style={({ pressed }) => [
                styles.itemEdit,
                { width: sz.itemEditSize, height: sz.itemEditSize },
                pressed && { opacity: 0.7 },
              ]}
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

  twoColRow:   { flexDirection: 'row' },
  twoColLeft:  { flex: 1 },
  twoColRight: { flex: 1 },

  section:      {},
  sectionTitle: { ...typography.bodyBold, color: colors.textDark },
  sectionDivider: {
    height: 2,
    backgroundColor: '#F0EBE4',
    width: '100%',
  },
  inputField: {
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  inputText: {},
  numberInputWrap: {
    marginBottom: 0,
  },
  labelInputWrap: {},

  infoRow:  { flexDirection: 'row', alignItems: 'center' },
  infoText: { ...typography.body, color: colors.textDark },

  peopleControls: { flexDirection: 'row' },
  peopleBtn: {
    backgroundColor: '#EFEAE4',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  mesaRow:   { flexDirection: 'row', alignItems: 'center' },
  mesaSelect: {
    borderRadius: radii.lg,
    backgroundColor: colors.inputBg,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mesaText:     { color: colors.textDark },
  mesaHint:     { color: colors.textMuted, flex: 1 },
  tableList:      { backgroundColor: '#FFF', borderWidth: 2, borderColor: colors.inputBorder, borderRadius: radii.lg, overflow: 'hidden' },
  tableOpt:       { borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  tableOptPressable: { flex: 1 },
  tableOptText:   { color: colors.textMuted },
  tableOptRow:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  tableDeleteBtn: { alignItems: 'center', justifyContent: 'center' },

  newTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
  },
  compactInputField: {
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  compactInputText: {},
  newTableConfirm: {
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  newTableAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE4',
  },
  newTableAddText: { color: colors.primary, fontWeight: '700' },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: radii.lg,
  },
  // Item entregue: leve destaque verde à esquerda.
  itemCardDelivered: {
    backgroundColor: '#F1F8F3',
  },

  // Cabeçalhos das sublistas (pendentes / entregues)
  subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subHeader:    { ...typography.bodyBold, color: colors.textDark, fontWeight: '800' },
  emptySub:     { color: colors.textMuted, fontStyle: 'italic' },

  deliverAllBtn:  { flexDirection: 'row', alignItems: 'center' },
  deliverAllText: { color: colors.primary, fontWeight: '700' },

  deliverBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#1E9E54', borderRadius: radii.md,
    overflow: 'hidden',
  },
  deliverText: { color: '#FFF', fontWeight: '800' },
  undeliverBtn:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  undeliverText: { color: colors.textMuted, fontWeight: '700' },
  deliveredTag:     { flexDirection: 'row', alignItems: 'center' },
  deliveredTagText: { color: '#0b8b2b', fontWeight: '800' },
  itemImg:   { borderRadius: radii.lg, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemName:  { ...typography.bodyBold, color: colors.textDark },
  itemQty:   { color: colors.textMuted },
  itemTotal: { color: colors.primary, fontWeight: '800' },
  itemSideActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  itemEdit:  {
    borderRadius: radii.md,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    backgroundColor: '#EFEAE4',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  qtyValue: {
    textAlign: 'center',
    color: colors.textDark,
    fontWeight: '800',
  },

  itemActions: { flexDirection: 'row' },
  actionButton: { flex: 1, borderRadius: radii.lg },
  actionButtonText: {},
  actionSpacer: {},
  closeHint:   { color: '#E8C44E', fontWeight: '600', textAlign: 'center' },

  footer: {
    position: 'absolute',
    width: '100%',
    alignSelf: 'center', bottom: 0,
    backgroundColor: colors.bgDark,
  },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerActions: { flexDirection: 'row', alignItems: 'center' },
  footerButton: { borderRadius: radii.lg },
  footerButtonText: {},
  footerSpacer: {},
  totalLabel:    { color: '#FFF' },
  totalValue:    { color: colors.primary, fontWeight: '900' },
  totalSubLabel: { color: '#CCC' },
  totalSubValue: { color: '#FFF' },
    emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
    paddingHorizontal: 0,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  deliveredTagEmpty: {},
});
