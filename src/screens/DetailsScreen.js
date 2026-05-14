import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";


const openOrders = [
  { id: "01", status: "open" },
  { id: "02", status: "open" },
  { id: "05", status: "warning" },
  { id: "06", status: "open" },
  { id: "07", status: "open" },
  { id: "09", status: "open" },
  { id: "10", status: "open" },
  { id: "12", status: "open" },
  { id: "15", status: "open" },
  { id: "16", status: "warning" },
];

const closedOrders = [
  { id: "03" },
  { id: "04" },
  { id: "08" },
  { id: "11" },
  { id: "13" },
  { id: "14" },
];


const getColor = (status) => {
  if (status === "warning") return "#E4C34B";
  if (status === "closed") return "#D9D4D0";
  return "#6CC070";
};


const OrderCard = ({ id, status, size }) => {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getColor(status),
          width: size,
          height: size,
        },
      ]}
    >
      <Text style={[styles.cardText, { fontSize: size * 0.28 }]}>
        {id}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const horizontalPadding = 32; // padding da tela
  const gap = 12;

  const numColumns =
    width > 1200 ? 6 :
    width > 900 ? 5 :
    4;

  const totalGaps = (numColumns - 1) * gap;

  const cardSize =
    (width - horizontalPadding - totalGaps) / numColumns;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={20} color="#fff" />

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#aaa" />
          <TextInput
            placeholder="Número da comanda..."
            placeholderTextColor="#aaa"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedidos em andamento</Text>
          <Text style={styles.sectionCount}>(10)</Text>
        </View>

        <FlatList
          data={openOrders}
          numColumns={numColumns}
          key={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              id={item.id}
              status={item.status}
              size={cardSize}
            />
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Comandas fechadas hoje
          </Text>
          <Text style={styles.sectionCount}>(8)</Text>
        </View>

        <FlatList
          data={closedOrders}
          numColumns={numColumns}
          key={numColumns + "closed"}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              id={item.id}
              status="closed"
              size={cardSize}
            />
          )}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />
      </View>

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <View style={styles.bottomBar}>
        <Ionicons name="home" size={22} color="#C47A4A" />
        <Ionicons name="receipt-outline" size={22} color="#999" />
        <Ionicons name="notifications-outline" size={22} color="#999" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  header: {
    backgroundColor: "#1E1E1E",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },

  input: {
    flex: 1,
    color: "#fff",
    marginLeft: 6,
    fontSize: 14,
  },

  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: "#C47A4A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },

  sectionCount: {
    fontSize: 14,
    color: "#C47A4A",
    fontWeight: "600",
  },

  grid: {
    paddingHorizontal: 16,
  },

  row: {
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  card: {
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  cardText: {
    color: "#fff",
    fontWeight: "bold",
  },

  fab: {
    position: "absolute",
    right: 30,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#C47A4A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  fabText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 70,
    backgroundColor: "#F2F2F2",
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 80,
  },
});