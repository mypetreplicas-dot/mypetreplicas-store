/**
 * Update shipping methods:
 * - Change "Standard Shipping" to "Local Delivery (San Antonio)"
 * - Add personal delivery message
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

console.log('🚚 Updating Shipping Methods\n');

// 1. Login
console.log('1. Logging in...');
await query(`mutation { login(username: "superadmin", password: "superadmin") { ... on CurrentUser { id }}}`);
console.log('   ✓ Logged in\n');

// 2. Get all shipping methods
console.log('2. Fetching shipping methods...');
const { shippingMethods } = await query(`
  query {
    shippingMethods {
      items {
        id
        code
        name
        description
      }
    }
  }
`);

console.log(`   Found ${shippingMethods.items.length} shipping method(s):`);
shippingMethods.items.forEach(method => {
  console.log(`   - ${method.name} (${method.code})`);
});
console.log();

// 3. Update Standard Shipping to Local Delivery
const standardShipping = shippingMethods.items.find(m =>
  m.code === 'standard-shipping' || m.name.toLowerCase().includes('standard')
);

if (standardShipping) {
  console.log('3. Updating shipping method...');
  await query(`
    mutation {
      updateShippingMethod(input: {
        id: "${standardShipping.id}"
        translations: [{
          languageCode: en
          name: "Local Delivery"
          description: "I will personally deliver your replica to you! (San Antonio area only)"
        }]
      }) {
        id
        name
        description
      }
    }
  `);
  console.log('   ✓ Updated: Local Delivery');
  console.log('   📝 Description: "I will personally deliver your replica to you! (San Antonio area only)"\n');
} else {
  console.log('3. No standard shipping method found to update\n');
}

console.log('✅ Done! Shipping method updated.');
