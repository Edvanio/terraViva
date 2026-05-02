import { TouchableOpacity, Text, StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";

export function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    alignItems: "center",
  },
  label: {
    color: "white",
    fontWeight: "700",
  },
});
