import { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from "react-native";

import { Button } from "@/components/Button";
import { enqueue } from "@/storage/queue";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

const PICKUP_OPTS = [
  { value: "feira", label: "📍 Na feira de sábado" },
  { value: "produtor", label: "🏡 Na casa do produtor" },
] as const;

const PAYMENT_OPTS = [
  { value: "cash", label: "💵 Dinheiro" },
  { value: "pix",  label: "📲 Pix" },
  { value: "card", label: "💳 Cartão" },
] as const;

type Pickup  = typeof PICKUP_OPTS[number]["value"];
type Payment = typeof PAYMENT_OPTS[number]["value"];

export function CheckoutScreen({ route, navigation }: any) {
  const { productId, productName = "Produto", productPrice = 0 } = route.params ?? {};

  const [quantity, setQuantity]         = useState(1);
  const [pickup, setPickup]             = useState<Pickup>("feira");
  const [payment, setPayment]           = useState<Payment>("cash");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);

  const total = productPrice * quantity;

  async function handleReserve() {
    setLoading(true);
    const payload = { product_id: productId, quantity, payment_intent: payment, pickup_location: pickup };
    try {
      await api.post("/reservations", payload);
    } catch {
      await enqueue({ id: String(Date.now()), method: "POST", path: "/reservations", body: payload });
    }
    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    const pickupLabel  = PICKUP_OPTS.find(o => o.value === pickup)?.label  ?? pickup;
    const paymentLabel = PAYMENT_OPTS.find(o => o.value === payment)?.label ?? payment;
    return (
      <View style={sStyles.center}>
        <Text style={sStyles.emoji}>🎉</Text>
        <Text style={sStyles.title}>Reserva feita!</Text>
        <View style={sStyles.card}>
          <Row label="Produto"   value={productName} />
          <Row label="Quantidade" value={`${quantity}x`} />
          {total > 0 && (
            <Row label="Total" value={`R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} highlight />
          )}
          <Row label="Retirada"  value={pickupLabel} />
          <Row label="Pagamento" value={paymentLabel} />
        </View>
        <Button title="Ver meus pedidos" onPress={() => navigation.navigate("Home")} />
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigation.goBack()}>
          <Text style={sStyles.back}>← Voltar para a banca</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Finalizar Reserva</Text>
      <Text style={styles.sub}>{productName}</Text>

      {/* Quantidade */}
      <Text style={styles.label}>Quantos você quer?</Text>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        {total > 0 && (
          <Text style={styles.total}>
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Text>
        )}
      </View>

      {/* Retirada */}
      <Text style={styles.label}>Onde vai retirar?</Text>
      <View style={styles.optRow}>
        {PICKUP_OPTS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optBtn, pickup === opt.value && styles.optBtnActive]}
            onPress={() => setPickup(opt.value)}
          >
            <Text style={[styles.optText, pickup === opt.value && styles.optTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pagamento */}
      <Text style={styles.label}>Como vai pagar?</Text>
      <View style={styles.optRow}>
        {PAYMENT_OPTS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optBtn, payment === opt.value && styles.optBtnActive]}
            onPress={() => setPayment(opt.value)}
          >
            <Text style={[styles.optText, payment === opt.value && styles.optTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={tokens.colors.primary} style={{ marginTop: 24 }} />
        : <Button title="Confirmar reserva" onPress={handleReserve} />
      }
    </ScrollView>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={sStyles.row}>
      <Text style={sStyles.rowLabel}>{label}</Text>
      <Text style={[sStyles.rowValue, highlight && { color: tokens.colors.primary, fontWeight: "700" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.background },
  content:   { padding: tokens.spacing.md, paddingBottom: 40 },
  title:     { fontSize: 22, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: 4 },
  sub:       { fontSize: 14, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  label:     { fontSize: 14, fontWeight: "600", color: tokens.colors.textPrimary, marginBottom: 8, marginTop: 16 },
  qtyRow:    { flexDirection: "row", alignItems: "center", gap: 16 },
  qtyBtn:    { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: tokens.colors.border,
               alignItems: "center", justifyContent: "center" },
  qtyBtnText:{ fontSize: 20, fontWeight: "700", color: tokens.colors.textPrimary },
  qtyValue:  { fontSize: 22, fontWeight: "700", color: tokens.colors.textPrimary, minWidth: 32, textAlign: "center" },
  total:     { marginLeft: "auto", fontSize: 18, fontWeight: "700", color: tokens.colors.primary },
  optRow:    { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optBtn:    { borderRadius: tokens.radius.md, borderWidth: 2, borderColor: tokens.colors.border,
               paddingHorizontal: 12, paddingVertical: 10, backgroundColor: tokens.colors.background },
  optBtnActive:{ borderColor: tokens.colors.primary, backgroundColor: "#EBF5EC" },
  optText:   { fontSize: 13, fontWeight: "600", color: tokens.colors.textSecondary },
  optTextActive:{ color: tokens.colors.primary },
});

const sStyles = StyleSheet.create({
  center:    { flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.spacing.lg,
               backgroundColor: tokens.colors.background },
  emoji:     { fontSize: 64, marginBottom: 12 },
  title:     { fontSize: 26, fontWeight: "700", color: tokens.colors.textPrimary, marginBottom: 20 },
  card:      { width: "100%", backgroundColor: "white", borderRadius: tokens.radius.lg,
               padding: tokens.spacing.md, marginBottom: tokens.spacing.lg,
               shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rowLabel:  { color: tokens.colors.textSecondary, fontSize: 14 },
  rowValue:  { color: tokens.colors.textPrimary, fontSize: 14, fontWeight: "600" },
  back:      { color: tokens.colors.textSecondary, fontSize: 14 },
});
