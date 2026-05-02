import { View, Text, StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { tokens } from "@/theme/tokens";

export function ProductCard({ item, onReserve }: { item: any; onReserve: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>R$ {Number(item.price).toFixed(2)}</Text>
      <Text style={styles.description}>{item.description || "Produto fresco"}</Text>
      <Button title="Reservar" onPress={onReserve} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  name: {
    fontWeight: "700",
  },
  price: {
    color: tokens.colors.primary,
    fontWeight: "700",
    marginVertical: 4,
  },
  description: {
    color: tokens.colors.textSecondary,
    marginBottom: 8,
  },
});
