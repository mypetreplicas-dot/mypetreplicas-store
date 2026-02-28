/**
 * Setup Custom Pet Replica variants using cookie-based authentication
 */

const ADMIN_API = 'http://localhost:3021/admin-api';
let cookies = '';

async function query(gql, variables = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookies) headers['cookie'] = cookies;

  const res = await fetch(ADMIN_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: gql, variables }),
  });

  // Capture cookies from login
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookies = setCookie.split(';')[0]; // Extract session cookie
  }

  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Error:', json.errors[0].message);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

console.log('🔧 Fixing Custom Pet Replica variants\n');

// 1. Login
console.log('1. Logging in...');
await query(`
  mutation { login(username: "superadmin", password: "superadmin") {
    ... on CurrentUser { id identifier }
  }}
`);
console.log('   ✓ Logged in\n');

// 2. Get product
console.log('2. Fetching product...');
const { product } = await query(`
  query { product(slug: "custom-pet-replica") {
    id name
    variants { id name sku }
  }}
`);
if (!product) throw new Error('Product not found');
console.log(`   ✓ Found: ${product.name} (ID: ${product.id})\n`);

// 3. Delete old variants
if (product.variants?.length) {
  console.log(`3. Deleting ${product.variants.length} old variant(s)...`);
  for (const v of product.variants) {
    await query(`mutation { deleteProductVariant(id: "${v.id}") { result }}` );
    console.log(`   - Deleted: ${v.name || v.sku}`);
  }
  console.log('   ✓ Done\n');
}

// 4. Create option groups
console.log('4. Creating option groups...');
const { createProductOptionGroup: sizeGroup } = await query(`
  mutation {
    createProductOptionGroup(input: {
      code: "size"
      translations: [{ languageCode: en, name: "Size" }]
      options: [
        { code: "5-inch", translations: [{ languageCode: en, name: "5 inch" }] }
        { code: "6-inch", translations: [{ languageCode: en, name: "6 inch" }] }
      ]
    }) {
      id code
      options { id code name }
    }
  }
`);
console.log(`   ✓ Size (ID: ${sizeGroup.id})`);

const { createProductOptionGroup: baseGroup } = await query(`
  mutation {
    createProductOptionGroup(input: {
      code: "base"
      translations: [{ languageCode: en, name: "Display Base" }]
      options: [
        { code: "no-base", translations: [{ languageCode: en, name: "No Base" }] }
        { code: "with-base", translations: [{ languageCode: en, name: "With Base" }] }
      ]
    }) {
      id code
      options { id code name }
    }
  }
`);
console.log(`   ✓ Base (ID: ${baseGroup.id})\n`);

// 5. Link to product
console.log('5. Linking option groups...');
await query(`mutation { addOptionGroupToProduct(productId: "${product.id}", optionGroupId: "${sizeGroup.id}") { id }}`);
await query(`mutation { addOptionGroupToProduct(productId: "${product.id}", optionGroupId: "${baseGroup.id}") { id }}`);
console.log('   ✓ Linked\n');

// 6. Create variants
console.log('6. Creating variants...');
const size5 = sizeGroup.options.find(o => o.code === '5-inch');
const size6 = sizeGroup.options.find(o => o.code === '6-inch');
const noBase = baseGroup.options.find(o => o.code === 'no-base');
const withBase = baseGroup.options.find(o => o.code === 'with-base');

const variants = [
  { name: '5" No Base', sku: 'CPR-5-NB', price: 14999, opts: [size5.id, noBase.id] },
  { name: '5" With Base', sku: 'CPR-5-WB', price: 17499, opts: [size5.id, withBase.id] },
  { name: '6" No Base', sku: 'CPR-6-NB', price: 18499, opts: [size6.id, noBase.id] },
  { name: '6" With Base', sku: 'CPR-6-WB', price: 21499, opts: [size6.id, withBase.id] },
];

for (const v of variants) {
  await query(`
    mutation {
      createProductVariants(input: [{
        productId: "${product.id}"
        sku: "${v.sku}"
        price: ${v.price}
        optionIds: ["${v.opts[0]}", "${v.opts[1]}"]
        translations: [{ languageCode: en, name: "${v.name}" }]
      }]) { id name price }
    }
  `);
  console.log(`   ✓ ${v.name}: $${(v.price / 100).toFixed(2)}`);
}

console.log('\n✅ All done! Refresh your frontend.');
