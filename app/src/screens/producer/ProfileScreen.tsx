import { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, Alert, Text, TouchableOpacity } from "react-native";
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
  const [address, setAddress] = useState("");
  const [geoHint, setGeoHint] = useState<{ city: string | null; state: string | null } | null>(null);

  useEffect(() => {
    api.get("/producer/profile")
      .then((r) => {
        setBio(r.data.bio ?? "");
        setCity(r.data.city ?? "");
        setPhone(r.data.phone ?? "");
        setAddress(r.data.address ?? "");
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const value = address.trim();
    if (value.length < 6) {
      setGeoHint(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await api.post("/producer/geocode", { address: value });
        if (r.data?.city || r.data?.state) {
          setGeoHint({ city: r.data.city ?? null, state: r.data.state ?? null });
        }
      } catch {
        // sem bloqueio
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [address]);

  async function save() {
    if (!city.trim()) {
      Alert.alert("Cidade obrigatoria", "Preencha a cidade para salvar o perfil.");
      return;
    }

    const pushToken = await registerPushToken();
    await api.put("/producer/profile", {
      bio,
      city,
      phone,
      address,
      payment_methods: ["cash", "pix", "card"],
      ...(pushToken ? { expo_push_token: pushToken } : {}),
    });
    Alert.alert("✅ Salvo", "Seu perfil foi atualizado!");
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Nome da banca / cidade" />
      <Text style={styles.helper}>Cidade obrigatoria para sugestao de preco com IA.</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Telefone / WhatsApp" keyboardType="phone-pad" />
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Endereco (opcional)" />
      {geoHint?.city || geoHint?.state ? (
        <View style={styles.hintRow}>
          <Text style={styles.hintBadge}>📍 {geoHint.city ?? "Cidade"}{geoHint.state ? `, ${geoHint.state}` : ""}</Text>
          {geoHint.city && geoHint.city !== city ? (
            <TouchableOpacity onPress={() => setCity(geoHint.city || city)}>
              <Text style={styles.hintAction}>Usar cidade</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
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
  helper: {
    marginBottom: tokens.spacing.sm,
    color: tokens.colors.textSecondary,
    fontSize: 12,
  },
  hintRow: {
    marginBottom: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintBadge: {
    backgroundColor: "#ECFDF5",
    color: tokens.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  hintAction: {
    color: tokens.colors.primary,
    textDecorationLine: "underline",
    fontSize: 12,
    fontWeight: "600",
  },
});
