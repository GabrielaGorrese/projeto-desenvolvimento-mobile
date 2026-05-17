import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import TablesHeader from '../components/TablesHeader';
import SectionHeader from '../components/SectionHeader';
import TablesGrid from '../components/TablesGrid';
import FloatingActionButton from '../components/FloatingActionButton';
import BottomNavigation from '../components/BottomNavigation';
import SuccessModal from '../components/SuccessModal';
import { colors } from '../theme/colors';

const INITIAL_ONGOING = [
  { id: '1', number: '01', status: 'open' },
  { id: '2', number: '02', status: 'open' },
  { id: '5', number: '05', status: 'warning' },
  { id: '6', number: '06', status: 'open' },
  { id: '7', number: '07', status: 'open' },
  { id: '9', number: '09', status: 'open' },
  { id: '10', number: '10', status: 'open' },
  { id: '12', number: '12', status: 'open' },
  { id: '15', number: '15', status: 'open' },
  { id: '16', number: '16', status: 'warning' },
];

const INITIAL_CLOSED = [
  { id: '3', number: '03', status: 'closed' },
  { id: '4', number: '04', status: 'closed' },
  { id: '8', number: '08', status: 'closed' },
  { id: '11', number: '11', status: 'closed' },
  { id: '13', number: '13', status: 'closed' },
  { id: '14', number: '14', status: 'closed' },
];

export default function TelaMesas({ navigation }) {
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [ongoingOrders, setOngoingOrders] = useState(INITIAL_ONGOING);
  const [successOrderNumber, setSuccessOrderNumber] = useState(null);

  const closedToday = INITIAL_CLOSED;

  const sections = useMemo(
    () => [
      {
        title: 'Pedidos em andamento',
        count: ongoingOrders.length,
        items: ongoingOrders,
      },
      {
        title: 'Comandas fechadas hoje',
        count: closedToday.length,
        items: closedToday,
      },
    ],
    [ongoingOrders, closedToday]
  );

  const addOrderToGrid = useCallback((orderNumber) => {
    const number = String(orderNumber).padStart(2, '0');
    setOngoingOrders((prev) => {
      const exists = prev.some((item) => item.number === number);
      if (exists) {
        return prev.map((item) =>
          item.number === number
            ? { ...item, status: 'warning', showBadge: true }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `order-${number}`,
          number,
          status: 'warning',
          showBadge: true,
        },
      ];
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const { showSuccessModal, orderNumber } = route.params || {};

      if (showSuccessModal && orderNumber != null) {
        const formatted = String(orderNumber).padStart(2, '0');
        setSuccessOrderNumber(formatted);
        addOrderToGrid(formatted);
        navigation.setParams({ showSuccessModal: undefined, orderNumber: undefined });
      }
    }, [route.params, navigation, addOrderToGrid])
  );

  const handleDismissSuccess = () => {
    setSuccessOrderNumber(null);
  };

  const handleTablePress = (item) => {
    const mode = item.status === 'closed' ? 'existing' : 'new';
    navigation?.navigate('Orders', { mode, tableNumber: item.number });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <TablesHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onBackPress={() => navigation?.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <SectionHeader title={section.title} count={section.count} />
            <TablesGrid items={section.items} onItemPress={handleTablePress} />
          </View>
        ))}
      </ScrollView>

      <FloatingActionButton onPress={() => console.log('Nova comanda')} />
      <BottomNavigation />

      {successOrderNumber != null && (
        <SuccessModal
          visible
          orderNumber={successOrderNumber}
          onConfirm={handleDismissSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 140,
  },
  section: {
    marginBottom: 40,
  },
});
