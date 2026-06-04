import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import SearchHeader from '../components/SearchHeader';
import OrderTile from '../components/OrderTile';
import Fab from '../components/Fab';
import FeedbackModal from '../components/FeedbackModal';
import FiltersSheet from '../components/FiltersSheet';
import { colors, typography } from '../theme';
import {
  fetchOpenOrders,
  fetchClosedOrders,
} from '../services/ordersService';
import { connectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

// Margem horizontal do conteúdo (cabeçalhos de seção) — o FAB usa o mesmo alinhamento.
const CONTENT_H_PADDING = 18;

// =============================================================================
// PLACEHOLDER DEV — "Pedidos em andamento" (testes sem back-end)
// =============================================================================
// Card fictício exibido enquanto USE_OPEN_ORDER_PLACEHOLDER === true.
//
// Como remover:
//   1) Defina USE_OPEN_ORDER_PLACEHOLDER = false; ou
//   2) Apague este bloco (constantes + openOrdersForDisplay + map que usa
//      openOrdersForDisplay) e volte a usar filteredOpen diretamente no JSX.
// =============================================================================
const USE_OPEN_ORDER_PLACEHOLDER = true;
const PLACEHOLDER_OPEN_ORDER = {
  id: 0,
  label: 'Demo',
  attendant: 'atendente-demo',
  table_label: 'Mesa demo',
  color_status: 'green',
  status: 'open',
  __placeholder: true,
};

// Valores iniciais dos filtros — 'all' significa "sem filtro nesta dimensão".
const INITIAL_FILTERS = {
  color:     'all', // green | yellow | red | all
  attendant: 'all', // username | all
  table:     'all', // table_label | 'none' (sem mesa) | all
};

export default function OrdersScreen({ navigation, route }) {
  const { signOut } = useAuth();
  const r = useResponsive();
  const [open,    setOpen]    = useState([]);
  const [closed,  setClosed]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [search,  setSearch]  = useState('');
  const [newOrderId, setNewOrderId] = useState(route.params?.justCreatedId || null);
  const [createdModal, setCreatedModal] = useState(!!route.params?.justCreatedId);

  // Filtros (modal)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters,     setFilters]     = useState(INITIAL_FILTERS);

  const load = useCallback(async () => {
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
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  // Socket: atualizações em tempo real
  useEffect(() => {
    const s = connectSocket();
    const reload = () => load();
    s.on('order:created', reload);
    s.on('order:updated', reload);
    s.on('order:closed',  reload);
    s.on('order:deleted', reload);
    return () => {
      s.off('order:created', reload);
      s.off('order:updated', reload);
      s.off('order:closed',  reload);
      s.off('order:deleted', reload);
    };
  }, [load]);

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

  const openOrdersForDisplay = useMemo(() => {
    if (!USE_OPEN_ORDER_PLACEHOLDER) return filteredOpen;
    if (filteredOpen.some((o) => o.__placeholder)) return filteredOpen;
    return [PLACEHOLDER_OPEN_ORDER, ...filteredOpen];
  }, [filteredOpen]);

  const landscape = r.isLandscape;
  const tileSize = landscape ? 'lg' : 'md';
  const contentWidth = Math.min(r.width, r.contentMaxWidth);
  const fabRight = (r.width - contentWidth) / 2 + CONTENT_H_PADDING;

  // Conta quantos filtros estão ativos (≠ 'all') — vira badge sobre o ícone.
  const activeFiltersCount = Object.values(filters).filter((v) => v !== 'all').length;

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
  }

  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content">
      <SearchHeader
        onBack={() => signOut()}
        placeholder="Nº da comanda, atendente ou identificação..."
        value={search}
        onChangeText={setSearch}
        onFilter={() => setFiltersOpen(true)}
        activeFilters={activeFiltersCount}
        enlarged={landscape}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
        >
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>
          <SectionHeader
            title="Pedidos em andamento"
            count={openOrdersForDisplay.length}
            large={landscape}
          />
          <Grid large={landscape}>
            {openOrdersForDisplay.map((o) => (
              <OrderTile
                key={o.__placeholder ? 'placeholder-open' : o.id}
                order={{ ...o, status: 'open' }}
                size={tileSize}
                isNew={o.id === newOrderId}
                onPress={() =>
                  navigation.navigate('OrderDetail', {
                    id: o.__placeholder ? 'new' : o.id,
                  })
                }
              />
            ))}
            {openOrdersForDisplay.length === 0 ? (
              <Text style={[styles.empty, landscape && styles.emptyLarge]}>
                {search || activeFiltersCount > 0
                  ? 'Nenhuma comanda encontrada com esses filtros.'
                  : 'Nenhuma comanda aberta.'}
              </Text>
            ) : null}
          </Grid>

          <SectionHeader title="Comandas fechadas hoje" count={filteredClosed.length} large={landscape} />
          <Grid large={landscape}>
            {filteredClosed.map((o) => (
              <OrderTile
                key={o.id}
                order={{ ...o, status: 'closed' }}
                size={tileSize}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id, readOnly: true })}
              />
            ))}
            {filteredClosed.length === 0 ? (
              <Text style={[styles.empty, landscape && styles.emptyLarge]}>
                {search || activeFiltersCount > 0
                  ? 'Nenhuma comanda encontrada com esses filtros.'
                  : 'Nenhuma comanda fechada hoje.'}
              </Text>
            ) : null}
          </Grid>
        </View>
        </ScrollView>
      )}

      <Fab
        onPress={() => navigation.navigate('OrderDetail', { id: 'new' })}
        iconSize={landscape ? 32 : 28}
        style={[
          { right: fabRight },
          landscape && styles.fabLarge,
        ]}
      />

      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onClear={() => { clearFilters(); setFiltersOpen(false); }}
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
        message={`Pedido nº ${newOrderId} cadastrado com sucesso!`}
        onClose={() => { setCreatedModal(false); }}
      />
    </Screen>
  );
}

function SectionHeader({ title, count, large }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, large && styles.sectionTitleLarge]}>{title}</Text>
      <Text style={[styles.sectionCount, large && styles.sectionCountLarge]}>({count})</Text>
    </View>
  );
}

function Grid({ children, large }) {
  return <View style={[styles.grid, large && styles.gridLarge]}>{children}</View>;
}

// Aplica busca textual + filtros estruturados a um array de comandas.
function applyFilters(arr, term, filters) {
  let out = arr;

  // Busca textual em id, label (identificação) e atendente
  if (term?.trim()) {
    const t = term.trim().toLowerCase();
    out = out.filter((o) =>
         String(o.id).includes(t)
      || String(o.label     || '').toLowerCase().includes(t)
      || String(o.attendant || '').toLowerCase().includes(t)
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 4,
  },
  sectionTitle: { ...typography.h3, color: colors.textDark, fontSize: 18 },
  sectionTitleLarge: { fontSize: 22 },
  sectionCount: { ...typography.bodyBold, color: colors.primary, marginLeft: 8 },
  sectionCountLarge: { fontSize: 16 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  gridLarge: {
    paddingHorizontal: CONTENT_H_PADDING,
    marginTop: 8,
  },
  empty: { padding: 24, color: colors.textMuted, fontStyle: 'italic', fontSize: 14 },
  emptyLarge: { fontSize: 16, padding: 28 },

  fabLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
