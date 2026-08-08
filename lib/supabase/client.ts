import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // En el navegador usamos el proxy first-party (/sbproxy) para atravesar
  // firewalls corporativos; Vercel reescribe hacia Supabase.
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/sbproxy`
      : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createBrowserClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // nombre fijo: debe coincidir con server.ts y middleware.ts
    cookieOptions: { name: "sb-trasaas-auth" },
  });
}
