import { createClient, SupabaseClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    rawSupabaseUrl.startsWith("http") &&
    !rawSupabaseUrl.includes("your_supabase")
);

// Fallback seguro para evitar erro em tempo de build na Vercel caso variáveis ainda não estejam definidas
const supabaseUrl = isSupabaseConfigured
  ? rawSupabaseUrl
  : "https://placeholder-project.supabase.co";
const supabaseAnonKey = isSupabaseConfigured
  ? rawSupabaseAnonKey
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Cliente administrativo para uso exclusivo em Route Handlers (Server-side),
 * utilizando SUPABASE_SERVICE_ROLE_KEY quando disponível (ex: Webhook da Stripe).
 */
export function getSupabaseAdmin(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (isSupabaseConfigured && serviceRoleKey && !serviceRoleKey.includes("your_supabase")) {
    return createClient(rawSupabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}
