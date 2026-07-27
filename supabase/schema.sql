-- SpedCentral schema (Supabase / Postgres)
-- Three domains, kept structurally separate so a query for one can never
-- accidentally pull in another: PROVIDERS (service directory), PRODUCTS
-- (marketplace/catalog), and shared REFERENCE DATA (geography, languages,
-- credentials, insurances, age groups) that both providers and products
-- reuse without being joined to each other.
--
-- Editorial content (guides, IEP help, glossary) intentionally has NO table
-- here -- see the note at the bottom of this file for why.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- SHARED ENUMS
-- ---------------------------------------------------------------------------

-- one moderation lifecycle, reused by providers and products so the admin
-- workflow (onboard -> review -> publish/reject, suspend/delete anytime)
-- behaves identically across both domains
create type listing_status as enum ('draft', 'pending_review', 'published', 'rejected', 'suspended');

create type subscription_tier as enum ('free', 'basic', 'premium');
create type provider_entity_type as enum ('individual', 'company');
create type price_unit as enum ('per_hour', 'per_session', 'per_month', 'per_package', 'contact_for_pricing');
create type payment_method_type as enum ('cash', 'check', 'credit_card', 'debit_card', 'insurance', 'sliding_scale', 'hsa_fsa', 'financing');

-- 'affiliate': redirect to buy_url, you earn a referral commission, no inventory/payment handling
-- 'digital_download': sold directly on-site (printables, IEP trackers, courses), you process
--   payment and take a cut before paying the creator out via Stripe Connect
create type product_type as enum ('affiliate', 'digital_download');
create type order_status as enum ('pending', 'paid', 'refunded', 'failed');

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- SHARED REFERENCE DATA: geography, languages, credentials, insurances, ages
-- Read by both providers and products, but never joined provider<->product
-- directly -- each domain has its own join table into these lookups.
-- ---------------------------------------------------------------------------

create table states (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                 -- "Texas"
  abbreviation  text not null unique,           -- "TX"
  slug          text not null unique,           -- "texas"  -> /texas/
  meta_title       text,
  meta_description text
);

create table cities (
  id              uuid primary key default gen_random_uuid(),
  state_id        uuid not null references states(id) on delete cascade,
  name            text not null,                -- "Sugar Land"
  slug            text not null,                -- "sugar-land" -> /texas/sugar-land/
  is_metro_hub    boolean not null default false, -- true for "Houston" itself
  metro_id        uuid references cities(id),     -- self-ref: Sugar Land -> Houston
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  meta_title       text,
  meta_description text,
  unique (state_id, slug)
);

create index cities_metro_id_idx on cities(metro_id);
create index cities_state_id_idx on cities(state_id);

create table languages (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,                -- "Spanish"
  code  text not null unique,         -- "es" (ISO 639-1)
  slug  text not null unique
);

create table age_groups (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,       -- "Early Intervention (0-3)"
  slug           text not null unique,
  min_age        int,
  max_age        int,
  display_order  int not null default 0
);

-- where a product gets used -- orthogonal to category, so "Weighted Blanket"
-- can be Category=Calming & Deep Pressure, Environment=Home *and* School
create table environments (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,       -- "School / Classroom"
  slug           text not null unique,
  display_order  int not null default 0
);

create table credentials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,              -- "Board Certified Behavior Analyst"
  abbreviation  text not null unique,       -- "BCBA"
  slug          text not null unique,
  description   text
);

create table insurances (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,               -- "Blue Cross Blue Shield"
  slug  text not null unique
);

-- ---------------------------------------------------------------------------
-- DOMAIN 1: PROVIDERS (the service directory)
-- ---------------------------------------------------------------------------

create table service_categories (
  id                  uuid primary key default gen_random_uuid(),
  parent_category_id  uuid references service_categories(id),
  name                text not null,              -- "Speech Therapy"
  slug                text not null unique,        -- -> /texas/houston/speech-therapy/
  short_description   text,
  icon                text,                        -- lucide icon name
  display_order       int not null default 0,
  meta_title          text,
  meta_description    text
);

create index service_categories_parent_idx on service_categories(parent_category_id);

create table providers (
  id                  uuid primary key default gen_random_uuid(),
  parent_provider_id  uuid references providers(id) on delete set null, -- staff -> company
  entity_type         provider_entity_type not null,
  status              listing_status not null default 'draft',

  -- identity
  name                text not null,               -- person name or company name
  slug                text not null unique,
  tagline             text,                          -- short one-liner shown on grid cards
  bio                 text,
  education           text,                          -- free-form, not filterable: "M.S., Baylor University"
  years_experience    int,

  -- trust/verification (site's own vetting -- distinct from self-reported credentials)
  license_number      text,
  license_state       text,
  is_verified         boolean not null default false,
  verified_at         timestamptz,
  accepting_new_clients boolean not null default true,

  -- contact -- rendered rel="nofollow noopener noreferrer" so outbound
  -- links don't pass SEO equity away from the site
  phone               text,
  email               text,
  website_url         text,
  social_facebook_url  text,
  social_instagram_url text,
  social_linkedin_url  text,
  social_youtube_url   text,
  intro_video_url      text,

  -- location (primary business address; provider_locations below covers
  -- additional areas served/service radius)
  address_line1       text,
  address_line2       text,
  primary_city_id     uuid references cities(id),
  postal_code         text,
  latitude            numeric(9,6),
  longitude           numeric(9,6),
  accepts_teletherapy boolean not null default false,

  -- pricing
  price_min           numeric(8,2),
  price_max           numeric(8,2),
  price_unit          price_unit,
  payment_methods     payment_method_type[] not null default '{}',

  -- media (single hero photo/logo; provider_photos below is the gallery)
  photo_url           text,                          -- Cloudflare R2 URL
  logo_url            text,                          -- R2 URL, companies only

  -- monetization
  subscription_tier   subscription_tier not null default 'free',
  is_featured         boolean not null default false,
  featured_rank       int,

  -- ratings (denormalized, kept in sync by trigger below)
  rating_avg          numeric(2,1) not null default 0,
  review_count        int not null default 0,

  -- SEO
  meta_title          text,
  meta_description    text,

  -- internal/admin only -- see public_providers view below, which omits these
  submitted_by_email  text,
  admin_notes         text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index providers_parent_idx on providers(parent_provider_id);
create index providers_status_idx on providers(status);
create index providers_featured_idx on providers(is_featured, featured_rank);
create index providers_primary_city_idx on providers(primary_city_id);

create trigger providers_set_updated_at before update on providers
for each row execute function set_updated_at();

create table provider_hours (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references providers(id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  opens_at     time,
  closes_at    time,
  is_closed    boolean not null default false,
  unique (provider_id, day_of_week)
);

create table provider_photos (
  id             uuid primary key default gen_random_uuid(),
  provider_id    uuid not null references providers(id) on delete cascade,
  url            text not null,
  alt_text       text,
  display_order  int not null default 0
);

create index provider_photos_provider_idx on provider_photos(provider_id);

-- join tables: providers <-> shared reference data / geography
create table provider_categories (
  provider_id  uuid not null references providers(id) on delete cascade,
  category_id  uuid not null references service_categories(id) on delete cascade,
  primary key (provider_id, category_id)
);

create table provider_locations (
  provider_id  uuid not null references providers(id) on delete cascade,
  city_id      uuid not null references cities(id) on delete cascade,
  primary key (provider_id, city_id)
);

create table provider_credentials (
  provider_id    uuid not null references providers(id) on delete cascade,
  credential_id  uuid not null references credentials(id) on delete cascade,
  primary key (provider_id, credential_id)
);

create table provider_languages (
  provider_id  uuid not null references providers(id) on delete cascade,
  language_id  uuid not null references languages(id) on delete cascade,
  primary key (provider_id, language_id)
);

create table provider_age_groups (
  provider_id   uuid not null references providers(id) on delete cascade,
  age_group_id  uuid not null references age_groups(id) on delete cascade,
  primary key (provider_id, age_group_id)
);

create table provider_insurances (
  provider_id   uuid not null references providers(id) on delete cascade,
  insurance_id  uuid not null references insurances(id) on delete cascade,
  primary key (provider_id, insurance_id)
);

create index provider_categories_category_idx on provider_categories(category_id);
create index provider_locations_city_idx on provider_locations(city_id);
create index provider_credentials_credential_idx on provider_credentials(credential_id);
create index provider_languages_language_idx on provider_languages(language_id);
create index provider_age_groups_age_group_idx on provider_age_groups(age_group_id);
create index provider_insurances_insurance_idx on provider_insurances(insurance_id);

create table provider_reviews (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references providers(id) on delete cascade,
  author_name   text not null,
  rating        int not null check (rating between 1 and 5),
  body          text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index provider_reviews_provider_idx on provider_reviews(provider_id);

create or replace function refresh_provider_rating() returns trigger as $$
begin
  update providers p
  set rating_avg   = coalesce((select round(avg(rating)::numeric, 1) from provider_reviews where provider_id = p.id and is_published), 0),
      review_count = (select count(*) from provider_reviews where provider_id = p.id and is_published)
  where p.id = coalesce(new.provider_id, old.provider_id);
  return null;
end;
$$ language plpgsql;

create trigger provider_reviews_after_change
after insert or update or delete on provider_reviews
for each row execute function refresh_provider_rating();

-- visitor -> provider contact requests: the actual revenue event
create table provider_leads (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references providers(id) on delete cascade,
  name          text not null,
  email         text not null,
  phone         text,
  message       text,
  source_page   text,                 -- slug/path the lead came from, for attribution
  created_at    timestamptz not null default now()
);

create index provider_leads_provider_idx on provider_leads(provider_id);

-- public-facing read surface: excludes admin-only columns so the anon/public
-- API key can never expose them, regardless of RLS on the base table
create view public_providers as
  select id, parent_provider_id, entity_type, name, slug, tagline, bio, education,
         years_experience, license_number, license_state, is_verified, verified_at,
         accepting_new_clients, phone, email, website_url, social_facebook_url,
         social_instagram_url, social_linkedin_url, social_youtube_url, intro_video_url,
         address_line1, address_line2, primary_city_id, postal_code, latitude, longitude,
         accepts_teletherapy, price_min, price_max, price_unit, payment_methods,
         photo_url, logo_url, is_featured, featured_rank, rating_avg, review_count,
         meta_title, meta_description, created_at, updated_at
  from providers
  where status = 'published';

-- ---------------------------------------------------------------------------
-- DOMAIN 2: PRODUCTS (tools, gadgets, assistive tech -- the marketplace side)
-- Deliberately its own tables throughout: a product is never joined to a
-- provider except via the optional related_provider_id cross-link below.
-- ---------------------------------------------------------------------------

create table product_categories (
  id                  uuid primary key default gen_random_uuid(),
  parent_category_id  uuid references product_categories(id),
  name                text not null,               -- "Sensory Tools & Fidgets"
  slug                text not null unique,         -- -> /products/sensory-tools/
  short_description   text,
  icon                text,
  display_order       int not null default 0,
  meta_title          text,
  meta_description    text
);

create index product_categories_parent_idx on product_categories(parent_category_id);

-- people/studios who upload digital products (printables, IEP goal trackers,
-- PD courses). Not used at all for affiliate products.
create table creators (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  slug                     text not null unique,
  email                    text not null,
  bio                      text,
  stripe_connect_account_id text,               -- payout destination, set once they onboard to Stripe Connect
  commission_percent       numeric(4,1) not null default 30.0, -- platform's cut, e.g. 30 = 30%
  is_active                boolean not null default true,
  created_at               timestamptz not null default now()
);

create table products (
  id                   uuid primary key default gen_random_uuid(),
  related_provider_id  uuid references providers(id) on delete set null, -- optional cross-link only
  creator_id           uuid references creators(id) on delete set null,  -- digital_download products only
  status               listing_status not null default 'draft',
  product_type         product_type not null default 'affiliate',

  name                 text not null,
  slug                 text not null unique,
  brand                text,
  short_description    text,
  description          text,

  key_features         text[] not null default '{}', -- short bullet points shown on the product page

  price                numeric(8,2),
  sale_price           numeric(8,2),
  currency             text not null default 'USD',
  buy_url              text,                         -- affiliate products: purchase link, rendered nofollow
  digital_file_url     text,                         -- digital_download products only; never exposed publicly,
                                                       -- served via a signed URL after payment confirms

  image_url            text,
  -- fallback decorative treatment (lucide icon name + a Tailwind bg color
  -- class) for products that don't have real photography yet -- e.g. a
  -- tinted box with a sparkle icon instead of a blank card. Both null once
  -- image_url is set to a real R2 photo; purely cosmetic, never required.
  image_icon           text,
  image_tint           text,

  subscription_tier    subscription_tier not null default 'free',
  is_featured          boolean not null default false,
  featured_rank        int,

  rating_avg           numeric(2,1) not null default 0,
  review_count         int not null default 0,

  meta_title           text,
  meta_description     text,

  submitted_by_email   text,
  admin_notes          text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index products_status_idx on products(status);
create index products_featured_idx on products(is_featured, featured_rank);
create index products_related_provider_idx on products(related_provider_id);
create index products_creator_idx on products(creator_id);

create trigger products_set_updated_at before update on products
for each row execute function set_updated_at();

create table product_photos (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  url            text not null,
  alt_text       text,
  display_order  int not null default 0
);

create index product_photos_product_idx on product_photos(product_id);

-- a product can sit in several categories (user explicitly wants this)
create table product_category_links (
  product_id   uuid not null references products(id) on delete cascade,
  category_id  uuid not null references product_categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table product_age_groups (
  product_id    uuid not null references products(id) on delete cascade,
  age_group_id  uuid not null references age_groups(id) on delete cascade,
  primary key (product_id, age_group_id)
);

-- where it's used: Home, School, Therapy/Clinic, etc. -- lets a teacher
-- filter out home-only items and vice versa, per the same product
create table product_environments (
  product_id      uuid not null references products(id) on delete cascade,
  environment_id  uuid not null references environments(id) on delete cascade,
  primary key (product_id, environment_id)
);

create index product_category_links_category_idx on product_category_links(category_id);
create index product_age_groups_age_group_idx on product_age_groups(age_group_id);
create index product_environments_environment_idx on product_environments(environment_id);

create table product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  author_name   text not null,
  rating        int not null check (rating between 1 and 5),
  body          text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index product_reviews_product_idx on product_reviews(product_id);

create or replace function refresh_product_rating() returns trigger as $$
begin
  update products p
  set rating_avg   = coalesce((select round(avg(rating)::numeric, 1) from product_reviews where product_id = p.id and is_published), 0),
      review_count = (select count(*) from product_reviews where product_id = p.id and is_published)
  where p.id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$ language plpgsql;

create trigger product_reviews_after_change
after insert or update or delete on product_reviews
for each row execute function refresh_product_rating();

-- digital_download purchases: the actual money-movement record for the
-- Stripe Connect marketplace flow (you take commission_percent, the rest
-- routes to the creator). Written only by a server-side webhook handler
-- using the service_role key after Stripe confirms payment -- never by the
-- browser directly, so there are no public RLS policies on this table at all.
create table product_orders (
  id                      uuid primary key default gen_random_uuid(),
  product_id              uuid not null references products(id) on delete restrict,
  creator_id              uuid references creators(id) on delete set null,
  buyer_email             text not null,
  buyer_name              text,
  amount                  numeric(8,2) not null,
  currency                text not null default 'USD',
  platform_fee_amount     numeric(8,2) not null,
  creator_payout_amount   numeric(8,2) not null,
  stripe_payment_intent_id text unique,
  status                  order_status not null default 'pending',
  created_at              timestamptz not null default now()
);

create index product_orders_product_idx on product_orders(product_id);
create index product_orders_creator_idx on product_orders(creator_id);

create view public_products as
  select id, related_provider_id, creator_id, product_type, name, slug, brand,
         short_description, description, price, sale_price, currency, buy_url,
         image_url, is_featured, featured_rank, rating_avg, review_count,
         meta_title, meta_description, created_at, updated_at
  from products
  where status = 'published';

-- public creator byline (name/bio) -- omits email and the Stripe account id
create view public_creators as
  select id, name, slug, bio, created_at
  from creators
  where is_active = true;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY: public read of published/reference data, no public
-- writes except the two intentional intake forms (provider onboarding
-- lands as status='pending_review' via the anon key; leads are insert-only)
-- ---------------------------------------------------------------------------

alter table states enable row level security;
alter table cities enable row level security;
alter table languages enable row level security;
alter table age_groups enable row level security;
alter table credentials enable row level security;
alter table insurances enable row level security;
alter table service_categories enable row level security;
alter table providers enable row level security;
alter table provider_hours enable row level security;
alter table provider_photos enable row level security;
alter table provider_categories enable row level security;
alter table provider_locations enable row level security;
alter table provider_credentials enable row level security;
alter table provider_languages enable row level security;
alter table provider_age_groups enable row level security;
alter table provider_insurances enable row level security;
alter table provider_reviews enable row level security;
alter table provider_leads enable row level security;
alter table environments enable row level security;
alter table product_categories enable row level security;
alter table creators enable row level security;
alter table products enable row level security;
alter table product_photos enable row level security;
alter table product_category_links enable row level security;
alter table product_age_groups enable row level security;
alter table product_environments enable row level security;
alter table product_reviews enable row level security;
alter table product_orders enable row level security; -- no policies below: service_role only, by design

create policy "public read states" on states for select using (true);
create policy "public read cities" on cities for select using (true);
create policy "public read languages" on languages for select using (true);
create policy "public read age_groups" on age_groups for select using (true);
create policy "public read credentials" on credentials for select using (true);
create policy "public read insurances" on insurances for select using (true);
create policy "public read service_categories" on service_categories for select using (true);
create policy "public read published providers" on providers for select using (status = 'published');
create policy "public read provider_hours" on provider_hours for select using (true);
create policy "public read provider_photos" on provider_photos for select using (true);
create policy "public read provider_categories" on provider_categories for select using (true);
create policy "public read provider_locations" on provider_locations for select using (true);
create policy "public read provider_credentials" on provider_credentials for select using (true);
create policy "public read provider_languages" on provider_languages for select using (true);
create policy "public read provider_age_groups" on provider_age_groups for select using (true);
create policy "public read provider_insurances" on provider_insurances for select using (true);
create policy "public read published provider_reviews" on provider_reviews for select using (is_published = true);
create policy "public read environments" on environments for select using (true);
create policy "public read product_categories" on product_categories for select using (true);
create policy "public read published products" on products for select using (status = 'published');
create policy "public read product_photos" on product_photos for select using (true);
create policy "public read product_category_links" on product_category_links for select using (true);
create policy "public read product_age_groups" on product_age_groups for select using (true);
create policy "public read product_environments" on product_environments for select using (true);
create policy "public read published product_reviews" on product_reviews for select using (is_published = true);

-- no public policy on `creators` -- public reads go through the
-- public_creators view instead, which omits email/stripe_connect_account_id

-- provider onboarding form: public can INSERT a new provider row, but only
-- ever as 'draft' or 'pending_review' -- never directly as 'published'
create policy "public submit provider onboarding" on providers for insert
  with check (status in ('draft', 'pending_review'));

-- the onboarding form also attaches categories/credentials/languages/age
-- groups/insurances/photos to that same draft row in the same request --
-- gated identically to the provider row itself (only while unpublished), so
-- the public API key can never rewrite the taxonomy on an already-published
-- listing
create policy "public insert provider_categories while unpublished" on provider_categories for insert
  with check (exists (select 1 from providers p where p.id = provider_id and p.status in ('draft', 'pending_review')));
create policy "public insert provider_credentials while unpublished" on provider_credentials for insert
  with check (exists (select 1 from providers p where p.id = provider_id and p.status in ('draft', 'pending_review')));
create policy "public insert provider_languages while unpublished" on provider_languages for insert
  with check (exists (select 1 from providers p where p.id = provider_id and p.status in ('draft', 'pending_review')));
create policy "public insert provider_age_groups while unpublished" on provider_age_groups for insert
  with check (exists (select 1 from providers p where p.id = provider_id and p.status in ('draft', 'pending_review')));
create policy "public insert provider_insurances while unpublished" on provider_insurances for insert
  with check (exists (select 1 from providers p where p.id = provider_id and p.status in ('draft', 'pending_review')));
create policy "public insert provider_photos while unpublished" on provider_photos for insert
  with check (exists (select 1 from providers p where p.id = provider_id and p.status in ('draft', 'pending_review')));

-- leads: insert-only from the public (contact form), no public select
create policy "public insert provider_leads" on provider_leads for insert with check (true);

-- Admin actions (approve/reject/suspend/delete, editing any listing) are NOT
-- covered by these policies -- they run through the Supabase service_role
-- key from a protected admin route, which bypasses RLS entirely. Never
-- expose the service_role key to the browser/Astro client bundle.

-- ---------------------------------------------------------------------------
-- NOTE ON RESOURCES/GUIDES (IEP help, diagnosis guides, glossary, etc.)
-- ---------------------------------------------------------------------------
-- Deliberately NOT a table here. Unlike providers/products, resources are:
--   - written by you/your team, not submitted by third parties (no onboarding
--     form, no approve/reject workflow, no admin_notes)
--   - long-form editorial content, better authored as Markdown/MDX with
--     version history than as a textarea in a database row
--   - pure content -- no location, no price, no lead capture
-- They belong in Astro Content Collections (markdown files under
-- src/content/resources/, one file per article, with a small fixed set of
-- category folders/frontmatter values such as: iep-and-advocacy,
-- diagnosis-guides, funding-and-insurance, parent-support, glossary,
-- state-sped-law). That gives fully static, zero-DB-query pages -- the
-- fastest and cheapest thing Astro can serve -- while providers/products
-- stay in Supabase because they genuinely need dynamic writes and moderation.
