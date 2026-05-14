import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function OrderCard({ id, status }) {
  const getBackgroundColor = () => {
    switch (status) {
      case "open":
        return "#6CC070"; // verde
      case "warning":
        return "#E4C34B"; // amarelo
      case "closed":
        return "#D6D0CC"; // cinza
      default:
        return "#ccc";
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.text}>{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});