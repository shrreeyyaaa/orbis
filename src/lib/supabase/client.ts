import { createBrowserClient } from "@supabase/ssr";
import { createMockSupabaseClient } from "./mock-client";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-ref.supabase.co")) {
    return createMockSupabaseClient() as any;
  }

  try {
    return createBrowserClient(url, key);
  } catch (error) {
    throw new Error("Unable to initialize the connected data client", { cause: error });
  }
}
