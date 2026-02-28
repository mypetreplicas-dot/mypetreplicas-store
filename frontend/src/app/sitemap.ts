import { MetadataRoute } from 'next';
import { queryVendure, GET_PRODUCTS_QUERY, GetProductsResponse } from '@/lib/vendure';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mypetreplicas.com'; // Update in production

  // Fetch all products
  let products: GetProductsResponse['products']['items'] = [];
  try {
    const data = await queryVendure<GetProductsResponse>(GET_PRODUCTS_QUERY, {
      options: { take: 100 },
    });
    products = data.products.items;
  } catch (error) {
    console.error('Failed to fetch products for sitemap:', error);
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...productPages];
}
