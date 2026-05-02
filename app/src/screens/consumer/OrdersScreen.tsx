import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";

import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const response = await api.get("/reservations");
    setOrders(response.data);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.product_name}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text style={styles.detail}>Qtd {item.quantity} - R$ {Number(item.total_price).toFixed(2)}</Text>
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
  card: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: "700",
  },
  detail: {
    color: tokens.colors.textSecondary,
    marginTop: 4,
  },
});
