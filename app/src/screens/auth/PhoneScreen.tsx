import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { requestOtp } from "@/services/auth";
import { tokens } from "@/theme/tokens";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return raw;
}

function rawPhone(masked: string): string {
  return masked.replace(/\D/g, "");
}

export function PhoneScreen({ navigation }: any) {
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [message, setMessage] = useState("");

  async function handleRequestOtp() {
    const data = await requestOtp(rawPhone(phoneDisplay));
    setMessage(`Código dev: ${data.dev_code || "enviado"}`);
    navigation.navigate("Otp", { phone: rawPhone(phoneDisplay) });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌿</Text>
      <Text style={styles.title}>Entrar no Terra Viva</Text>
      <Text style={styles.subtitle}>Digite seu celular para receber o código</Text>
      <TextInput
        style={styles.input}
        value={phoneDisplay}
        onChangeText={(v) => setPhoneDisplay(formatPhone(v))}
        placeholder="(48) 9 9999-9999"
        keyboardType="phone-pad"
        maxLength={16}
      />
      <Button title="Solicitar código" onPress={handleRequestOtp} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.lg,
    justifyContent: "center",
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: tokens.colors.textSecondary,
    textAlign: "center",
    marginBottom: tokens.spacing.md,
    fontSize: 14,
  },
  input: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    fontSize: 16,
  },
  message: {
    marginTop: tokens.spacing.sm,
    color: tokens.colors.textSecondary,
    textAlign: "center",
  },
});
