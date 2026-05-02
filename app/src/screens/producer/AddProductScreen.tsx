import { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { Button } from "@/components/Button";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function AddProductScreen({ navigation, route }: any) {
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    const prefillPhoto = route?.params?.photo_url;
    if (prefillPhoto && typeof prefillPhoto === "string") {
      setPhotoUrl(prefillPhoto);
    }

    NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        navigation.replace("AIProduct");
      } else {
        setCheckingConnection(false);
      }
    });
  }, [navigation]);

  async function save() {
    await api.post("/products", {
      name,
      description,
      price: Number(price),
      photo_url: photoUrl || undefined,
      is_active: true,
    });
    navigation.goBack();
  }

  if (checkingConnection) {
    return (
      <View style={styles.container}>
        <Text style={styles.helper}>Verificando conexao para iniciar o fluxo inteligente...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.helper}>Sem internet: usando cadastro manual.</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Descricao"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput style={styles.input} placeholder="URL da foto (opcional)" value={photoUrl} onChangeText={setPhotoUrl} />
      <TextInput style={styles.input} placeholder="Preco" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <Button title="Salvar" onPress={save} />
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
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.sm,
  },
});
