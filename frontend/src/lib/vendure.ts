export const VENDURE_SHOP_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || 'http://localhost:3000/shop-api';

export async function queryVendure<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(VENDURE_SHOP_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    next: { revalidate: 0 } // Bypass Next.js cache
  });

  const json = await res.json();
  if (json.errors) {
    console.error('Vendure GraphQL Errors:', json.errors);
    throw new Error('Failed to fetch from Vendure API');
  }

  return json.data as T;
}

/* ── Queries ── */

export const GET_PRODUCTS_QUERY = `
  query GetProducts($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        slug
        name
        description
        featuredAsset {
          preview
        }
        variants {
          id
          sku
          name
          price
          currencyCode
          options {
            id
            code
            name
            group {
              id
              code
              name
            }
          }
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT_BY_SLUG_QUERY = `
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      slug
      name
      description
      featuredAsset {
        preview
      }
      assets {
        id
        preview
        source
      }
      optionGroups {
        id
        code
        name
        options {
          id
          code
          name
        }
      }
      variants {
        id
        sku
        name
        price
        priceWithTax
        currencyCode
        stockLevel
        options {
          id
          code
          name
          group {
            id
            code
            name
          }
        }
      }
    }
  }
`;

/* ── Pet Photo Upload ── */

/**
 * Upload pet photos to Vendure via our custom Shop API mutation.
 * Uses the GraphQL multipart request spec (FormData).
 * Returns an array of created Asset objects.
 */
export async function uploadPetPhotos(
  files: File[],
  token?: string | null,
): Promise<{ id: string; preview: string }[]> {
  const operations = {
    query: `
      mutation UploadPetPhotos($files: [Upload!]!) {
        uploadPetPhotos(files: $files) {
          id
          preview
        }
      }
    `,
    variables: {
      files: files.map(() => null),
    },
  };

  // GraphQL multipart request spec
  // See: https://github.com/jaydenseric/graphql-multipart-request-spec
  const map: Record<string, string[]> = {};
  files.forEach((_, i) => {
    map[String(i)] = [`variables.files.${i}`];
  });

  const formData = new FormData();
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify(map));
  files.forEach((file, i) => {
    formData.append(String(i), file, file.name);
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(VENDURE_SHOP_API, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await res.json();
  if (json.errors) {
    console.error('Upload errors:', json.errors);
    throw new Error('Failed to upload pet photos');
  }

  return json.data.uploadPetPhotos;
}

/* ── Types ── */

export interface OptionGroupRef {
  id: string;
  code: string;
  name: string;
}

export interface VariantOption {
  id: string;
  code: string;
  name: string;
  group: OptionGroupRef;
}

export interface OptionGroup {
  id: string;
  code: string;
  name: string;
  options: {
    id: string;
    code: string;
    name: string;
  }[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  priceWithTax?: number;
  currencyCode: string;
  stockLevel?: string;
  options?: VariantOption[];
  enabled?: boolean;
}

export interface ProductAsset {
  id: string;
  preview: string;
  source: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  featuredAsset?: {
    preview: string;
  } | null;
  assets?: ProductAsset[];
  optionGroups?: OptionGroup[];
  variants: ProductVariant[];
}

export interface GetProductsResponse {
  products: {
    items: Product[];
    totalItems: number;
  }
}

export interface GetProductBySlugResponse {
  product: Product | null;
}

/**
 * Filter product variants to only include enabled/available ones.
 *
 * Stage 1: If `enabled` field exists, filter by enabled === true
 * Stage 2 (fallback): If `enabled` field doesn't exist, filter by valid price
 *
 * This ensures disabled variants don't appear on the frontend.
 */
export function getEnabledVariants(variants: ProductVariant[]): ProductVariant[] {
  return variants.filter(variant => {
    // Stage 1: If enabled field exists, use it
    if (typeof variant.enabled === 'boolean') {
      return variant.enabled;
    }

    // Stage 2 (fallback): Filter by valid price
    // Disabled variants typically have null/undefined/0 prices
    return typeof variant.price === 'number' &&
      !isNaN(variant.price) &&
      variant.price > 0;
  });
}
