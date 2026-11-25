// Supabase Client Helper with Graceful Fallback
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kubarvdoqwnfmagbggiv.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function getSupabaseAuthUrl(provider: 'google' = 'google', redirectTo?: string) {
  const redirect = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '');
  return `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirect)}`;
}
