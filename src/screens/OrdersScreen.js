import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import SearchHeader from '../components/SearchHeader';
import OrderTile from '../components/OrderTile';
import PendingOrderRow from '../components/PendingOrderRow';
import BottomBar from '../components/BottomBar';
import Fab from '../components/Fab';
import FeedbackModal from '../components/FeedbackModal';
import ConfirmModal from '../components/ConfirmModal';
import FiltersSheet from '../components/FiltersSheet';
import { colors, typography } from '../theme';
import {
  fetchOpenOrders,
  fetchClosedOrders,
  resetOrderSequence,
  deliverItems,
  deliverAll,
} from '../services/ordersService';
import { onSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

const REF_MIN_SIDE = 820;

function scaleSize(value, minSide) {
  const factor = Math.min(1.35, Math.max(0.72, minSide / REF_MIN_SIDE));
  return Math.round(value * factor);
}

const INITIAL_FILTERS = {
  color:     'all',
  attendant: 'all',
  table:     'all',
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SMOOTH_LAYOUT = {
  duration: 220,
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

export default function OrdersScreen({ navigation, route }) {
  const { signOut } = useAuth();
  const r = useResponsive();
  const minSide = Math.min(r.width, r.height);
  const contentWidth = r.isTablet ? Math.min(r.width - 32, 1100) : r.contentMaxWidth;
  const ui = {
    scrollPadH: scaleSize(24, minSide),
    scrollPadTop: scaleSize(34, minSide),
    scrollPadBottom: scaleSize(120, minSide),
    loadingMarginTop: scaleSize(40, minSide),
    sectionTitle: scaleSize(26, minSide),
    sectionCountMargin: scaleSize(12, minSide),
    sectionHeaderMarginBottom: scaleSize(14, minSide),
    pendingListMarginTop: scaleSize(14, minSide),
    dividerMargin: scaleSize(24, minSide),
    emptyImage: scaleSize(76, minSide),
    emptyFont: scaleSize(22, minSide),
    emptyLineHeight: scaleSize(28, minSide),
    emptyPaddingTop: scaleSize(10, minSide),
    emptyPaddingBottom: scaleSize(18, minSide),
    emptyWrapPaddingV: scaleSize(24, minSide),
    emptyImageMarginTop: scaleSize(12, minSide),
  };
  const [open,    setOpen]    = useState([]);
  const [closed,  setClosed]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [search,  setSearch]  = useState('');
  const [newOrderId, setNewOrderId] = useState(route.params?.justCreatedId || null);
  const [newOrderNumber] = useState(route.params?.justCreatedNumber ?? route.params?.justCreatedId ?? null);
  const [createdModal, setCreatedModal] = useState(!!route.params?.justCreatedId);
  const [resetModal,  setResetModal]  = useState(false); // confirmação "novo dia"
  const [resetting,   setResetting]   = useState(false); // chamada em andamento
  const [resetResult, setResetResult] = useState(null);  // mensagem de sucesso
  const [resetError,  setResetError]  = useState(null);  // mensagem de erro
  const [deliverError, setDeliverError] = useState(null);

  // Filtros (modal)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters,     setFilters]     = useState(INITIAL_FILTERS);

  const loadingRef = useRef(false);
  const load = useCallback(async () => {
    if (loadingRef.current) { setRefresh(false); return; }
    loadingRef.current = true;
    try {
      const [o, c] = await Promise.all([
        fetchOpenOrders({ limit: 100 }),
        fetchClosedOrders({ limit: 100 }),
      ]);
      setOpen(o.orders || []);
      setClosed(c.orders || []);
    } catch (err) {
      console.warn('orders load', err?.uiMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefresh(false);
    }
  }, []);

 
  useFocusEffect(useCallback(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]));

  const upsertOrder = useCallback((order) => {
    if (!order || order.id == null) return;
    const closed = order.status === 'closed';
    LayoutAnimation.configureNext(SMOOTH_LAYOUT);
    setOpen((prev) => {
      if (closed) return prev.filter((o) => o.id !== order.id);
      if (prev.some((o) => o.id === order.id)) {
        return prev.map((o) => (o.id === order.id ? order : o));
      }
      return [...prev, order];
    });
    setClosed((prev) => {
      const without = prev.filter((o) => o.id !== order.id);
      return closed ? [order, ...without] : without;
    });
  }, []);

  const removeOrder = useCallback((id) => {
    if (id == null) return;
    LayoutAnimation.configureNext(SMOOTH_LAYOUT);
    setOpen((prev) => prev.filter((o) => o.id !== id));
    setClosed((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleDeliverItem = useCallback(async (orderId, itemId) => {
    try {
      const updated = await deliverItems(orderId, [itemId]);
      upsertOrder(updated);
    } catch (err) {
      setDeliverError(err?.uiMessage || 'Erro ao entregar item.');
    }
  }, [upsertOrder]);

  const handleDeliverAll = useCallback(async (orderId) => {
    try {
      const updated = await deliverAll(orderId);
      upsertOrder(updated);
    } catch (err) {
      setDeliverError(err?.uiMessage || 'Erro ao entregar os itens.');
    }
  }, [upsertOrder]);

  useEffect(() => {
    const onUpsert  = (order)   => upsertOrder(order);
    const onDeleted = (payload) => removeOrder(payload?.id);
    const onConnect = () => load();
    const subs = [
      onSocket('order:created', onUpsert),
      onSocket('order:updated', onUpsert),
      onSocket('order:closed',  onUpsert),
      onSocket('order:deleted', onDeleted),
      onSocket('connect',       onConnect),
    ];
    return () => subs.forEach((off) => off());
  }, [upsertOrder, removeOrder, load]);

  // Lista dinâmica de atendentes e mesas que apareceram nas comandas carregadas.
  // Atualiza automaticamente conforme novas comandas chegam.
  const attendants = useMemo(() => {
    const set = new Set();
    [...open, ...closed].forEach((o) => o.attendant && set.add(o.attendant));
    return Array.from(set).sort();
  }, [open, closed]);

  const tables = useMemo(() => {
    const set = new Set();
    [...open, ...closed].forEach((o) => o.table_label && set.add(o.table_label));
    return Array.from(set).sort();
  }, [open, closed]);

  const filteredOpen   = applyFilters(open,   search, filters);
  const filteredClosed = applyFilters(closed, search, filters);

  // Uma comanda aberta pode estar em Pendentes e Entregues ao mesmo tempo
  // (entrega parcial). Derivado dos contadores que o back retorna.
  const pendentes = filteredOpen.filter((o) => (o.pending_count   ?? 0) > 0);
  const entregues = filteredOpen.filter((o) => (o.delivered_count ?? 0) > 0);

  // Conta quantos filtros estão ativos (≠ 'all') — vira badge sobre o ícone.
  const activeFiltersCount = Object.values(filters).filter((v) => v !== 'all').length;

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
  }

  // "Fechar caixa": zera a numeração visível (próxima comanda volta a ser nº 1).
  // O backend recusa se ainda houver comandas abertas.
  async function doReset() {
    try {
      setResetting(true);
      const res = await resetOrderSequence();
      await load();
      setResetModal(false);
      setResetResult(res?.message || 'Numeração reiniciada.');
    } catch (err) {
      setResetModal(false);
      setResetError(err?.uiMessage || 'Erro ao reiniciar a numeração.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" avoidKeyboard={false}>
      <SearchHeader
        onBack={() => signOut()}
        placeholder="Nº, item, atendente ou identificação..."
        value={search}
        onChangeText={setSearch}
        onFilter={() => setFiltersOpen(true)}
        activeFilters={activeFiltersCount}
        size="lg"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: ui.loadingMarginTop }} color={colors.primary} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: ui.scrollPadH,
              paddingTop: ui.scrollPadTop,
              paddingBottom: ui.scrollPadBottom,
            },
          ]}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
        >
        <View style={{ width: '100%', maxWidth: contentWidth }}>
        
          <SectionHeader title="Pedidos pendentes" count={pendentes.length} ui={ui} />
          <View style={[styles.pendingList, { marginTop: ui.pendingListMarginTop }]}>
            {pendentes.map((o) => (
              <PendingOrderRow
                key={o.id}
                order={o}
                isNew={o.id === newOrderId}
                partial={(o.delivered_count ?? 0) > 0}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
                onDeliverItem={handleDeliverItem}
                onDeliverAll={handleDeliverAll}
              />
            ))}
            {pendentes.length === 0 ? (
              <EmptySection text={search || activeFiltersCount > 0 ? 'Nenhum pedido encontrado com esses filtros' : 'Nenhum pedido pendente'} ui={ui} />
            ) : null}
          </View>

          <Divider ui={ui} />

          <SectionHeader title="Pedidos entregues" count={entregues.length} ui={ui} />
          <Grid>
            {entregues.map((o) => (
              <OrderTile
                key={o.id}
                order={{ ...o, status: 'open' }}
                partial={(o.pending_count ?? 0) > 0}
                size="lg"
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
              />
            ))}
            {entregues.length === 0 ? (
              <EmptySection text={search || activeFiltersCount > 0 ? 'Nenhum pedido encontrado com esses filtros' : 'Nenhum pedido entregue'} ui={ui} />
            ) : null}
          </Grid>

          <Divider ui={ui} />

          <SectionHeader title="Comandas fechadas hoje" count={filteredClosed.length} ui={ui} />
          <Grid>
            {filteredClosed.map((o) => (
              <OrderTile
                key={o.id}
                order={{ ...o, status: 'closed' }}
                size="lg"
                onPress={() => navigation.navigate('OrderDetail', { id: o.id, readOnly: true })}
              />
            ))}
            {filteredClosed.length === 0 ? (
              <EmptySection text={search || activeFiltersCount > 0 ? 'Nenhuma comanda encontrada com esses filtros' : 'Nenhuma comanda fechada hoje'} ui={ui} />
            ) : null}
          </Grid>
        </View>
        
        </ScrollView>
      )}

      <BottomBar current="home" />
      <Fab
        onPress={() => navigation.navigate('OrderDetail', { id: 'new' })}
        centeredOnBottomBar
      />

      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onClear={() => { clearFilters(); setFiltersOpen(false); }}
        size="lg"
        sections={[
          {
            key: 'color',
            title: 'Tempo de espera',
            value: filters.color,
            onChange: (v) => setFilters((f) => ({ ...f, color: v })),
            options: [
              { value: 'all',    label: 'Todas' },
              { value: 'green',  label: 'Recentes',   dot: colors.statusGreen },
              { value: 'yellow', label: 'Em espera',  dot: colors.statusYellow },
              { value: 'red',    label: 'Atrasadas',  dot: colors.statusRed },
            ],
          },
          {
            key: 'attendant',
            title: 'Atendente',
            value: filters.attendant,
            onChange: (v) => setFilters((f) => ({ ...f, attendant: v })),
            options: [
              { value: 'all', label: 'Todos' },
              ...attendants.map((a) => ({ value: a, label: a })),
            ],
          },
          {
            key: 'table',
            title: 'Mesa',
            value: filters.table,
            onChange: (v) => setFilters((f) => ({ ...f, table: v })),
            options: [
              { value: 'all',  label: 'Todas' },
              { value: 'none', label: 'Sem mesa' },
              ...tables.map((t) => ({ value: t, label: t })),
            ],
          },
        ]}
      />

      <FeedbackModal
        visible={createdModal}
        title="Pedido cadastrado"
        message={`Pedido nº ${newOrderNumber} cadastrado com sucesso!`}
        size="lg"
        onClose={() => { setCreatedModal(false); }}
      />

      <ConfirmModal
        visible={resetModal}
        variant="warning"
        icon="refresh-ccw"
        title="Iniciar novo dia?"
        message="A numeração das comandas voltará a começar do nº 1. Faça isso apenas com o caixa fechado (sem comandas abertas)."
        confirmLabel="Iniciar novo dia"
        cancelLabel="Cancelar"
        loading={resetting}
        size="lg"
        onConfirm={doReset}
        onCancel={() => setResetModal(false)}
      />

      <FeedbackModal
        visible={!!resetResult}
        title="Novo dia iniciado"
        message={resetResult || ''}
        okLabel="OK"
        size="lg"
        onClose={() => setResetResult(null)}
      />

      <FeedbackModal
        visible={!!resetError}
        variant="danger"
        title="Não foi possível"
        message={resetError || ''}
        okLabel="OK"
        size="lg"
        onClose={() => setResetError(null)}
      />

      <FeedbackModal
        visible={!!deliverError}
        variant="danger"
        title="Não foi possível entregar"
        message={deliverError || ''}
        okLabel="OK"
        size="lg"
        onClose={() => setDeliverError(null)}
      />
    </Screen>
  );
}

function SectionHeader({ title, count, ui }) {
  return (
    <View style={[styles.sectionHeader, { marginBottom: ui.sectionHeaderMarginBottom }]}>
      <Text style={[styles.sectionTitle, { fontSize: ui.sectionTitle }]}>{title}</Text>
      <Text style={[styles.sectionCount, { fontSize: ui.sectionTitle, marginLeft: ui.sectionCountMargin }]}>({count})</Text>
    </View>
  );
}

function Grid({ children }) {
  return <View style={styles.grid}>{children}</View>;
}

function Divider({ ui }) {
  return (
    <View
      style={[
        styles.divider,
        { marginTop: ui.dividerMargin, marginBottom: ui.dividerMargin },
      ]}
    />
  );
}

function EmptySection({ text, ui }) {
  return (
    <View style={[styles.emptyWrap, { paddingVertical: ui.emptyWrapPaddingV }]}>
      <Image
        source={require('../../assets/vazio.png')}
        style={{
          width: ui.emptyImage,
          height: ui.emptyImage,
          marginTop: ui.emptyImageMarginTop,
        }}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.empty,
          {
            fontSize: ui.emptyFont,
            lineHeight: ui.emptyLineHeight,
            paddingTop: ui.emptyPaddingTop,
            paddingBottom: ui.emptyPaddingBottom,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

// Aplica busca textual + filtros estruturados a um array de comandas.
function applyFilters(arr, term, filters) {
  let out = arr;

  // Busca textual pelo número visível, label (identificação) e atendente
  if (term?.trim()) {
    const t = term.trim().toLowerCase();
    out = out.filter((o) =>
         String(o.daily_number ?? o.id).includes(t)
      || String(o.label     || '').toLowerCase().includes(t)
      || String(o.attendant || '').toLowerCase().includes(t)
      || (o.items || []).some((it) => String(it.product_name || '').toLowerCase().includes(t))
    );
  }

  if (filters.color !== 'all') {
    out = out.filter((o) => o.color_status === filters.color);
  }
  if (filters.attendant !== 'all') {
    out = out.filter((o) => o.attendant === filters.attendant);
  }
  if (filters.table !== 'all') {
    if (filters.table === 'none') out = out.filter((o) => !o.table_label);
    else                          out = out.filter((o) => o.table_label === filters.table);
  }

  return out;
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: 0,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.textDark },
  sectionCount: { ...typography.bodyBold, color: colors.primary },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    marginTop: 0,
  },
  pendingList: {
    paddingHorizontal: 0,
  },
  divider: {
    height: 2,
    backgroundColor: '#F0EBE4',
    width: '100%',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
