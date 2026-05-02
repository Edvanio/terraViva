import { View, Text, StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";

const statusColors = {
  pending: "#FEF3C7",
  confirmed: "#D1FAE5",
  collected: "#A7F3D0",
  cancelled: "#FEE2E2",
};

const statusLabels: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  collected: "Retirado",
  cancelled: "Cancelado",
};

export function OrderStatusBadge({ status }: { status: keyof typeof statusColors }) {
  return (
    <View style={[styles.badge, { backgroundColor: statusColors[status] ?? "#F3F4F6" }]}>
      <Text style={styles.text}>{statusLabels[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 999,
  },
  text: {
    fontWeight: "600",
    fontSize: 12,
  },
});
