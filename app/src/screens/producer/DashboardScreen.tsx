import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function DashboardScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.get("/reservations/producer/received").then((response) => setItems(response.data));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos Recebidos</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.product_name}</Text>
            <Text style={styles.detail}>Qtd {item.quantity}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: tokens.spacing.md,
  },
  card: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  name: {
    fontWeight: "700",
  },
  detail: {
    color: tokens.colors.textSecondary,
  },
});
