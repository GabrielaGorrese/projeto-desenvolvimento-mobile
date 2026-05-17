import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import OrderHeader from '../components/OrderHeader';
import StatusBanner from '../components/StatusBanner';
import ScreenSectionTitle from '../components/ScreenSectionTitle';
import InfoRow from '../components/InfoRow';
import TableSelect from '../components/TableSelect';
import OrdersCard from '../components/OrdersCard';
import ActionChipButton from '../components/ActionChipButton';
import OrderSummaryFooter from '../components/OrderSummaryFooter';
import { colors } from '../theme/colors';

const MOCK_ORDER_ITEMS = [
  {
    id: '1',
    name: 'Almoço completo c/ bife acebolado',
    quantity: 1,
    unitPrice: 42.99,
    totalPrice: 42.99,
    imageUri:
      'https://www.figma.com/api/mcp/asset/e1f0cd66-cefd-431f-a26d-11e8e55e983f',
  },
  {
    id: '2',
    name: 'Refrigerante Coca-Cola Lata 350ml',
    quantity: 2,
    unitPrice: 6.99,
    totalPrice: 13.98,
    imageUri:
      'https://www.figma.com/api/mcp/asset/a97f41b4-81b0-4689-ad98-3e39a63ed7ce',
  },
];

export default function TelaPedidos({ navigation, route }) {
  const isExistingOrder = route?.params?.mode === 'existing';

  const header = isExistingOrder
    ? {
        title: 'Comanda 03',
        subtitle: 'Mesa 03 | Aberta em: 01/03/2026 (12:34:56)',
        status: 'Aguardando pagamento',
        actionLabel: 'Fechar comanda',
      }
    : {
        title: 'Novo pedido',
        subtitle: 'Aberto em 23/04/2026 (12:34:56)',
        status: 'Pendente',
        actionLabel: 'Abrir comanda',
      };

  const total = useMemo(
    () => MOCK_ORDER_ITEMS.reduce((sum, item) => sum + item.totalPrice, 0),
    []
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <OrderHeader
        title={header.title}
        subtitle={header.subtitle}
        onBackPress={() => navigation?.goBack()}
      />

      <StatusBanner label={header.status} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ScreenSectionTitle title="Informações" />
          <InfoRow icon="person-outline" label="Bruno P. Rampinelli" />
          <InfoRow icon="people-outline" label="01 pessoa" />
          <InfoRow icon="time-outline" label="02:43" />
        </View>

        <View style={styles.section}>
          <ScreenSectionTitle title="Mesa" />
          <TableSelect
            value={isExistingOrder ? '03' : null}
            onPress={() => console.log('Selecionar mesa')}
          />
        </View>

        <View style={styles.section}>
          <ScreenSectionTitle title="Pedidos" />
          <OrdersCard
            items={MOCK_ORDER_ITEMS}
            onEditItem={(item) => console.log('Editar', item.id)}
          />

          <View style={styles.actionsRow}>
            <ActionChipButton
              label="Limpar"
              icon="clear"
              onPress={() => console.log('Limpar pedidos')}
            />
            <ActionChipButton
              label="Adicionar novo item"
              icon="add"
              onPress={() => console.log('Adicionar item')}
            />
          </View>
        </View>
      </ScrollView>

      <OrderSummaryFooter
        total={total}
        totalPerPerson={total}
        actionLabel={header.actionLabel}
        onActionPress={() => {
          if (!isExistingOrder) {
            navigation.navigate('Tables', {
              showSuccessModal: true,
              orderNumber: 17,
            });
            return;
          }
          console.log(header.actionLabel);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 200,
  },
  section: {
    marginBottom: 28,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});
