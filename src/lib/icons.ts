// Products reference an icon by name (e.g. product.image_icon === "Sparkles")
// since we don't have real product photography yet -- this maps that string
// to the actual lucide-react component. Add to this map as new icon names
// show up in products.json.
import { Sparkles, MessageCircle, Presentation, Home, type LucideIcon } from "lucide-react";

export const productIcons: Record<string, LucideIcon> = {
  Sparkles,
  MessageCircle,
  Presentation,
  Home,
};

// Category `icon` fields (in service-categories.json / product-categories.json)
// use lucide's own kebab-case file naming ("message-circle"), not the
// PascalCase component name -- convert so the same productIcons map can
// render both without keeping two separate lookup tables.
export function iconKeyFromSlug(slug: string): string {
  return slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
}
