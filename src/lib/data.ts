// Supabase-backed data layer. Every function here queries the live
// database -- this used to read local JSON test files (see git history),
// but the interfaces below were deliberately kept identical to that JSON
// shape (readable slug arrays like `category_slugs`, not raw join tables)
// so every page that calls getProviderBySlug(), getFeaturedProducts(), etc.
// didn't need to change, only these function bodies did.
//
// FAQ content is still local JSON on purpose -- it's editorial copy, not a
// Supabase table (there's no `faqs` table in supabase/schema.sql).

import { supabase } from "@/lib/supabase";
import serviceCategoryFaqsData from "@/data/service-category-faqs.json";
import productCategoryFaqsData from "@/data/product-category-faqs.json";

export interface State {
  id: string;
  name: string;
  abbreviation: string;
  slug: string;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  is_metro_hub: boolean;
  metro_id: string | null;
  latitude: number;
  longitude: number;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon?: string;
  display_order: number;
  short_description?: string;
  meta_description?: string;
}

export interface Credential {
  id: string;
  name: string;
  abbreviation: string;
  slug: string;
}

export interface Provider {
  id: string;
  entity_type: "individual" | "company";
  status: string;
  name: string;
  slug: string;
  tagline: string;
  bio: string;
  education: string | null;
  years_experience: number;
  license_number: string | null;
  license_state: string | null;
  is_verified: boolean;
  accepting_new_clients: boolean;
  phone: string;
  email: string;
  website_url: string;
  social_facebook_url?: string | null;
  social_instagram_url?: string | null;
  social_linkedin_url?: string | null;
  social_youtube_url?: string | null;
  address_line1: string;
  city_slug: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  accepts_teletherapy: boolean;
  price_min: number;
  price_max: number;
  price_unit: string;
  payment_methods: string[];
  photo_file: string | null;
  is_featured: boolean;
  featured_rank: number | null;
  rating_avg: number;
  review_count: number;
  meta_title: string;
  meta_description: string;
  category_slugs: string[];
  credential_slugs: string[];
  language_slugs: string[];
  age_group_slugs: string[];
  insurance_slugs: string[];
  hours: { day_of_week: number; opens_at: string | null; closes_at: string | null; is_closed: boolean }[];
}

export interface Product {
  id: string;
  creator_id: string | null;
  creator_slug: string | null;
  status: string;
  product_type: "affiliate" | "digital_download";
  name: string;
  slug: string;
  brand: string;
  short_description: string;
  description: string;
  key_features: string[];
  price: number;
  sale_price: number | null;
  currency: string;
  buy_url: string | null;
  image_icon: string;
  image_tint: string;
  is_featured: boolean;
  featured_rank: number | null;
  rating_avg: number;
  review_count: number;
  meta_title: string;
  meta_description: string;
  category_slugs: string[];
  age_group_slugs: string[];
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  is_published: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// query shapes + row -> interface mapping
// ---------------------------------------------------------------------------

const PROVIDER_SELECT = `
  *,
  primary_city:cities!primary_city_id(slug),
  provider_hours(day_of_week,opens_at,closes_at,is_closed),
  provider_categories(service_categories(slug)),
  provider_credentials(credentials(slug)),
  provider_languages(languages(slug)),
  provider_age_groups(age_groups(slug)),
  provider_insurances(insurances(slug))
`;

const PRODUCT_SELECT = `
  *,
  creators(slug),
  product_category_links(product_categories(slug)),
  product_age_groups(age_groups(slug))
`;

// callers historically expect `parent_id` to be the parent's SLUG (a JSON-era
// convention every page still relies on for lookups/grouping), not the raw
// parent_category_id uuid. A self-join (`service_categories!parent_category_id`)
// would be the obvious way to resolve that, but PostgREST can't disambiguate
// the direction of a self-referencing FK without its exact (unnamed, so
// auto-generated and unknown) constraint name -- it silently returns the
// wrong side (children instead of parent). Resolving via a plain id->slug
// map instead, fetched once per table and reused across every call in this
// build (module-level cache, safe since each `astro build` is a fresh process).
type CategoryTable = "service_categories" | "product_categories";
const categoryIdToSlugCache: Partial<Record<CategoryTable, Record<string, string>>> = {};

async function categoryIdToSlugMap(table: CategoryTable): Promise<Record<string, string>> {
  if (!categoryIdToSlugCache[table]) {
    const { data, error } = await supabase.from(table).select("id,slug");
    if (error) throw new Error(error.message);
    categoryIdToSlugCache[table] = Object.fromEntries((data ?? []).map((r: any) => [r.id, r.slug]));
  }
  return categoryIdToSlugCache[table]!;
}

function mapCategory(row: any, idToSlug: Record<string, string>): Category {
  return { ...row, parent_id: row.parent_category_id ? (idToSlug[row.parent_category_id] ?? null) : null };
}

function mapProvider(row: any): Provider {
  return {
    ...row,
    city_slug: row.primary_city?.slug ?? null,
    photo_file: row.photo_url,
    category_slugs: (row.provider_categories ?? []).map((r: any) => r.service_categories.slug),
    credential_slugs: (row.provider_credentials ?? []).map((r: any) => r.credentials.slug),
    language_slugs: (row.provider_languages ?? []).map((r: any) => r.languages.slug),
    age_group_slugs: (row.provider_age_groups ?? []).map((r: any) => r.age_groups.slug),
    insurance_slugs: (row.provider_insurances ?? []).map((r: any) => r.insurances.slug),
    hours: row.provider_hours ?? [],
  };
}

function mapProduct(row: any): Product {
  return {
    ...row,
    creator_slug: row.creators?.slug ?? null,
    category_slugs: (row.product_category_links ?? []).map((r: any) => r.product_categories.slug),
    age_group_slugs: (row.product_age_groups ?? []).map((r: any) => r.age_groups.slug),
  };
}

function orFail<T>({ data, error }: { data: T | null; error: any }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ---------------------------------------------------------------------------
// geography
// ---------------------------------------------------------------------------

export async function getStates(): Promise<State[]> {
  return orFail(await supabase.from("states").select("*"));
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  return orFail(await supabase.from("cities").select("*").eq("slug", slug).maybeSingle());
}

export async function getCitiesInMetro(metroSlug: string): Promise<City[]> {
  const metro = await getCityBySlug(metroSlug);
  if (!metro) return [];
  return orFail(await supabase.from("cities").select("*").eq("metro_id", metro.id).order("name"));
}

// ---------------------------------------------------------------------------
// taxonomy
// ---------------------------------------------------------------------------

export async function getServiceCategoryGroups(): Promise<Category[]> {
  const [data, idToSlug] = await Promise.all([
    orFail<any[]>(await supabase.from("service_categories").select("*").is("parent_category_id", null).order("display_order")),
    categoryIdToSlugMap("service_categories"),
  ]);
  return data.map((row) => mapCategory(row, idToSlug));
}

export async function getAllServiceCategoryLeaves(): Promise<Category[]> {
  const [data, idToSlug] = await Promise.all([
    orFail<any[]>(await supabase.from("service_categories").select("*").not("parent_category_id", "is", null).order("display_order")),
    categoryIdToSlugMap("service_categories"),
  ]);
  return data.map((row) => mapCategory(row, idToSlug));
}

export async function getServiceCategoryBySlug(slug: string): Promise<Category | null> {
  const [data, idToSlug] = await Promise.all([
    orFail<any>(await supabase.from("service_categories").select("*").eq("slug", slug).maybeSingle()),
    categoryIdToSlugMap("service_categories"),
  ]);
  return data ? mapCategory(data, idToSlug) : null;
}

export async function getProductCategoryGroups(): Promise<Category[]> {
  const [data, idToSlug] = await Promise.all([
    orFail<any[]>(await supabase.from("product_categories").select("*").is("parent_category_id", null).order("display_order")),
    categoryIdToSlugMap("product_categories"),
  ]);
  return data.map((row) => mapCategory(row, idToSlug));
}

export async function getProductCategoryBySlug(slug: string): Promise<Category | null> {
  const [data, idToSlug] = await Promise.all([
    orFail<any>(await supabase.from("product_categories").select("*").eq("slug", slug).maybeSingle()),
    categoryIdToSlugMap("product_categories"),
  ]);
  return data ? mapCategory(data, idToSlug) : null;
}

export async function getProductCategoryChildren(parentSlug: string): Promise<Category[]> {
  const parent = await getProductCategoryBySlug(parentSlug);
  if (!parent) return [];
  const [data, idToSlug] = await Promise.all([
    orFail<any[]>(await supabase.from("product_categories").select("*").eq("parent_category_id", parent.id).order("display_order")),
    categoryIdToSlugMap("product_categories"),
  ]);
  return data.map((row) => mapCategory(row, idToSlug));
}

export async function getCredentialsBySlugs(slugs: string[]): Promise<Credential[]> {
  if (!slugs.length) return [];
  return orFail(await supabase.from("credentials").select("*").in("slug", slugs));
}

export async function getLanguagesBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  return orFail(await supabase.from("languages").select("*").in("slug", slugs));
}

export async function getInsurancesBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  return orFail(await supabase.from("insurances").select("*").in("slug", slugs));
}

export async function getAgeGroupsBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  return orFail(await supabase.from("age_groups").select("*").in("slug", slugs));
}

// ---------------------------------------------------------------------------
// providers
// ---------------------------------------------------------------------------

export async function getFeaturedProviders(limit = 6): Promise<Provider[]> {
  const data = orFail<any[]>(
    await supabase.from("providers").select(PROVIDER_SELECT)
      .eq("status", "published").eq("is_featured", true)
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .limit(limit),
  );
  return data.map(mapProvider);
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const data = orFail<any>(
    await supabase.from("providers").select(PROVIDER_SELECT).eq("slug", slug).eq("status", "published").maybeSingle(),
  );
  return data ? mapProvider(data) : null;
}

export async function getPublishedProviders(): Promise<Provider[]> {
  const data = orFail<any[]>(await supabase.from("providers").select(PROVIDER_SELECT).eq("status", "published"));
  return data.map(mapProvider);
}

export async function getProvidersByCategoryAndCity(categorySlug: string, citySlug: string): Promise<Provider[]> {
  const all = await getPublishedProviders();
  return all.filter((p) => p.category_slugs.includes(categorySlug) && p.city_slug === citySlug);
}

export async function getProvidersByCategoryInMetro(categorySlug: string, metroCitySlug: string): Promise<Provider[]> {
  const [suburbs, all] = await Promise.all([getCitiesInMetro(metroCitySlug), getPublishedProviders()]);
  const metroCitySlugs = new Set([metroCitySlug, ...suburbs.map((c) => c.slug)]);
  return all.filter((p) => p.category_slugs.includes(categorySlug) && metroCitySlugs.has(p.city_slug));
}

export async function getActiveServiceCategories(metroCitySlug: string): Promise<Category[]> {
  const [leaves, suburbs, providers] = await Promise.all([
    getAllServiceCategoryLeaves(), getCitiesInMetro(metroCitySlug), getPublishedProviders(),
  ]);
  const metroCitySlugs = new Set([metroCitySlug, ...suburbs.map((c) => c.slug)]);
  const inMetro = providers.filter((p) => metroCitySlugs.has(p.city_slug));
  return leaves
    .filter((c) => inMetro.some((p) => p.category_slugs.includes(c.slug)))
    .sort((a, b) => a.display_order - b.display_order);
}

export async function getActiveCitiesInMetro(metroCitySlug: string): Promise<City[]> {
  const hub = await getCityBySlug(metroCitySlug);
  const suburbs = await getCitiesInMetro(metroCitySlug);
  const allCities = hub ? [hub, ...suburbs] : suburbs;
  const providers = await getPublishedProviders();
  const activeSlugs = new Set(providers.map((p) => p.city_slug));
  return allCities.filter((c) => activeSlugs.has(c.slug));
}

export async function getProviderReviews(providerId: string): Promise<Review[]> {
  return orFail(
    await supabase.from("provider_reviews").select("*").eq("provider_id", providerId).eq("is_published", true)
      .order("created_at", { ascending: false }),
  );
}

export async function getRelatedProviders(provider: Provider, limit = 3): Promise<Provider[]> {
  const all = await getPublishedProviders();
  return all
    .filter((p) => p.slug !== provider.slug && p.category_slugs.some((c) => provider.category_slugs.includes(c)))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// products
// ---------------------------------------------------------------------------

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const data = orFail<any[]>(
    await supabase.from("products").select(PRODUCT_SELECT)
      .eq("status", "published").eq("is_featured", true)
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .limit(limit),
  );
  return data.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = orFail<any>(
    await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("status", "published").maybeSingle(),
  );
  return data ? mapProduct(data) : null;
}

export async function getPublishedProducts(): Promise<Product[]> {
  const data = orFail<any[]>(await supabase.from("products").select(PRODUCT_SELECT).eq("status", "published"));
  return data.map(mapProduct);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const [children, all] = await Promise.all([getProductCategoryChildren(categorySlug), getPublishedProducts()]);
  const matchSlugs = new Set([categorySlug, ...children.map((c) => c.slug)]);
  return all.filter((p) => p.category_slugs.some((c) => matchSlugs.has(c)));
}

export async function getActiveProductCategoryGroups(): Promise<Category[]> {
  const groups = await getProductCategoryGroups();
  const withCounts = await Promise.all(groups.map(async (g) => ({ g, products: await getProductsByCategory(g.slug) })));
  return withCounts.filter(({ products }) => products.length > 0).map(({ g }) => g);
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  return orFail(
    await supabase.from("product_reviews").select("*").eq("product_id", productId).eq("is_published", true)
      .order("created_at", { ascending: false }),
  );
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const all = await getPublishedProducts();
  return all
    .filter((p) => p.slug !== product.slug && p.category_slugs.some((c) => product.category_slugs.includes(c)))
    .slice(0, limit);
}

export interface Creator {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  created_at: string;
}

export async function getCreatorBySlug(slug: string): Promise<Creator | null> {
  return orFail<Creator | null>(await supabase.from("public_creators").select("*").eq("slug", slug).maybeSingle());
}

// ---------------------------------------------------------------------------
// editorial content (local JSON, not Supabase -- see file header)
// ---------------------------------------------------------------------------

export interface FAQ {
  question: string;
  answer: string;
}

const serviceCategoryFaqs = serviceCategoryFaqsData as Record<string, FAQ[]>;
const productCategoryFaqs = productCategoryFaqsData as Record<string, FAQ[]>;

export function getServiceCategoryFaqs(categorySlug: string): FAQ[] {
  return serviceCategoryFaqs[categorySlug] ?? [];
}

export function getProductCategoryFaqs(categorySlug: string): FAQ[] {
  return productCategoryFaqs[categorySlug] ?? [];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatHours(hours: Provider["hours"]) {
  return [...hours]
    .sort((a, b) => (a.day_of_week === 0 ? 7 : a.day_of_week) - (b.day_of_week === 0 ? 7 : b.day_of_week))
    .map((h) => ({
      day: DAY_NAMES[h.day_of_week],
      label: h.is_closed ? "Closed" : `${formatTime(h.opens_at!)} – ${formatTime(h.closes_at!)}`,
    }));
}

function formatTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
