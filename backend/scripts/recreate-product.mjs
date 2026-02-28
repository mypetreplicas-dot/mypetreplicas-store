/**
 * Delete old Custom Pet Replica and create a fresh one with correct variants
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

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookies = setCookie.split(';')[0];

  const json = await res.json();
  if (json.errors) {
    console.error('Error:', json.errors[0].message);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

console.log('🗑️  Recreating Custom Pet Replica product\n');

// 1. Login
console.log('1. Logging in...');
await query(`mutation { login(username: "superadmin", password: "superadmin") { ... on CurrentUser { id }}}`);
console.log('   ✓ Logged in\n');

// 2. Delete old product
console.log('2. Deleting old product...');
const { product } = await query(`query { product(slug: "custom-pet-replica") { id name }}`);
if (product) {
  await query(`mutation { deleteProduct(id: "${product.id}") { result }}`);
  console.log(`   ✓ Deleted: ${product.name}\n`);
} else {
  console.log('   (Product not found, skipping)\n');
}

// 3. Create option groups
console.log('3. Creating option groups...');
const { createProductOptionGroup: sizeGroup } = await query(`
  mutation {
    createProductOptionGroup(input: {
      code: "size"
      translations: [{ languageCode: en, name: "Size" }]
      options: [
        { code: "5-inch", translations: [{ languageCode: en, name: "5 inch" }] }
        { code: "6-inch", translations: [{ languageCode: en, name: "6 inch" }] }
      ]
    }) { id options { id code }}
  }
`);
console.log('   ✓ Size group created');

const { createProductOptionGroup: baseGroup } = await query(`
  mutation {
    createProductOptionGroup(input: {
      code: "base"
      translations: [{ languageCode: en, name: "Display Base" }]
      options: [
        { code: "no-base", translations: [{ languageCode: en, name: "No Base" }] }
        { code: "with-base", translations: [{ languageCode: en, name: "With Base" }] }
      ]
    }) { id options { id code }}
  }
`);
console.log('   ✓ Base group created\n');

// 4. Create product with variants
console.log('4. Creating new product...');
const size5 = sizeGroup.options.find(o => o.code === '5-inch').id;
const size6 = sizeGroup.options.find(o => o.code === '6-inch').id;
const noBase = baseGroup.options.find(o => o.code === 'no-base').id;
const withBase = baseGroup.options.find(o => o.code === 'with-base').id;

const { createProduct: newProduct } = await query(`
  mutation {
    createProduct(input: {
      translations: [{
        languageCode: en
        name: "Custom Pet Replica"
        slug: "custom-pet-replica"
        description: "A premium, hand-painted custom replica of your beloved pet. Each figure is meticulously crafted to capture your pet's unique personality and markings."
      }]
      customFields: {}
    }) {
      id
      name
      slug
    }
  }
`);
console.log(`   ✓ Created: ${newProduct.name} (ID: ${newProduct.id})\n`);

// 5. Add option groups
console.log('5. Adding option groups...');
await query(`mutation { addOptionGroupToProduct(productId: "${newProduct.id}", optionGroupId: "${sizeGroup.id}") { id }}`);
await query(`mutation { addOptionGroupToProduct(productId: "${newProduct.id}", optionGroupId: "${baseGroup.id}") { id }}`);
console.log('   ✓ Linked\n');

// 6. Create variants
console.log('6. Creating variants...');
const variants = [
  { name: '5" No Base', sku: 'CPR-5-NB', price: 14999, opts: [size5, noBase] },
  { name: '5" With Base', sku: 'CPR-5-WB', price: 17499, opts: [size5, withBase] },
  { name: '6" No Base', sku: 'CPR-6-NB', price: 18499, opts: [size6, noBase] },
  { name: '6" With Base', sku: 'CPR-6-WB', price: 21499, opts: [size6, withBase] },
];

for (const v of variants) {
  await query(`
    mutation {
      createProductVariants(input: [{
        productId: "${newProduct.id}"
        sku: "${v.sku}"
        price: ${v.price}
        optionIds: ["${v.opts[0]}", "${v.opts[1]}"]
        translations: [{ languageCode: en, name: "${v.name}" }]
      }]) { id name price }
    }
  `);
  console.log(`   ✓ ${v.name}: $${(v.price / 100).toFixed(2)}`);
}

console.log('\n✅ Done! Product recreated with clean structure.');
console.log('   Refresh your frontend to see it.');
