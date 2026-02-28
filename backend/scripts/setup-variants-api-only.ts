/**
 * This script sets up the product variants for "Custom Pet Replica"
 * via direct API calls (no Vendure bootstrap needed)
 */

const ADMIN_API = 'http://localhost:3021/admin-api';

const QUERIES = {
  LOGIN: `
    mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        ... on CurrentUser {
          id
          identifier
        }
      }
    }
  `,

  GET_PRODUCT: `
    query GetProduct($slug: String!) {
      product(slug: $slug) {
        id
        name
        slug
        optionGroups {
          id
          code
          name
          options { id code name }
        }
        variants {
          id
          name
          sku
          price
        }
      }
    }
  `,

  DELETE_VARIANT: `
    mutation DeleteVariant($id: ID!) {
      deleteProductVariant(id: $id) {
        result
        message
      }
    }
  `,

  CREATE_OPTION_GROUP: `
    mutation CreateOptionGroup($input: CreateProductOptionGroupInput!) {
      createProductOptionGroup(input: $input) {
        id
        code
        name
        options { id code name }
      }
    }
  `,

  ADD_OPTION_GROUP_TO_PRODUCT: `
    mutation AddOptionGroupToProduct($productId: ID!, $optionGroupId: ID!) {
      addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) {
        id
        optionGroups { id code name }
      }
    }
  `,

  CREATE_VARIANTS: `
    mutation CreateVariants($input: [CreateProductVariantInput!]!) {
      createProductVariants(input: $input) {
        id
        name
        sku
        price
        options { id code name }
      }
    }
  `,
};

async function adminQuery(query: string, variables: any, authToken?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['vendure-auth-token'] = authToken;

  const res = await fetch(ADMIN_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0]?.message || 'Admin API error');
  }

  const authTokenHeader = res.headers.get('vendure-auth-token');
  return { data: json.data, authToken: authTokenHeader || authToken };
}

async function main() {
  console.log('🔧 Setting up Custom Pet Replica variants\n');

  // 1. Login
  console.log('1. Logging in...');
  const { authToken } = await adminQuery(QUERIES.LOGIN, {
    username: 'superadmin',
    password: 'superadmin',
  });
  console.log('   ✓ Authenticated\n');

  // 2. Get product
  console.log('2. Fetching product...');
  const productResult = await adminQuery(
    QUERIES.GET_PRODUCT,
    { slug: 'custom-pet-replica' },
    authToken!
  );
  const token = productResult.authToken!;
  const productData = productResult.data;
  const product = productData.product;

  if (!product) throw new Error('Product "custom-pet-replica" not found');
  console.log(`   ✓ Found: ${product.name} (ID: ${product.id})\n`);

  // 3. Delete existing variants
  if (product.variants?.length > 0) {
    console.log(`3. Deleting ${product.variants.length} existing variant(s)...`);
    for (const variant of product.variants) {
      await adminQuery(QUERIES.DELETE_VARIANT, { id: variant.id }, token);
      console.log(`   - Deleted: ${variant.name || variant.sku}`);
    }
    console.log('   ✓ Cleaned up\n');
  } else {
    console.log('3. No existing variants to delete\n');
  }

  // 4. Create option groups
  console.log('4. Creating option groups...');

  const { data: sizeData } = await adminQuery(
    QUERIES.CREATE_OPTION_GROUP,
    {
      input: {
        code: 'size',
        translations: [{ languageCode: 'en', name: 'Size' }],
        options: [
          { code: '5-inch', translations: [{ languageCode: 'en', name: '5 inch' }] },
          { code: '6-inch', translations: [{ languageCode: 'en', name: '6 inch' }] },
        ],
      },
    },
    token
  );
  const sizeGroup = sizeData.createProductOptionGroup;
  console.log(`   ✓ Size group created (ID: ${sizeGroup.id})`);

  const { data: baseData } = await adminQuery(
    QUERIES.CREATE_OPTION_GROUP,
    {
      input: {
        code: 'base',
        translations: [{ languageCode: 'en', name: 'Display Base' }],
        options: [
          { code: 'no-base', translations: [{ languageCode: 'en', name: 'No Base' }] },
          { code: 'with-base', translations: [{ languageCode: 'en', name: 'With Base' }] },
        ],
      },
    },
    token
  );
  const baseGroup = baseData.createProductOptionGroup;
  console.log(`   ✓ Base group created (ID: ${baseGroup.id})\n`);

  // 5. Link option groups to product
  console.log('5. Linking option groups to product...');
  await adminQuery(QUERIES.ADD_OPTION_GROUP_TO_PRODUCT, { productId: product.id, optionGroupId: sizeGroup.id }, token);
  await adminQuery(QUERIES.ADD_OPTION_GROUP_TO_PRODUCT, { productId: product.id, optionGroupId: baseGroup.id }, token);
  console.log('   ✓ Linked\n');

  // 6. Create variants
  console.log('6. Creating 4 variants...');

  const size5 = sizeGroup.options.find((o: any) => o.code === '5-inch')!;
  const size6 = sizeGroup.options.find((o: any) => o.code === '6-inch')!;
  const noBase = baseGroup.options.find((o: any) => o.code === 'no-base')!;
  const withBase = baseGroup.options.find((o: any) => o.code === 'with-base')!;

  const variantsInput = [
    {
      productId: product.id,
      sku: 'CPR-5-NB',
      price: 14999, // $149.99
      optionIds: [size5.id, noBase.id],
      translations: [{ languageCode: 'en', name: '5" No Base' }],
    },
    {
      productId: product.id,
      sku: 'CPR-5-WB',
      price: 17499, // $174.99
      optionIds: [size5.id, withBase.id],
      translations: [{ languageCode: 'en', name: '5" With Base' }],
    },
    {
      productId: product.id,
      sku: 'CPR-6-NB',
      price: 18499, // $184.99
      optionIds: [size6.id, noBase.id],
      translations: [{ languageCode: 'en', name: '6" No Base' }],
    },
    {
      productId: product.id,
      sku: 'CPR-6-WB',
      price: 21499, // $214.99
      optionIds: [size6.id, withBase.id],
      translations: [{ languageCode: 'en', name: '6" With Base' }],
    },
  ];

  const { data: variantsData } = await adminQuery(QUERIES.CREATE_VARIANTS, { input: variantsInput }, token);
  const variants = variantsData.createProductVariants;

  for (const variant of variants) {
    console.log(`   ✓ ${variant.name}: $${(variant.price / 100).toFixed(2)} (${variant.sku})`);
  }

  console.log('\n✅ Done! Refresh your frontend to see the new options.');
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
