import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image
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


const INITIAL_FILTERS = {
  color:     'all', 
  attendant: 'all', 
  table:     'all', 
};

export default function OrdersScreen({ navigation, route }) {
  const { signOut, isManager } = useAuth();
  const r = useResponsive();
  const sideGutter = Math.max(8, Math.round((r.width - r.contentMaxWidth) / 2) + 8);
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

  // REMOVER
  /*
  const placeholderOrder = {
    id: 'placeholder-1',
    daily_number: 3,
    label: 'Mesa 12 - TESTE',
    attendant: 'Bruno',
    table_label: '12',
    color_status: 'green', // green | yellow | red
    created_at: new Date().toISOString(),
  };
*/
  return (
    <Screen background="#FFF" statusBarBg={colors.bgDark} statusBarStyle="light-content" avoidKeyboard={false}>
      <SearchHeader
        onBack={() => signOut()}
        placeholder="Nº da comanda, atendente ou identificação..."
        value={search}
        onChangeText={setSearch}
        onFilter={() => setFiltersOpen(true)}
        activeFilters={activeFiltersCount}
        size="lg"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
        >
        <View style={{ width: '100%', maxWidth: r.contentMaxWidth }}>
        
          <SectionHeader title="Pedidos em andamento" count={filteredOpen.length} />
          <Grid>
            {/*
            {/* REMOVER 
             <OrderTile
                key="placeholder"
                order={{ ...placeholderOrder, status: 'open' }}
                isNew
                size="lg"
                onPress={() => {}}
              />
              <OrderTile
                key="placeholder"
                order={{ ...placeholderOrder, status: 'open' }}
                isNew
                size="lg"
                onPress={() => {}}
              />
              <OrderTile
                key="placeholder"
                order={{ ...placeholderOrder, status: 'open' }}
                isNew
                size="lg"
                onPress={() => {}}
              />
              <OrderTile
                key="placeholder"
                order={{ ...placeholderOrder, status: 'open' }}
                isNew
                size="lg"
                onPress={() => {}}
              />
              <OrderTile
                key="placeholder"
                order={{ ...placeholderOrder, status: 'open' }}
                isNew
                size="lg"
                onPress={() => {}}
              />
              */}
            {filteredOpen.map((o) => (
              
              <OrderTile
                key={o.id}
                order={{ ...o, status: 'open' }}
                isNew={o.id === newOrderId}
                size="lg"
                onPress={() => navigation.navigate('OrderDetail', { id: o.id })}
              />
            ))}
            {filteredOpen.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Image source={require('../../assets/vazio.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
                <Text style={styles.empty}>
                  {search || activeFiltersCount > 0
                    ? 'Nenhum pedido encontrado com esses filtros'
                    : 'Nenhum pedido em andamento'}
                </Text>
              </View>
            ) : null}
          </Grid>

          <View
            style={{
              height: 1,
              backgroundColor: '#ccc',
              width: '100%',
              marginVertical: 10,
            }}
          />

          <SectionHeader title="Comandas fechadas hoje" count={filteredClosed.length} />
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
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Image source={require('../../assets/vazio.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
                <Text style={styles.empty}>
                  {search || activeFiltersCount > 0
                    ? 'Nenhuma comanda encontrada com esses filtros'
                    : 'Nenhuma comanda fechada hoje'}
                </Text>
              </View>
            ) : null}
          </Grid>
        </View>
        
        </ScrollView>
      )}

      <BottomBar current="home" />
      <Fab onPress={() => navigation.navigate('OrderDetail', { id: 'new' })} style={{ right: sideGutter }} />

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
    paddingHorizontal: 10,
    marginTop: 36,
    marginBottom: 4,
  },
  sectionTitle: { ...typography.h3, color: colors.textDark, fontSize: 24 },
  sectionCount: { ...typography.bodyBold, color: colors.primary, marginLeft: 8, fontSize: 20 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    marginTop: 16,
  },
  resetWrap: { paddingHorizontal: 10, marginTop: 12 },
  empty: { padding: 10, color: colors.textMuted, fontSize: 18, paddingBottom: 42 },
});
