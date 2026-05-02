import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

import { tokens } from "@/theme/tokens";

export function BancaCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.title}>{item.city}</Text>
      <Text style={styles.bio}>{item.bio}</Text>
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Pagamentos: {item.payment_methods?.join(", ")}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  title: {
    color: tokens.colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  bio: {
    color: tokens.colors.textSecondary,
    marginTop: 4,
  },
  paymentRow: {
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 12,
  },
});
