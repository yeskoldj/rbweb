// Declaration to satisfy TypeScript when compiled in a Node.js environment
// where `Deno` is not defined. The actual presence of `Deno` is checked at runtime.
declare const Deno: { env: { get(key: string): string | undefined } } | undefined

export function getEnvVar(key: string, defaultValue = ""): string {
  const value =
    // In Supabase Edge Functions, environment variables are accessed via Deno.env
    // `Deno` is undefined in Node.js environments (like Next.js), so fallback to process.env
    typeof Deno !== "undefined" && typeof Deno.env !== "undefined"
      ? Deno.env.get(key) ?? defaultValue
      : process.env[key] ?? defaultValue;

  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value;
}
