import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from "react-native";

export default function Header() {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Text style={styles.icon}>←</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Número da comanda..."
        style={styles.input}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.filter}>
        <Text style={{ color: "#fff" }}>≡</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#2C2C2C",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  icon: {
    fontSize: 20,
    color: "#fff",
  },
  filter: {
    backgroundColor: "#C47A4A",
    padding: 10,
    borderRadius: 10,
  },
});