import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Button } from "@/components/Button";
import { AIProductSteps } from "@/components/AIProductSteps";
import { api } from "@/services/api";
import { tokens } from "@/theme/tokens";

const CATEGORIES = [
  "hortifruti",
  "queijos",
  "paes",
  "doces",
  "embutidos",
  "conservas",
  "colonial",
  "bebidas",
  "ovos",
  "artesanal",
  "temperos",
  "outros",
];

type Phase = "picker" | "loading" | "editor";

export function AIProductScreen({ navigation }: any) {
  const [phase, setPhase] = useState<Phase>("picker");
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [enhancedPhotoUrl, setEnhancedPhotoUrl] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<"original" | "enhanced">("enhanced");
  const [useColors, setUseColors] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("outros");
  const [price, setPrice] = useState("");
  const [colorPrimary, setColorPrimary] = useState<string | null>(null);
  const [colorAccent, setColorAccent] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, 6));
    }, 1200 + Math.round(Math.random() * 700));
    return () => clearInterval(timer);
  }, [phase]);

  const effectivePhoto = useMemo(() => {
    if (selectedPhoto === "enhanced" && enhancedPhotoUrl) return enhancedPhotoUrl;
    return originalPhotoUrl;
  }, [selectedPhoto, enhancedPhotoUrl, originalPhotoUrl]);

  function parsePriceInput(value: string) {
    const clean = value.replace(/[^\d,.]/g, "").replace(",", ".");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }

  async function uploadPhotoFromUri(uri: string): Promise<string> {
    const fileName = uri.split("/").pop() || `photo-${Date.now()}.jpg`;
    const mime = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: mime,
    } as any);

    const uploadRes = await api.post("/producer/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });

    return uploadRes.data.url as string;
  }

  async function pickImage(kind: "camera" | "gallery") {
    try {
      const result =
        kind === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setLoading(true);
      const startedAt = Date.now();

      const uploadedUrl = await uploadPhotoFromUri(result.assets[0].uri);
      if (!mountedRef.current) return;
      setOriginalPhotoUrl(uploadedUrl);
      setPhase("loading");

      const profileRes = await api.get("/producer/profile").catch(() => ({ data: {} }));
      const city = profileRes.data?.city || undefined;

      const aiRes = await api.post(
        "/products/ai-generate",
        { photo_url: uploadedUrl, city },
        { timeout: 90000 }
      );

      const elapsed = Date.now() - startedAt;
      if (elapsed < 7000) {
        await new Promise((resolve) => setTimeout(resolve, 7000 - elapsed));
      }

      if (!mountedRef.current) return;
      const data = aiRes.data || {};
      setStepIndex(7);
      setName(data.name || "");
      setDescription(data.description || "");
      setCategory(data.category || "outros");
      setPrice(typeof data.suggested_price === "number" ? String(data.suggested_price.toFixed(2)) : "");
      setEnhancedPhotoUrl(data.enhanced_photo_url || null);
      setSelectedPhoto(data.enhanced_photo_url ? "enhanced" : "original");
      setColorPrimary(data.color_primary || null);
      setColorAccent(data.color_accent || null);
      setPhase("editor");
    } catch {
      Alert.alert(
        "IA indisponivel",
        "Vamos continuar com o cadastro manual.",
        [
          {
            text: "OK",
            onPress: () => navigation.replace("AddProduct", { photo_url: originalPhotoUrl || undefined }),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  async function publishProduct() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatorio", "Preencha o nome do produto.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/products", {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        price: parsePriceInput(price),
        photo_url: effectivePhoto || undefined,
        color_primary: useColors ? colorPrimary || undefined : undefined,
        color_accent: useColors ? colorAccent || undefined : undefined,
        is_active: true,
      });
      Alert.alert("Produto publicado", "Seu produto foi salvo com sucesso.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "picker") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cadastro com IA</Text>
        <Text style={styles.subtitle}>Escolha uma foto e a IA prepara seu anuncio.</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.optionButton} onPress={() => pickImage("camera")}>
            <Text style={styles.optionEmoji}>📷</Text>
            <Text style={styles.optionText}>Tirar foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => pickImage("gallery")}>
            <Text style={styles.optionEmoji}>🖼️</Text>
            <Text style={styles.optionText}>Galeria</Text>
          </TouchableOpacity>
        </View>
        {loading ? <Text style={styles.helper}>Enviando foto...</Text> : null}
      </View>
    );
  }

  if (phase === "loading") {
    return (
      <View style={[styles.container, styles.loadingBg]}>
        <Text style={styles.loadingTitle}>IA montando seu produto</Text>
        <Text style={styles.loadingSubtitle}>Estamos processando sua foto.</Text>
        <AIProductSteps stepIndex={stepIndex} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Revise e publique</Text>

      {effectivePhoto ? (
        <Image source={{ uri: effectivePhoto }} style={styles.previewImage} />
      ) : null}

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.chip, selectedPhoto === "original" ? styles.chipActive : styles.chipMuted]}
          onPress={() => setSelectedPhoto("original")}
        >
          <Text style={selectedPhoto === "original" ? styles.chipTextActive : styles.chipTextMuted}>Original</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, selectedPhoto === "enhanced" ? styles.chipActive : styles.chipMuted]}
          onPress={() => setSelectedPhoto("enhanced")}
          disabled={!enhancedPhotoUrl}
        >
          <Text style={selectedPhoto === "enhanced" ? styles.chipTextActive : styles.chipTextMuted}>Melhorada</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome" />
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Preco" keyboardType="decimal-pad" />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Descricao"
        multiline
        numberOfLines={3}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat ? styles.chipActive : styles.chipMuted]}
            onPress={() => setCategory(cat)}
          >
            <Text style={category === cat ? styles.chipTextActive : styles.chipTextMuted}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.switchRow} onPress={() => setUseColors((prev) => !prev)}>
        <Text style={styles.switchText}>{useColors ? "✅" : "⬜"} Usar cores sugeridas no card</Text>
      </TouchableOpacity>

      <View style={styles.actionsRowBottom}>
        <Button title={saving ? "Publicando..." : "Publicar produto"} onPress={publishProduct} />
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Descartar", "Deseja descartar este cadastro?", [
              { text: "Voltar", style: "cancel" },
              { text: "Descartar", style: "destructive", onPress: () => navigation.goBack() },
            ])
          }
        >
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: tokens.colors.textPrimary,
  },
  subtitle: {
    color: tokens.colors.textSecondary,
  },
  helper: {
    color: tokens.colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    fontWeight: "600",
    color: tokens.colors.textPrimary,
  },
  loadingBg: {
    backgroundColor: "#17221a",
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  loadingSubtitle: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
  },
  input: {
    backgroundColor: "white",
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  categoriesRow: {
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: tokens.colors.primary,
  },
  chipMuted: {
    backgroundColor: "#e5e7eb",
  },
  chipTextActive: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  chipTextMuted: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  switchRow: {
    marginTop: 4,
  },
  switchText: {
    color: tokens.colors.textPrimary,
    fontSize: 13,
  },
  actionsRowBottom: {
    marginTop: 6,
    gap: 10,
  },
  cancel: {
    textAlign: "center",
    color: tokens.colors.textSecondary,
    fontWeight: "600",
  },
});
