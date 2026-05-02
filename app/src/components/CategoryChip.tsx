import { View, Text, StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";

export function CategoryChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "white",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 999,
    marginRight: tokens.spacing.sm,
  },
  text: {
    color: tokens.colors.primary,
    fontWeight: "600",
  },
});
