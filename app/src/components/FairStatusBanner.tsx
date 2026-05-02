import { View, Text, StyleSheet } from "react-native";

import { useTenant } from "@/context/TenantContext";
import { tokens } from "@/theme/tokens";

export function FairStatusBanner() {
  const tenant = useTenant();

  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        {tenant
          ? `Feira ${tenant.name}: aberta para reservas nesta semana.`
          : "Feira aberta para reservas ate sexta 18h."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "white",
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.md,
  },
  text: {
    color: tokens.colors.textPrimary,
  },
});
