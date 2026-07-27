# SpedCentral

A directory of special education providers, specialists, and products —
launching in Houston, TX, built to expand nationwide.

## Stack

- **Astro + Tailwind CSS** — static-first for speed and SEO, deployed on Cloudflare Pages
- **Supabase (Postgres)** — providers, products, categories, reviews (see `supabase/`)
- **Cloudflare R2** — provider photos, logos, product images (not yet wired up)
- Editorial content (guides, IEP help) lives as Astro content collections, not the database

## Development

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

## Database

Run these in the Supabase SQL editor, in order, when setting up a new project:

1. `supabase/schema.sql` — full table/RLS definitions
2. `supabase/seed_geography.sql` — states + Houston-metro cities
3. `supabase/seed_categories.sql` — reference data + the full service/product category taxonomy
4. `supabase/migration_001_product_image_fallback.sql` — adds `products.image_icon`/`image_tint`
5. `supabase/migration_002_product_key_features.sql` — adds `products.key_features`

`supabase/db-reference.json` is a plain-language data dictionary of every table/column — useful when working on the DB without re-reading `schema.sql` line by line.

## Project structure

```
src/
  components/   Astro components (homepage sections, shared UI)
  layouts/      Base page layout with SEO meta defaults
  lib/          Supabase client + data-access layer (src/lib/data.ts)
  pages/        Routes (file-based)
  styles/       Tailwind v4 global stylesheet + design tokens
supabase/       SQL schema + seed data
```

## Design notes

### Why provider/product IDs are generated client-side, not by the database

Every table uses `gen_random_uuid()`, which mints a random, unique ID for
each row — not a counted-up sequence. That randomness is what makes it safe
to generate the ID *before* anything is saved: when the "Add my listing"
form is submitted, the app generates the row's UUID itself (client-side)
before touching the database at all. That same ID is then used for two
things simultaneously — the folder a provider's photos get uploaded to in
R2 (`providers/{id}/hero.jpg`) and the `id` the profile row gets saved
with. Since both are stamped with the identical ID from the start, there's
no "did the image get attached to the right profile?" question to worry
about later.

### Product category taxonomy (9 groups)

Modeled on a researched competitor's proven nav structure, with two of
their sub-categories intentionally left out (`Supplements` — unregulated
health claims are a common source of misinformation aimed at autism
parents; `Autism Awareness` merch — off-brand for a clinical-feeling
directory).

- **Sensory Products** — Calming & Deep Pressure, Movement & Active Seating, Oral Motor Tools, Sensory Swings, Sensory Room Equipment, Stimulation Tools, Ear Muffs & Auditory Sensitivity
- **Communication & Language** — AAC Devices, PECS & Communication Boards, Sign Language Resources, Speech Therapy & Visual Communication Tools, Reading & Writing Aids, Vision & Hearing Assistive Devices
- **Fine & Gross Motor Skills** — Fine Motor Tools, Gross Motor Tools
- **Behavior & Social Skills** — Behavior Management, Calming Products, Social Skills Development
- **Daily Living & Self-Care** — Adaptive Clothing, Feeding Tools, Toileting & Bathing Aids, Safety & Wandering Prevention, Mobility & Positioning Equipment, Adult Independent Living Tools
- **Learning & Education** — Visual Supports, Adapted School Supplies, Digital Downloads & Printables, Educational Software & Apps, Books, Sensory-Friendly Classroom Tools
- **Sleep & Relaxation** — Sleep Aids, Body Socks & Compression Sheets
- **Therapy Tools** — ABA/OT/Speech Therapy Tools, Sensory Diet Kits & Visual Therapy Tools
- **Toys, Games & Fidgets** — Sensory/Educational/Calming Toys, Interactive Games & Pretend Play, Fidgets

37 sub-categories total.
