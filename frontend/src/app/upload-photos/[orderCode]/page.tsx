import { Metadata } from 'next';
import { queryVendure } from '@/lib/vendure';
import UploadPhotosClient from './UploadPhotosClient';

interface PageProps {
  params: Promise<{ orderCode: string }>;
}

const GET_ORDER_QUERY = `
  query GetOrder($code: String!) {
    orderByCode(code: $code) {
      id
      code
      customer {
        firstName
        lastName
      }
      lines {
        id
        productVariant {
          name
          product {
            name
          }
        }
        customFields {
          specialInstructions
          petPhotos
        }
      }
    }
  }
`;

interface OrderResponse {
  orderByCode: {
    id: string;
    code: string;
    customer: {
      firstName: string;
      lastName: string;
    } | null;
    lines: Array<{
      id: string;
      productVariant: {
        name: string;
        product: {
          name: string;
        };
      };
      customFields: {
        specialInstructions: string | null;
        petPhotos: string | null;
      } | null;
    }>;
  } | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderCode } = await params;
  return {
    title: `Upload Photos - Order ${orderCode} | My Pet Replicas`,
    description: 'Upload photos for your custom pet replica order',
  };
}

export default async function UploadPhotosPage({ params }: PageProps) {
  const { orderCode } = await params;

  let order: OrderResponse['orderByCode'] = null;
  let error = '';

  try {
    const data = await queryVendure<OrderResponse>(GET_ORDER_QUERY, {
      code: orderCode,
    });
    order = data.orderByCode;

    if (!order) {
      error = 'Order not found';
    }
  } catch (e) {
    console.error('Failed to fetch order:', e);
    error = 'Failed to load order details';
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
          <p className="text-neutral-400 mb-6">
            We couldn't find an order with code <span className="font-mono text-terra-400">{orderCode}</span>.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-terra-600 hover:bg-terra-500 text-white rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  // Check if any line items are pending photos
  const hasPendingPhotos = order.lines.some(
    (line) =>
      line.customFields?.specialInstructions?.includes('[Photos pending]') ||
      !line.customFields?.petPhotos
  );

  if (!hasPendingPhotos) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-terra-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">All Photos Received</h1>
          <p className="text-neutral-400 mb-6">
            We already have all the photos we need for order <span className="font-mono text-terra-400">{orderCode}</span>. Thank you!
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-terra-600 hover:bg-terra-500 text-white rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <UploadPhotosClient
      orderCode={order.code}
      customerName={order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest'}
      orderLines={order.lines}
    />
  );
}
