import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/cart`, lastModified: new Date() },
    { url: `${baseUrl}/quote`, lastModified: new Date() },
    { url: `${baseUrl}/auth`, lastModified: new Date() },
    { url: `${baseUrl}/menu`, lastModified: new Date() },
    { url: `${baseUrl}/profile`, lastModified: new Date() },
    { url: `${baseUrl}/prices`, lastModified: new Date() },
    { url: `${baseUrl}/dashboard`, lastModified: new Date() },
    { url: `${baseUrl}/cakes`, lastModified: new Date() },
    { url: `${baseUrl}/track`, lastModified: new Date() },
    { url: `${baseUrl}/order`, lastModified: new Date() },
  ];
}

