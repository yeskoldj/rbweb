export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  const value = process.env[key];
  if (!value) {
    // On the client we avoid throwing to prevent runtime crashes
    if (typeof window !== 'undefined') {
      return defaultValue;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}
