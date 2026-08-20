import type { PetFoodProduct } from "@/types";

const SEARCH_URL = "https://world.openpetfoodfacts.org/cgi/search.pl";
const FIELDS = [
  "code",
  "product_name",
  "brands",
  "quantity",
  "image_front_small_url",
  "ingredients_text",
  "nutriments",
].join(",");

interface OpffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  nutriments?: Record<string, number>;
}

function toProduct(p: OpffProduct): PetFoodProduct | null {
  if (!p.product_name) return null;
  const n = p.nutriments ?? {};
  return {
    code: p.code ?? "",
    name: p.product_name,
    brand: p.brands ?? "",
    imageUrl: p.image_front_small_url,
    quantity: p.quantity,
    ingredientsText: p.ingredients_text,
    proteinPct: n["proteins_100g"],
    fatPct: n["fat_100g"],
    fiberPct: n["fiber_100g"],
    ashPct: n["ash_100g"],
    kcalPer100g: n["energy-kcal_100g"],
  };
}

/**
 * Search Open Pet Food Facts (world.openpetfoodfacts.org) — a free, open,
 * community-maintained pet food database. Coverage is uneven (crowd-sourced),
 * so callers should always allow falling back to manual entry when a search
 * comes up empty.
 */
export async function searchPetFood(query: string, limit = 15): Promise<PetFoodProduct[]> {
  if (!query.trim()) return [];
  const url = `${SEARCH_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}`;
  const res = await fetch(url, { headers: { "User-Agent": "Petliva - Expo App - Android/iOS" } });
  if (!res.ok) throw new Error(`Open Pet Food Facts search failed (${res.status})`);
  const data = await res.json();
  const products: OpffProduct[] = data.products ?? [];
  return products.map(toProduct).filter((p): p is PetFoodProduct => p !== null);
}
