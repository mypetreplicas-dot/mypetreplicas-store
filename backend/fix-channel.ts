import 'dotenv/config';

const ADMIN_API = process.env.VENDURE_API_URL || `http://localhost:${process.env.PORT || 3000}/admin-api`;

async function adminQuery(query: string, variables: any = {}, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(ADMIN_API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) {
        console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
        throw new Error('GraphQL error');
    }
    return json.data;
}

async function login(): Promise<string> {
    const res = await fetch(ADMIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `mutation { login(username: "${process.env.SUPERADMIN_USERNAME || 'superadmin'}", password: "${process.env.SUPERADMIN_PASSWORD || 'superadmin'}") { ... on CurrentUser { id } } }`,
        }),
    });
    const authToken = res.headers.get('vendure-auth-token') || '';
    return authToken;
}

async function run() {
    const token = await login();
    console.log("Logged in");
    
    // Create Zone
    let zoneId = "1";
    try {
        const zoneData = await adminQuery(`mutation { createZone(input: { name: "Americas" }) { id } }`, {}, token);
        zoneId = zoneData.createZone.id;
        console.log("Zone created, ID", zoneId);
    } catch(e) {
        console.log("Zone might exist, proceeding with ID 1");
    }
    
    // Update Channel
    const updateChannel = await adminQuery(`mutation { updateChannel(input: { id: "1", defaultTaxZoneId: "${zoneId}" }) { __typename } }`, {}, token);
    console.log("Updated channel 1 with defaultTaxZoneId =", zoneId);
    
    // Create Tax Category
    let categoryId = "1";
    try {
        const taxCategoryData = await adminQuery(`mutation { createTaxCategory(input: { name: "Standard Tax" }) { id } }`, {}, token);
        categoryId = taxCategoryData.createTaxCategory.id;
        console.log("Tax Category created, ID", categoryId);
    } catch(e) {
         console.log("Tax category might exist, proceeding with ID 1");
    }
    
    // Create Tax Rate
    try {
        const taxRateData = await adminQuery(`mutation { createTaxRate(input: { name: "Standard Tax", categoryId: "${categoryId}", zoneId: "${zoneId}", value: 0, enabled: true }) { id } }`, {}, token);
        console.log("Tax Rate created", taxRateData);
    } catch(e) {
        console.log("Tax rate might exist or error", e);
    }
}
run().catch(console.error);
