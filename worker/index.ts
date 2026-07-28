// This site deploys as a Cloudflare Worker with static assets (not classic
// Cloudflare Pages) -- see wrangler.toml's `run_worker_first: ["/api/*"]`.
// That means this script only ever runs for /api/* requests; every other
// path (every Astro page, the custom 404) is served directly from the
// `./dist` build by Cloudflare's static asset handler and never reaches
// this file at all.
//
// Handles image uploads for both provider listings (list-your-practice)
// and, later, product images. Runs server-side so it can hold the R2
// binding directly -- no S3-style API keys needed, Cloudflare authenticates
// the binding itself, scoped to this Worker.
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

async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return jsonError("Method not allowed", 405);

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

    // Not get_bytes_webp(): Photon's WebP encoder is lossless-only (no
    // quality control), which produces files several times LARGER than a
    // compressed JPEG for photos -- the opposite of what this step is for.
    // JPEG at quality 80 reliably shrinks real photos while staying visually
    // clean, so that's the actual "best format for loading" choice here
    // given what this library can do.
    const reencoded = final.get_bytes_jpeg(80);
    final.free();

    // Only use the re-encoded version if it's actually smaller. A phone
    // photo (several MB, well over MAX_OUTPUT_WIDTH) always shrinks a lot
    // here; a small image that's already well-compressed sometimes doesn't
    // -- Photon's encoder isn't as efficient as whatever made the original.
    // Either way, this upload should never come out bigger than it went in.
    if (reencoded.byteLength < inputBytes.byteLength) {
      outputBytes = reencoded;
      contentType = "image/jpeg";
      extension = "jpg";
    }
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
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/upload") return handleUpload(request, env);

    return jsonError("Not found", 404);
  },
};
