import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

import { ProductCard } from "@/components/ProductCard";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

export function BancaScreen({ route, navigation }: any) {
  const [banca, setBanca] = useState<any>(null);

  useEffect(() => {
    api.get(`/bancas/${route.params.bancaId}`).then((response) => setBanca(response.data));
  }, [route.params.bancaId]);

  if (!banca) {
    return (
      <View style={styles.container}>
        <Text>Carregando banca...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{banca.bio}</Text>
      <FlatList
        data={banca.products || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onReserve={() =>
              navigation.navigate("Checkout", {
                productId: item.id,
                productName: item.name,
                productPrice: item.price,
              })
            }
          />
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: tokens.spacing.md,
  },
});
