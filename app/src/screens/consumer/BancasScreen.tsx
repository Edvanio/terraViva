import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ScrollView } from "react-native";

import { BancaCard } from "@/components/BancaCard";
import { CategoryChip } from "@/components/CategoryChip";
import { api } from "@/services/api";
import { getCache, setCache } from "@/storage/cache";
import { tokens } from "@/theme/tokens";

export function BancasScreen({ navigation }: any) {
  const [bancas, setBancas] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const cached = await getCache<any[]>("bancas");
      if (cached) setBancas(cached);
      const response = await api.get("/bancas");
      setBancas(response.data);
      await setCache("bancas", response.data);
    }
    load().catch(() => undefined);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <CategoryChip label="Hortifruti" />
        <CategoryChip label="Colonial" />
        <CategoryChip label="Artesanal" />
      </ScrollView>
      <FlatList
        data={bancas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BancaCard
            item={item}
            onPress={() => navigation.navigate("Banca", { bancaId: item.id })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma banca encontrada.</Text>}
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
  filters: {
    marginBottom: tokens.spacing.md,
    maxHeight: 36,
  },
  empty: {
    color: tokens.colors.textSecondary,
    textAlign: "center",
    marginTop: tokens.spacing.lg,
  },
});
