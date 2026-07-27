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
