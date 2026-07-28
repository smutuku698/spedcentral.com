// Cloudflare Pages Function -- handles image uploads for both provider
// listings (from list-your-practice) and, later, product images. Runs
// server-side in the Workers runtime so it can hold the R2 binding directly
// (no S3-style API keys needed at all -- Cloudflare authenticates the
// binding itself, scoped to this Pages project).
//
// Requires an R2 bucket bound to this Pages project as `MEDIA_BUCKET`
// (Pages project -> Settings -> Functions -> R2 bucket bindings, set for
// both Production and Preview).
//
// Resizes + re-encodes to WebP at upload time (not build time) because
// these files land in the bucket after the site is already built and
// deployed -- Astro's own image pipeline (astro:assets) only ever sees
// images that exist in the repo at build time, so it can't touch these.
import { PhotonImage, SamplingFilter, resize } from "@cf-wasm/photon/workerd";

interface Env {
  MEDIA_BUCKET: R2Bucket;
}

const ALLOWED_ENTITY_TYPES = new Set(["providers", "products"]);
const ALLOWED_SLOTS = new Set(["hero", "logo", "gallery"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8MB -- generous for a phone photo, small enough to stay well under the Worker's memory cap
const MAX_OUTPUT_WIDTH = 1600; // plenty for a hero/gallery image, keeps the WebP small

// Keeps object keys readable and keyword-bearing (SEO-friendly filenames,
// easy to eyeball in the R2 dashboard) instead of opaque hashes/uuids.
function slugifyKeyPart(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart/form-data", 400);
  }

  const file = form.get("file");
  const entityType = String(form.get("entityType") ?? "");
  const entitySlug = slugifyKeyPart(String(form.get("entitySlug") ?? ""));
  const slot = String(form.get("slot") ?? "");
  const index = form.get("index");

  if (!(file instanceof File)) return jsonError("Missing file", 400);
  if (!ALLOWED_ENTITY_TYPES.has(entityType)) return jsonError("Invalid entityType", 400);
  if (!ALLOWED_SLOTS.has(slot)) return jsonError("Invalid slot", 400);
  if (!entitySlug) return jsonError("Missing entitySlug", 400);
  if (!ALLOWED_MIME_TYPES.has(file.type)) return jsonError("Only JPEG, PNG, or WebP images are accepted", 400);
  if (file.size > MAX_INPUT_BYTES) return jsonError("Image is too large (8MB max)", 400);

  const inputBytes = new Uint8Array(await file.arrayBuffer());

  // Best-effort resize + WebP conversion. If Photon can't decode the file
  // for any reason, fall back to storing the original untouched rather than
  // failing the whole upload over an optimization step.
  let outputBytes: Uint8Array = inputBytes;
  let contentType = file.type;
  let extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  try {
    const decoded = PhotonImage.new_from_byteslice(inputBytes);
    const width = decoded.get_width();
    const height = decoded.get_height();

    let final = decoded;
    if (width > MAX_OUTPUT_WIDTH) {
      const newHeight = Math.round((MAX_OUTPUT_WIDTH / width) * height);
      final = resize(decoded, MAX_OUTPUT_WIDTH, newHeight, SamplingFilter.Lanczos3);
      decoded.free();
    }

    outputBytes = final.get_bytes_webp();
    contentType = "image/webp";
    extension = "webp";
    final.free();
  } catch {
    // keep original bytes/contentType/extension set above
  }

  const slotName = slot === "gallery" && index ? `gallery-${Number(index)}` : slot;
  const key = `${entityType}/${entitySlug}/${slotName}.${extension}`;

  await env.MEDIA_BUCKET.put(key, outputBytes, {
    httpMetadata: { contentType },
  });

  return new Response(JSON.stringify({ key }), {
    headers: { "Content-Type": "application/json" },
  });
};
