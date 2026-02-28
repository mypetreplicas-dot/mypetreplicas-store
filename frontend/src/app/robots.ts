import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://mypetreplicas.com'; // Update in production

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout', '/admin'],
      },
      // AI Search Engines
      {
        userAgent: 'CCBot', // Common Crawl (used by many AI models)
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai', // Claude/Anthropic
        allow: '/',
      },
      {
        userAgent: 'Claude-Web', // Claude web crawler
        allow: '/',
      },
      {
        userAgent: 'GPTBot', // OpenAI's GPT crawler
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User', // ChatGPT user agent
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot', // Perplexity AI
        allow: '/',
      },
      {
        userAgent: 'Bard', // Google Bard
        allow: '/',
      },
      {
        userAgent: 'Googlebot', // Regular Google Bot (also crawls for AI)
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
