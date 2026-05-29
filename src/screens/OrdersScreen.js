import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import SearchHeader from '../components/SearchHeader';
import OrderTile from '../components/OrderTile';
import BottomBar from '../components/BottomBar';
import Button from '../components/Button';
import Fab from '../components/Fab';
import FeedbackModal from '../components/FeedbackModal';
import ConfirmModal from '../components/ConfirmModal';
import FiltersSheet from '../components/FiltersSheet';
import { colors, typography } from '../theme';
import {
  fetchOpenOrders,
  fetchClosedOrders,
  resetOrderSequence,
} from '../services/ordersService';
import { connectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

// Valores iniciais dos filtros — 'all' significa "sem filtro nesta dimensão".
const INITIAL_FILTERS = {
  color:     'all', // green | yellow | red | all
  attendant: 'all', // username | all
  table:     'all', // table_label | 'none' (sem mesa) | all
};

export default function OrdersScreen({ navigation, route }) {
  const { signOut, isManager } = useAuth();
  const r = useResponsive();
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
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content">
      <SearchHeader
        onBack={() => signOut()}
        placeholder="Nº da comanda, atendente ou identificação..."
        value={search}
        onChangeText={setSearch}
        onFilter={() => setFiltersOpen(true)}
        activeFilters={activeFiltersCount}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
        >
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>
          {isManager ? (
            <View style={styles.resetWrap}>
              <Button
                title="Iniciar novo dia (zerar numeração)"
                variant="outline"
                onPress={() => setResetModal(true)}
                icon={<Feather name="refresh-ccw" size={16} color={colors.primary} />}
              />
            </View>
          ) : null}

          <SectionHeader title="Pedidos em andamento" count={filteredOpen.length} />
          <Grid>
            {filteredOpen.map((o) => (
              <OrderTile
                key={o.id}
                order={{ ...o, status: 'open' }}
                isNew={o.id === newOrderId}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
              />
            ))}
            {filteredOpen.length === 0 ? (
              <Text style={styles.empty}>
                {search || activeFiltersCount > 0
                  ? 'Nenhuma comanda encontrada com esses filtros.'
                  : 'Nenhuma comanda aberta.'}
              </Text>
            ) : null}
          </Grid>

          <SectionHeader title="Comandas fechadas hoje" count={filteredClosed.length} />
          <Grid>
            {filteredClosed.map((o) => (
              <OrderTile
                key={o.id}
                order={{ ...o, status: 'closed' }}
                onPress={() => navigation.navigate('OrderDetail', { id: o.id, readOnly: true })}
              />
            ))}
            {filteredClosed.length === 0 ? (
              <Text style={styles.empty}>
                {search || activeFiltersCount > 0
                  ? 'Nenhuma comanda encontrada com esses filtros.'
                  : 'Nenhuma comanda fechada hoje.'}
              </Text>
            ) : null}
          </Grid>
        </View>
        </ScrollView>
      )}

      <BottomBar current="home" />
      <Fab onPress={() => navigation.navigate('OrderDetail', { id: 'new' })} />

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
        message={`Pedido nº ${newOrderNumber} cadastrado com sucesso!`}
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
        onConfirm={doReset}
        onCancel={() => setResetModal(false)}
      />

      <FeedbackModal
        visible={!!resetResult}
        title="Novo dia iniciado"
        message={resetResult || ''}
        okLabel="OK"
        onClose={() => setResetResult(null)}
      />

      <FeedbackModal
        visible={!!resetError}
        variant="danger"
        title="Não foi possível"
        message={resetError || ''}
        okLabel="OK"
        onClose={() => setResetError(null)}
      />
    </Screen>
  );
}

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({count})</Text>
    </View>
  );
}

function Grid({ children }) {
  return <View style={styles.grid}>{children}</View>;
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
  sectionCount: { ...typography.bodyBold, color: colors.primary, marginLeft: 8 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  resetWrap: { paddingHorizontal: 18, marginTop: 14 },
  empty: { padding: 24, color: colors.textMuted, fontStyle: 'italic' },
});
