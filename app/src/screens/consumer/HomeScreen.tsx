import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";

import { FairStatusBanner } from "@/components/FairStatusBanner";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function HomeScreen({ navigation }: any) {
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    await Promise.all([
      api.get("/reservations").then((r) => setMyReservations(r.data)).catch(() => undefined),
      api
        .get("/reservations/producer")
        .then((r) => setRequests(r.data))
        .catch(() => undefined),
    ]);
  }

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <FairStatusBanner />

      {/* CTAs */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.cta, styles.ctaPrimary]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Bancas")}
        >
          <Text style={styles.ctaIcon}>🛒</Text>
          <Text style={styles.ctaTextPrimary}>Quero comprar</Text>
          <Text style={styles.ctaSubPrimary}>Veja o que tem na feira</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cta, styles.ctaSecondary]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("MyProducts")}
        >
          <Text style={styles.ctaIcon}>🌽</Text>
          <Text style={styles.ctaTextSecondary}>Quero vender</Text>
          <Text style={styles.ctaSubSecondary}>Coloque seus produtos pra vender</Text>
        </TouchableOpacity>
      </View>

      {/* Minhas reservas */}
      <Text style={styles.sectionTitle}>Minhas reservas</Text>
      {myReservations.length === 0 ? (
        <Text style={styles.empty}>Nenhuma reserva ainda.</Text>
      ) : (
        myReservations.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.cardName}>{item.product_name}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text style={styles.cardDetail}>
              Qtd {item.quantity} · R$ {Number(item.total_price).toFixed(2)}
            </Text>
          </View>
        ))
      )}

      {/* Solicitações */}
      <Text style={styles.sectionTitle}>Solicitações</Text>
      {requests.length === 0 ? (
        <Text style={styles.empty}>Nenhuma solicitação recebida.</Text>
      ) : (
        requests.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardName}>{item.product_name}</Text>
            <Text style={styles.cardDetail}>Qtd {item.quantity}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  ctaRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  cta: {
    flex: 1,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPrimary: {
    backgroundColor: tokens.colors.primary,
  },
  ctaSecondary: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 2,
    borderColor: tokens.colors.primary,
  },
  ctaIcon: {
    fontSize: 28,
    marginBottom: 4,
    textAlign: "center",
  },
  ctaTextPrimary: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  ctaSubPrimary: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  ctaTextSecondary: {
    color: tokens.colors.primary,
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  ctaSubSecondary: {
    color: tokens.colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardName: {
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  cardDetail: {
    color: tokens.colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  empty: {
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.md,
    fontSize: 14,
  },
});
