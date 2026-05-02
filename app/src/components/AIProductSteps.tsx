import { View, Text, StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";

const STEPS = [
  "Foto importada",
  "Identificando o produto...",
  "Gerando nome e descricao...",
  "Escolhendo categoria...",
  "Definindo identidade visual...",
  "Melhorando foto...",
  "Sugerindo preco para sua regiao...",
];

export function AIProductSteps({ stepIndex }: { stepIndex: number }) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, idx) => {
        const done = idx < stepIndex;
        const running = idx === stepIndex;
        return (
          <View key={label} style={[styles.step, done ? styles.done : running ? styles.running : null]}>
            <Text style={styles.icon}>{done ? "✅" : running ? "⚡" : "⏳"}</Text>
            <Text style={[styles.label, done || running ? styles.labelStrong : null]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  running: {
    backgroundColor: "rgba(61,122,66,0.28)",
  },
  done: {
    backgroundColor: "rgba(42,92,46,0.35)",
  },
  icon: {
    fontSize: 16,
  },
  label: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
  },
  labelStrong: {
    color: "#fff",
    fontWeight: "600",
  },
});
