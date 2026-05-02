import { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, Alert } from "react-native";
import * as Notifications from "expo-notifications";

import { Button } from "@/components/Button";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

async function registerPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return null;
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export function ProfileScreen() {
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    api.get("/producer/profile")
      .then((r) => {
        setBio(r.data.bio ?? "");
        setCity(r.data.city ?? "");
        setPhone(r.data.phone ?? "");
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    const pushToken = await registerPushToken();
    await api.put("/producer/profile", {
      bio,
      city,
      phone,
      payment_methods: ["cash", "pix", "card"],
      ...(pushToken ? { expo_push_token: pushToken } : {}),
    });
    Alert.alert("✅ Salvo", "Seu perfil foi atualizado!");
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Nome da banca / cidade" />
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefone / WhatsApp" keyboardType="phone-pad" />
      <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="Nossa história (opcional)" multiline numberOfLines={3} />
      <Button title="Salvar perfil" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
  },
  input: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
});
