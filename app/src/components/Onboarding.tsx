import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { tokens } from "@/theme/tokens";

const SLIDES = [
  {
    id: "1",
    emoji: "🌿",
    title: "Bem-vindo à Terra Viva!",
    body: "A feira digital que conecta quem produz com quem quer comprar fresco, direto do campo.",
  },
  {
    id: "2",
    emoji: "🛒",
    title: "Como comprar",
    body: "Navegue pelas bancas, escolha os produtos e faça sua reserva em segundos. Fácil assim!",
  },
  {
    id: "3",
    emoji: "🌽",
    title: "Como vender",
    body: "Crie seu perfil, adicione seus produtos e receba pedidos. Sem complicação.",
  },
];

interface Props {
  onDone: () => void;
}

export function Onboarding({ onDone }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  }

  async function finish() {
    await AsyncStorage.setItem("onboarding_done", "1");
    onDone();
  }

  function next() {
    if (index < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finish();
    }
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={next} activeOpacity={0.85}>
        <Text style={styles.btnText}>
          {index < SLIDES.length - 1 ? "Próximo →" : "Começar!"}
        </Text>
      </TouchableOpacity>

      {index < SLIDES.length - 1 && (
        <TouchableOpacity onPress={finish}>
          <Text style={styles.skip}>Pular</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: tokens.colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: tokens.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.border,
  },
  dotActive: {
    backgroundColor: tokens.colors.primary,
    width: 20,
  },
  btn: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  skip: {
    color: tokens.colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
});
