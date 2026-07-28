// astro:assets requires an actual module import to optimize an image -- a
// plain string path from JSON/a database column isn't enough on its own.
// import.meta.glob resolves every asset once at build time into a lookup
// table, so a filename stored as data (providers.json now, a `photo_url`
// column later) can still be routed through Astro's image optimizer.
const assetModules = import.meta.glob<{ default: ImageMetadata }>("/src/assets/*.{jpg,jpeg,png}", { eager: true });

export function resolveAssetImage(filename: string | null): ImageMetadata | null {
  if (!filename) return null;
  const mod = assetModules[`/src/assets/${filename}`];
  return mod?.default ?? null;
}

// Provider/product photos uploaded through /api/upload live in R2, not in
// this repo -- Supabase's photo_url/logo_url/image_url columns store just
// the object KEY (e.g. "providers/thrive-speech-therapy/hero.webp"), per
// the r2-image-key-convention. This turns that key into a full URL. Returns
// null (rather than throwing) when PUBLIC_R2_BASE_URL isn't configured yet,
// so pages keep rendering their fallback/placeholder art in the meantime.
export function resolveR2Image(key: string | null): string | null {
  if (!key) return null;
  const base = import.meta.env.PUBLIC_R2_BASE_URL as string | undefined;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key}`;
}
