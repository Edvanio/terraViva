import { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { verifyOtp } from "@/services/auth";
import { tokens } from "@/theme/tokens";

export function OtpScreen({ route, navigation }: any) {
  const [otp, setOtp] = useState("");
  const phone = route.params.phone as string;

  async function handleVerify() {
    await verifyOtp(phone, otp);
    navigation.reset({ index: 0, routes: [{ name: "AppTabs" }] });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digite o OTP</Text>
      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
        placeholder="Codigo de 6 digitos"
        keyboardType="number-pad"
        maxLength={6}
      />
      <Button title="Entrar" onPress={handleVerify} />
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: tokens.spacing.md,
  },
  input: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
});
