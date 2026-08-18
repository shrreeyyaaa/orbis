import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createMockSupabaseClient } from "./mock-client";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-ref.supabase.co")) {
    return createMockSupabaseClient() as any;
  }

  try {
    const cookieStore = await cookies();
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies; middleware refreshes the session.
          }
        },
      },
    });
  } catch {
    return createMockSupabaseClient() as any;
  }
}
