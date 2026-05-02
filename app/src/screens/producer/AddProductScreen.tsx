import { useState } from "react";
import { View, TextInput, StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function AddProductScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  async function save() {
    await api.post("/products", {
      name,
      description,
      price: Number(price),
      is_active: true,
    });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Descricao"
        value={description}
        onChangeText={setDescription}
      />
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
});
