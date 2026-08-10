import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Image, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { X, Check } from "@/components/icons";
import { colors, fonts, radii } from "@/theme/tokens";
import { searchPetFood } from "@/lib/petFoodApi";
import type { FoodItem, PetFoodProduct } from "@/types";

interface Props {
  food: FoodItem;
  onChange: (p: Partial<FoodItem>) => void;
}

const CLEAR_FIELDS: Partial<FoodItem> = {
  foodBrand: undefined,
  foodImageUrl: undefined,
  foodBarcode: undefined,
  foodIngredientsText: undefined,
  proteinPct: undefined,
  fatPct: undefined,
  fiberPct: undefined,
  ashPct: undefined,
  kcalPer100g: undefined,
};

export function FoodSearchField({ food, onChange }: Props) {
  const [query, setQuery] = useState(food.foodName);
  const [results, setResults] = useState<PetFoodProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSelected = !!food.foodBrand || !!food.foodBarcode;

  useEffect(() => {
    if (isSelected) return; // don't re-search once a product is locked in
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await searchPetFood(query);
        setResults(r);
      } catch {
        setError("Couldn't reach the food database — you can still type the name manually.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isSelected]);

  function selectProduct(p: PetFoodProduct) {
    setQuery(p.name);
    setResults([]);
    onChange({
      foodName: p.name,
      foodBrand: p.brand || undefined,
      foodImageUrl: p.imageUrl,
      foodBarcode: p.code || undefined,
      foodIngredientsText: p.ingredientsText,
      proteinPct: p.proteinPct,
      fatPct: p.fatPct,
      fiberPct: p.fiberPct,
      ashPct: p.ashPct,
      kcalPer100g: p.kcalPer100g,
    });
  }

  function clearSelection() {
    onChange({ ...CLEAR_FIELDS });
    setResults([]);
  }

  function onTextChange(v: string) {
    setQuery(v);
    onChange({ foodName: v, ...CLEAR_FIELDS });
  }

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>Food name / label</Text>

      {isSelected ? (
        <View style={styles.selectedCard}>
          {food.foodImageUrl ? (
            <Image source={{ uri: food.foodImageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName} numberOfLines={1}>{food.foodName}</Text>
            {!!food.foodBrand && <Text style={styles.selectedBrand}>{food.foodBrand}</Text>}
            {(food.proteinPct || food.fatPct || food.fiberPct) && (
              <Text style={styles.selectedMacros}>
                {food.proteinPct ? `${food.proteinPct}% protein` : null}
                {food.fatPct ? ` · ${food.fatPct}% fat` : null}
                {food.fiberPct ? ` · ${food.fiberPct}% fiber` : null}
              </Text>
            )}
          </View>
          <View style={styles.matchBadge}>
            <Check size={12} color={colors.sage} />
          </View>
          <Pressable onPress={clearSelection} style={styles.clearBtn}>
            <X size={14} color={colors.inkSoft} />
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={onTextChange}
            placeholder="e.g. Royal Canin Fit 32"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
          />
          <Text style={styles.hint}>
            {loading
              ? "Searching Open Pet Food Facts…"
              : error
              ? error
              : "Searches a free, open pet food database — pick a match or just keep typing."}
          </Text>
          {loading && <ActivityIndicator size="small" color={colors.accentDeep} style={{ marginTop: 6 }} />}
          {results.length > 0 && (
            <View style={styles.results}>
              {results.map((p) => (
                <Pressable key={p.code || p.name} onPress={() => selectProduct(p)} style={styles.resultRow}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.thumbSm} />
                  ) : (
                    <View style={[styles.thumbSm, styles.thumbFallback]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {[p.brand, p.quantity].filter(Boolean).join(" · ") || "Brand unknown"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.labelBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  input: {
    width: "100%", paddingVertical: 14, paddingHorizontal: 16, borderRadius: radii.sm,
    borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surface, fontFamily: fonts.body,
    fontSize: 16, color: colors.ink,
  },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 6 },
  results: {
    marginTop: 10, borderRadius: radii.md, borderWidth: 2, borderColor: colors.ink,
    backgroundColor: colors.surface, overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: 1.5, borderBottomColor: colors.ink,
  },
  resultName: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink },
  resultMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  thumbSm: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.surfaceAlt },
  thumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  thumbFallback: { borderWidth: 2, borderColor: colors.ink },
  selectedCard: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.sageBg,
    borderRadius: radii.md, borderWidth: 2, borderColor: colors.ink, padding: 12,
  },
  selectedName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  selectedBrand: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft, marginTop: 1 },
  selectedMacros: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.accentDeep, marginTop: 3 },
  matchBadge: { width: 22, height: 22, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  clearBtn: { padding: 4 },
});
