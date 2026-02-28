import { bootstrap, JobQueueService } from '@vendure/core';
import { config } from '../src/vendure-config';

/**
 * This script sets up the product variants for "Custom Pet Replica"
 * with the correct pricing structure:
 * - 5" No Base: $149.99
 * - 5" With Base: $174.99
 * - 6" No Base: $184.99
 * - 6" With Base: $214.99
 */

const ADMIN_API = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      ... on CurrentUser {
        id
        identifier
      }
    }
  }
`;

const CREATE_OPTION_GROUP = `
  mutation CreateOptionGroup($input: CreateProductOptionGroupInput!) {
    createProductOptionGroup(input: $input) {
      id
      code
      name
      options {
        id
        code
        name
      }
    }
  }
`;

const ADD_OPTION_GROUP_TO_PRODUCT = `
  mutation AddOptionGroupToProduct($productId: ID!, $optionGroupId: ID!) {
    addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) {
      id
      optionGroups {
        id
        code
        name
      }
    }
  }
`;

const CREATE_VARIANT = `
  mutation CreateVariant($input: [CreateProductVariantInput!]!) {
    createProductVariants(input: $input) {
      id
      name
      sku
      price
      options {
        id
        code
        name
      }
    }
  }
`;

const GET_PRODUCT = `
  query GetProduct($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
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
        name
        sku
        price
      }
    }
  }
`;

const DELETE_VARIANT = `
  mutation DeleteVariant($id: ID!) {
    deleteProductVariant(id: $id) {
      result
      message
    }
  }
`;

async function adminQuery(query: string, variables: any, authToken?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['vendure-auth-token'] = authToken;
  }

  const res = await fetch('http://localhost:3021/admin-api', {
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
  return { data: json.data, authToken: authTokenHeader };
}

async function setupVariants() {
  console.log('Starting variant setup...\n');

  // 1. Login
  console.log('Logging in as superadmin...');
  const loginResult = await adminQuery(ADMIN_API, {
    username: process.env.SUPERADMIN_USERNAME || 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD || 'superadmin',
  });
  const authToken = loginResult.authToken!;
  console.log('✓ Logged in\n');

  // 2. Get the product
  console.log('Fetching "Custom Pet Replica" product...');
  const productResult = await adminQuery(GET_PRODUCT, { slug: 'custom-pet-replica' }, authToken);
  const product = productResult.data.product;

  if (!product) {
    throw new Error('Product "custom-pet-replica" not found');
  }
  console.log(`✓ Found product: ${product.name} (ID: ${product.id})\n`);

  // 3. Delete existing variants if any
  if (product.variants && product.variants.length > 0) {
    console.log(`Deleting ${product.variants.length} existing variant(s)...`);
    for (const variant of product.variants) {
      await adminQuery(DELETE_VARIANT, { id: variant.id }, authToken);
      console.log(`  - Deleted variant: ${variant.name || variant.sku}`);
    }
    console.log('✓ Cleaned up old variants\n');
  }

  // 4. Create option groups
  console.log('Creating option groups...');

  const sizeGroupResult = await adminQuery(
    CREATE_OPTION_GROUP,
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
    authToken
  );
  const sizeGroup = sizeGroupResult.data.createProductOptionGroup;
  console.log(`✓ Created "Size" option group (ID: ${sizeGroup.id})`);

  const baseGroupResult = await adminQuery(
    CREATE_OPTION_GROUP,
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
    authToken
  );
  const baseGroup = baseGroupResult.data.createProductOptionGroup;
  console.log(`✓ Created "Display Base" option group (ID: ${baseGroup.id})\n`);

  // 5. Add option groups to product
  console.log('Linking option groups to product...');
  await adminQuery(ADD_OPTION_GROUP_TO_PRODUCT, { productId: product.id, optionGroupId: sizeGroup.id }, authToken);
  await adminQuery(ADD_OPTION_GROUP_TO_PRODUCT, { productId: product.id, optionGroupId: baseGroup.id }, authToken);
  console.log('✓ Option groups linked\n');

  // 6. Create variants
  console.log('Creating 4 product variants...');

  const sizeOptions = sizeGroup.options;
  const baseOptions = baseGroup.options;

  const size5 = sizeOptions.find((o: any) => o.code === '5-inch')!;
  const size6 = sizeOptions.find((o: any) => o.code === '6-inch')!;
  const noBase = baseOptions.find((o: any) => o.code === 'no-base')!;
  const withBase = baseOptions.find((o: any) => o.code === 'with-base')!;

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

  const variantsResult = await adminQuery(CREATE_VARIANT, { input: variantsInput }, authToken);
  const variants = variantsResult.data.createProductVariants;

  for (const variant of variants) {
    console.log(`  ✓ ${variant.name}: $${(variant.price / 100).toFixed(2)} (SKU: ${variant.sku})`);
  }

  console.log('\n✅ All done! Product variants configured successfully.');
  console.log('\nRefresh your frontend to see the new pricing options.');
}

// Bootstrap Vendure to ensure DB connection, then run setup
bootstrap(config)
  .then(async (app) => {
    await setupVariants();
    // Wait for any pending jobs to complete
    const jobQueueService = app.get(JobQueueService);
    await jobQueueService.start();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await app.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
