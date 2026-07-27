import { createClient } from "@supabase/supabase-js";

// The anon key is safe to expose (PUBLIC_ prefix) -- it's rate-limited and
// every table it can touch is locked down by the RLS policies in
// supabase/schema.sql. Never put the service_role key behind a PUBLIC_ var;
// that one only ever runs server-side, in a protected admin route.
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
);
