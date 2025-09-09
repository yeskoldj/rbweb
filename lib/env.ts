export function getEnvVar(key: string, defaultValue = ""): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value;
}
