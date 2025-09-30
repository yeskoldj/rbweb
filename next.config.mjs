const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'static.readdy.ai',
  },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (typeof SUPABASE_URL === 'string' && SUPABASE_URL.trim().length > 0) {
  try {
    const { hostname } = new URL(SUPABASE_URL.trim());

    if (hostname && !remotePatterns.some((pattern) => pattern.hostname === hostname)) {
      remotePatterns.push({
        protocol: 'https',
        hostname,
      });
    }
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL for Next.js image optimization:', error);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
