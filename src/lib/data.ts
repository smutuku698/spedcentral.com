// Local JSON data layer -- a stand-in for Supabase while the real project
// isn't wired up yet. Every function here is shaped like the Supabase query
// it will eventually become (see the comment above each one), so switching
// later means rewriting these function BODIES only -- every page that calls
// getProviderBySlug(), getFeaturedProducts(), etc. doesn't change at all.
//
// One deliberate difference from the real schema: rows here use readable
// slugs as "id" instead of Postgres uuids, and relationships (provider <->
// category, provider <-> credential, etc.) are plain slug arrays instead of
// join tables, so the JSON stays readable by hand. supabase/schema.sql is
// the source of truth for the real shape.

import statesData from "@/data/states.json";
import citiesData from "@/data/cities.json";
import serviceCategoriesData from "@/data/service-categories.json";
import productCategoriesData from "@/data/product-categories.json";
import credentialsData from "@/data/credentials.json";
import languagesData from "@/data/languages.json";
import insurancesData from "@/data/insurances.json";
import ageGroupsData from "@/data/age-groups.json";
import providersData from "@/data/providers.json";
import providerReviewsData from "@/data/provider-reviews.json";
import productsData from "@/data/products.json";
import productReviewsData from "@/data/product-reviews.json";
import creatorsData from "@/data/creators.json";
// FAQ content is editorial copy, not a Supabase table -- there's no
// `faqs` table in supabase/schema.sql. It lives here as data only so the
// category pages can loop over it the same way they loop over everything
// else; in production this is more likely hand-authored per page or a
// small admin-editable table, not scraped from a live query.
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
  short_description?: string; // longer, on-page intro paragraph
  meta_description?: string; // short, <=155ch -- for the <meta name="description"> tag specifically
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

const states = statesData as State[];
const cities = citiesData as City[];
const serviceCategories = serviceCategoriesData as Category[];
const productCategories = productCategoriesData as Category[];
const credentials = credentialsData as Credential[];
const languages = languagesData;
const insurances = insurancesData;
const ageGroups = ageGroupsData;
const providers = providersData as Provider[];
const providerReviews = providerReviewsData as (Review & { provider_id: string })[];
const products = productsData as Product[];
const productReviews = productReviewsData as (Review & { product_id: string })[];
const creators = creatorsData;

// select * from states
export function getStates() {
  return states;
}

// select * from cities where slug = :slug
export function getCityBySlug(slug: string) {
  return cities.find((c) => c.slug === slug) ?? null;
}

// select * from cities where metro_id = (select id from cities where slug = :metroSlug)
export function getCitiesInMetro(metroSlug: string) {
  return cities.filter((c) => c.metro_id === metroSlug);
}

// select * from service_categories where parent_id is null order by display_order
export function getServiceCategoryGroups() {
  return serviceCategories.filter((c) => c.parent_id === null).sort((a, b) => a.display_order - b.display_order);
}

// select * from service_categories where parent_id is not null
// The full leaf-level taxonomy (all ~40 specialties), regardless of whether
// a given one has a real provider yet -- used where the site should show
// its full intended breadth (footer, nav) rather than only what's live today.
export function getAllServiceCategoryLeaves() {
  return serviceCategories.filter((c) => c.parent_id !== null);
}

// select * from service_categories where slug = :slug
export function getServiceCategoryBySlug(slug: string) {
  return serviceCategories.find((c) => c.slug === slug) ?? null;
}

// select * from product_categories where parent_id is null order by display_order
export function getProductCategoryGroups() {
  return productCategories.filter((c) => c.parent_id === null).sort((a, b) => a.display_order - b.display_order);
}

// select * from product_categories where slug = :slug
export function getProductCategoryBySlug(slug: string) {
  return productCategories.find((c) => c.slug === slug) ?? null;
}

// select * from product_categories where parent_id = (select id from product_categories where slug = :parentSlug)
export function getProductCategoryChildren(parentSlug: string) {
  return productCategories.filter((c) => c.parent_id === parentSlug).sort((a, b) => a.display_order - b.display_order);
}

// select * from credentials where slug = any(:slugs)
export function getCredentialsBySlugs(slugs: string[]) {
  return credentials.filter((c) => slugs.includes(c.slug));
}

export function getLanguagesBySlugs(slugs: string[]) {
  return languages.filter((l) => slugs.includes(l.slug));
}

export function getInsurancesBySlugs(slugs: string[]) {
  return insurances.filter((i) => slugs.includes(i.slug));
}

export function getAgeGroupsBySlugs(slugs: string[]) {
  return ageGroups.filter((a) => slugs.includes(a.slug));
}

// select * from public_providers where status = 'published' and is_featured = true
//   order by featured_rank limit :limit
export function getFeaturedProviders(limit = 6) {
  return providers
    .filter((p) => p.status === "published" && p.is_featured)
    .sort((a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999))
    .slice(0, limit);
}

// select * from public_providers where slug = :slug
export function getProviderBySlug(slug: string) {
  return providers.find((p) => p.slug === slug && p.status === "published") ?? null;
}

// select * from public_providers where status = 'published'
export function getPublishedProviders() {
  return providers.filter((p) => p.status === "published");
}

// select * from public_providers
//   join provider_categories on ...
//   where category_slug = :categorySlug and city_slug = :citySlug
export function getProvidersByCategoryAndCity(categorySlug: string, citySlug: string) {
  return providers.filter(
    (p) => p.status === "published" && p.category_slugs.includes(categorySlug) && p.city_slug === citySlug,
  );
}

// Same as above, but rolled up across a whole metro (e.g. "houston" also
// covers Sugar Land, Katy, etc. via cities.metro_id) -- this is what the
// /texas/houston/{category}/ hub pages actually query, since a Houston
// metro hub page should include the surrounding suburbs, not just the
// city named "Houston" itself.
export function getProvidersByCategoryInMetro(categorySlug: string, metroCitySlug: string) {
  const metroCitySlugs = [metroCitySlug, ...getCitiesInMetro(metroCitySlug).map((c) => c.slug)];
  return providers.filter(
    (p) =>
      p.status === "published" &&
      p.category_slugs.includes(categorySlug) &&
      metroCitySlugs.includes(p.city_slug),
  );
}

// Every place that links to a /texas/houston/{category}/ page -- the
// service category hub's own getStaticPaths, the homepage category bar,
// the footer -- calls this SAME function, so there is exactly one
// definition of "which categories have a real page" in the whole app.
// Add a provider in a new category and it shows up everywhere on its own;
// there's nothing else to update by hand.
export function getActiveServiceCategories(metroCitySlug: string) {
  return serviceCategories
    .filter((c) => c.parent_id !== null && getProvidersByCategoryInMetro(c.slug, metroCitySlug).length > 0)
    .sort((a, b) => a.display_order - b.display_order);
}

// Cities that currently have at least one published provider -- used to
// decide which /texas/{city}/ links are safe to publish (no dead links).
export function getActiveCitiesInMetro(metroCitySlug: string) {
  const metroCitySlugs = [metroCitySlug, ...getCitiesInMetro(metroCitySlug).map((c) => c.slug)];
  const activeSlugs = new Set(
    getPublishedProviders()
      .filter((p) => metroCitySlugs.includes(p.city_slug))
      .map((p) => p.city_slug),
  );
  return cities.filter((c) => activeSlugs.has(c.slug));
}

// select * from provider_reviews where provider_id = :providerId and is_published = true
//   order by created_at desc
export function getProviderReviews(providerId: string) {
  return providerReviews
    .filter((r) => r.provider_id === providerId && r.is_published)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// same category, different provider -- for "other specialists nearby" cross-links
export function getRelatedProviders(provider: Provider, limit = 3) {
  return providers
    .filter(
      (p) => p.status === "published" && p.slug !== provider.slug && p.category_slugs.some((c) => provider.category_slugs.includes(c)),
    )
    .slice(0, limit);
}

// select * from public_products where status = 'published' and is_featured = true
//   order by featured_rank limit :limit
export function getFeaturedProducts(limit = 4) {
  return products
    .filter((p) => p.status === "published" && p.is_featured)
    .sort((a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999))
    .slice(0, limit);
}

// select * from public_products where slug = :slug
export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug && p.status === "published") ?? null;
}

// select * from public_products where status = 'published'
export function getPublishedProducts() {
  return products.filter((p) => p.status === "published");
}

// select * from public_products
//   join product_category_links on ...
//   where category_slug = :categorySlug
// Products are tagged with a specific (leaf) category, e.g. "calming-deep-
// pressure", but the hub page lives at the group level, e.g.
// /products/sensory-integration-regulation/. So a group slug here also
// matches any product tagged with one of that group's children.
export function getProductsByCategory(categorySlug: string) {
  const matchSlugs = new Set([categorySlug, ...getProductCategoryChildren(categorySlug).map((c) => c.slug)]);
  return products.filter((p) => p.status === "published" && p.category_slugs.some((c) => matchSlugs.has(c)));
}

// Same single-source-of-truth idea as getActiveServiceCategories: the
// product hub page's getStaticPaths, the homepage chips, and the footer
// all call this rather than each keeping their own copy of "which groups
// have products."
export function getActiveProductCategoryGroups() {
  return getProductCategoryGroups().filter((g) => getProductsByCategory(g.slug).length > 0);
}

// select * from product_reviews where product_id = :productId and is_published = true
//   order by created_at desc
export function getProductReviews(productId: string) {
  return productReviews
    .filter((r) => r.product_id === productId && r.is_published)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// same category, different product -- for "you might also like" cross-links
export function getRelatedProducts(product: Product, limit = 3) {
  return products
    .filter(
      (p) => p.status === "published" && p.slug !== product.slug && p.category_slugs.some((c) => product.category_slugs.includes(c)),
    )
    .slice(0, limit);
}

// select * from public_creators where slug = :slug
export function getCreatorBySlug(slug: string) {
  return creators.find((c) => c.slug === slug) ?? null;
}

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
