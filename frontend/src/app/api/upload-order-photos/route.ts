import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API = process.env.NEXT_PUBLIC_VENDURE_API_URL?.replace('/shop-api', '/admin-api') || 'http://localhost:3021/admin-api';

interface AssetResponse {
  id: string;
  preview: string;
  source: string;
}

interface CreateAssetsResponse {
  createAssets: AssetResponse[];
}

interface OrderResponse {
  orderByCode: {
    id: string;
    code: string;
    lines: Array<{
      id: string;
      customFields: {
        specialInstructions: string | null;
        petPhotos: string | null;
      } | null;
    }>;
  } | null;
}

interface UpdateOrderLineResponse {
  setOrderLineCustomFields: {
    id: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderCode = formData.get('orderCode') as string;
    const files = formData.getAll('files') as File[];

    if (!orderCode || files.length === 0) {
      return NextResponse.json({ error: 'Missing order code or files' }, { status: 400 });
    }

    // Step 1: Login to admin API
    const loginResponse = await fetch(ADMIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { login(username: "${process.env.VENDURE_SUPERADMIN_USERNAME}", password: "${process.env.VENDURE_SUPERADMIN_PASSWORD}") { ... on CurrentUser { id identifier } } }`,
      }),
    });

    const loginCookie = loginResponse.headers.get('set-cookie')?.split(';')[0] || '';
    if (!loginCookie) {
      throw new Error('Failed to authenticate');
    }

    // Step 2: Get the order
    const orderResponse = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': loginCookie,
      },
      body: JSON.stringify({
        query: `
          query GetOrder($code: String!) {
            orderByCode(code: $code) {
              id
              code
              lines {
                id
                customFields {
                  specialInstructions
                  petPhotos
                }
              }
            }
          }
        `,
        variables: { code: orderCode },
      }),
    });

    const orderData = await orderResponse.json();
    const order = (orderData.data as OrderResponse).orderByCode;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Step 3: Upload assets to Vendure
    const uploadFormData = new FormData();
    uploadFormData.append(
      'operations',
      JSON.stringify({
        query: `
          mutation CreateAssets($input: [CreateAssetInput!]!) {
            createAssets(input: $input) {
              id
              preview
              source
            }
          }
        `,
        variables: {
          input: files.map(() => ({ file: null })),
        },
      })
    );

    const map: Record<string, string[]> = {};
    files.forEach((_, index) => {
      map[index.toString()] = [`variables.input.${index}.file`];
    });
    uploadFormData.append('map', JSON.stringify(map));

    files.forEach((file, index) => {
      uploadFormData.append(index.toString(), file);
    });

    const assetsResponse = await fetch(ADMIN_API, {
      method: 'POST',
      headers: {
        'cookie': loginCookie,
      },
      body: uploadFormData,
    });

    const assetsData = await assetsResponse.json();
    const assets = (assetsData.data as CreateAssetsResponse).createAssets;

    if (!assets || assets.length === 0) {
      throw new Error('Failed to upload assets');
    }

    const assetIds = assets.map((a) => a.id).join(',');

    // Step 4: Update the first line item that's pending photos
    const pendingLine = order.lines.find(
      (line) =>
        line.customFields?.specialInstructions?.includes('[Photos pending]') ||
        !line.customFields?.petPhotos
    );

    if (pendingLine) {
      const existingPhotos = pendingLine.customFields?.petPhotos || '';
      const updatedPhotos = existingPhotos ? `${existingPhotos},${assetIds}` : assetIds;

      // Remove [Photos pending] from special instructions
      const specialInstructions = pendingLine.customFields?.specialInstructions || '';
      const cleanedInstructions = specialInstructions.replace('[Photos pending]', '').trim();

      await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cookie': loginCookie,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateOrderLine($orderLineId: ID!, $customFields: OrderLineCustomFieldsInput!) {
              setOrderLineCustomFields(orderLineId: $orderLineId, customFields: $customFields) {
                id
              }
            }
          `,
          variables: {
            orderLineId: pendingLine.id,
            customFields: {
              petPhotos: updatedPhotos,
              specialInstructions: cleanedInstructions || null,
            },
          },
        }),
      });
    }

    return NextResponse.json({ success: true, assetCount: assets.length });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
