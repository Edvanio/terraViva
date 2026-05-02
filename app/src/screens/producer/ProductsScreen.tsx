import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";

import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);

  async function loadProducts() {
    try {
      const res = await api.get("/products/mine");
      setProducts(res.data);
    } catch {
      // usuário não autenticado ou sem perfil
    }
  }

  useEffect(() => { loadProducts(); }, []);

  async function toggleProduct(id: string, isActive: boolean) {
    await api.put(`/products/${id}`, { is_active: !isActive });
    await loadProducts();
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      "Remover produto",
      `Tem certeza que quer remover "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, remover",
          style: "destructive",
          onPress: async () => {
            await api.delete(`/products/${id}`);
            await loadProducts();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddProduct")}>
        <Text style={styles.addLabel}>+ Adicionar Produto</Text>
      </TouchableOpacity>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum produto cadastrado ainda.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>
                  R$ {Number(item.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.chip, item.is_active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => toggleProduct(item.id, item.is_active)}
                >
                  <Text style={item.is_active ? styles.chipTextActive : styles.chipTextInactive}>
                    {item.is_active ? "✅ Disponível" : "Esgotado"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)}>
                  <Text style={styles.trash}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  addButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  addLabel: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontWeight: "700",
    color: tokens.colors.textPrimary,
  },
  detail: {
    color: tokens.colors.textSecondary,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipActive: {
    backgroundColor: "#ECFDF5",
  },
  chipInactive: {
    backgroundColor: "#F3F4F6",
  },
  chipTextActive: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextInactive: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  trash: {
    fontSize: 18,
  },
  empty: {
    color: tokens.colors.textSecondary,
    textAlign: "center",
    marginTop: 32,
  },
});
