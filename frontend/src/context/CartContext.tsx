'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ── Types ──
interface OrderLineCustomFields {
  specialInstructions?: string | null;
  petPhotos?: string[] | null;
}

interface OrderLine {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  customFields?: OrderLineCustomFields;
  productVariant: {
    id: string;
    name: string;
    price: number;
    product: {
      name: string;
      slug: string;
      featuredAsset?: { preview: string } | null;
    };
  };
}

interface ActiveOrder {
  id: string;
  code: string;
  totalWithTax: number;
  totalQuantity: number;
  lines: OrderLine[];
}

interface CartContextType {
  order: ActiveOrder | null;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (
    variantId: string,
    quantity?: number,
    customFields?: { specialInstructions?: string; petPhotos?: string[] },
  ) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeFromCart: (lineId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || 'http://localhost:3000/shop-api';

// Vendure uses a session token stored in a cookie or auth header
let vendureToken: string | null = null;

export function getVendureToken(): string | null {
  return vendureToken;
}

export async function vendureMutation<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (vendureToken) {
    headers['Authorization'] = `Bearer ${vendureToken}`;
  }

  let res;
  try {
    res = await fetch(VENDURE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    console.warn('Fetch failed (Vendure API unreachable): ' + (err instanceof Error ? err.message : String(err)));
    // Return a mock response object that safely passes through the rest of the function
    // but triggers the "json.errors" handler below so it doesn't crash the React context.
    return {
      headers: { get: () => null },
      json: async () => ({
        errors: [{ message: 'Could not connect to the store API. Please check your connection.' }]
      })
    } as any as T;
  }

  // Capture the session token from Vendure
  const token = res.headers.get('vendure-auth-token');
  if (token) {
    vendureToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendure-token', token);
    }
  }

  const json = await res.json();
  if (json.errors) {
    console.error('Vendure cart error:', json.errors);
    throw new Error(json.errors[0]?.message || 'Cart operation failed');
  }
  return json.data as T;
}

// ── Order fragment ──
const ORDER_FRAGMENT = `
    id
    code
    state
    subTotal
    subTotalWithTax
    total
    totalWithTax
    totalQuantity
    shipping
    shippingWithTax
    taxSummary {
        description
        taxRate
        taxTotal
    }
    lines {
        id
        quantity
        linePrice
        linePriceWithTax
        customFields {
            specialInstructions
            petPhotos
        }
        productVariant {
            id
            name
            price
            product {
                name
                slug
                featuredAsset { preview }
            }
        }
    }
`;

// ── Queries & Mutations ──
const ACTIVE_ORDER_QUERY = `
  query ActiveOrder {
    activeOrder {
      ${ORDER_FRAGMENT}
    }
  }
`;

const ADD_TO_ORDER_MUTATION = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!, $customFields: OrderLineCustomFieldsInput) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity, customFields: $customFields) {
      ... on Order {
        ${ORDER_FRAGMENT}
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const ADJUST_LINE_MUTATION = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        ${ORDER_FRAGMENT}
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const REMOVE_LINE_MUTATION = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        ${ORDER_FRAGMENT}
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

function extractOrder(data: Record<string, unknown>): { order: ActiveOrder | null; errorCode?: string } {
  const result = Object.values(data)[0] as Record<string, unknown> | null;
  if (!result) return { order: null };
  if ('errorCode' in result) {
    const code = (result.errorCode as string) || 'UNKNOWN';
    const msg = (result.message as string) || '';
    console.error(`Cart error [${code}]: ${msg}`, result);
    return { order: null, errorCode: code };
  }
  if ('id' in result) return { order: result as unknown as ActiveOrder };
  return { order: null };
}

// ── Provider ──
export function CartProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Restore token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vendure-token');
      if (stored) vendureToken = stored;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const data = await vendureMutation<{ activeOrder: ActiveOrder | null }>(ACTIVE_ORDER_QUERY);
      setOrder(data.activeOrder);
    } catch (e) {
      console.error('Failed to refresh cart:', e);
    }
  }, []);

  // Load cart on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // If the order is stuck in ArrangingPayment (e.g. user went to checkout then came back),
  // transition it back to AddingItems so cart modifications are allowed again.
  const ensureAddingItemsState = useCallback(async () => {
    try {
      await vendureMutation(`
        mutation { transitionOrderToState(state: "AddingItems") {
          ... on Order { id state }
          ... on OrderStateTransitionError { errorCode message }
        } }
      `);
    } catch (e) {
      // ignore — order may already be in AddingItems
    }
  }, []);

  const addToCart = useCallback(
    async (
      variantId: string,
      quantity = 1,
      customFields?: { specialInstructions?: string; petPhotos?: string[] },
    ) => {
      setIsLoading(true);
      const variables = {
        productVariantId: variantId,
        quantity,
        customFields: customFields || undefined,
      };
      try {
        let data = await vendureMutation<Record<string, unknown>>(ADD_TO_ORDER_MUTATION, variables);
        let result = extractOrder(data);

        // Auto-recovery: if order is stuck in ArrangingPayment, transition back and retry
        if (!result.order && result.errorCode === 'ORDER_MODIFICATION_ERROR') {
          console.warn('Order in wrong state, transitioning back to AddingItems...');
          await ensureAddingItemsState();
          data = await vendureMutation<Record<string, unknown>>(ADD_TO_ORDER_MUTATION, variables);
          result = extractOrder(data);
        }

        // If still failing, clear stale token and retry with fresh session
        if (!result.order && result.errorCode) {
          console.warn('Retrying add-to-cart with fresh session...');
          vendureToken = null;
          if (typeof window !== 'undefined') localStorage.removeItem('vendure-token');
          data = await vendureMutation<Record<string, unknown>>(ADD_TO_ORDER_MUTATION, variables);
          result = extractOrder(data);
        }

        if (result.order) {
          setOrder(result.order);
          setIsOpen(true); // Open drawer on add
        }
      } catch (e) {
        console.error('Failed to add to cart:', e);
      } finally {
        setIsLoading(false);
      }
    },
    [ensureAddingItemsState],
  );

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    setIsLoading(true);
    try {
      let data = await vendureMutation<Record<string, unknown>>(ADJUST_LINE_MUTATION, {
        orderLineId: lineId,
        quantity,
      });
      let result = extractOrder(data);
      // If order is in wrong state, transition back and retry
      if (result.errorCode === 'ORDER_MODIFICATION_ERROR') {
        await ensureAddingItemsState();
        data = await vendureMutation<Record<string, unknown>>(ADJUST_LINE_MUTATION, { orderLineId: lineId, quantity });
        result = extractOrder(data);
      }
      if (result.order) setOrder(result.order);
    } catch (e) {
      console.error('Failed to update quantity:', e);
    } finally {
      setIsLoading(false);
    }
  }, [ensureAddingItemsState]);

  const removeFromCart = useCallback(async (lineId: string) => {
    setIsLoading(true);
    try {
      let data = await vendureMutation<Record<string, unknown>>(REMOVE_LINE_MUTATION, {
        orderLineId: lineId,
      });
      let result = extractOrder(data);
      // If order is in wrong state, transition back and retry
      if (result.errorCode === 'ORDER_MODIFICATION_ERROR') {
        await ensureAddingItemsState();
        data = await vendureMutation<Record<string, unknown>>(REMOVE_LINE_MUTATION, { orderLineId: lineId });
        result = extractOrder(data);
      }
      if (result.order) setOrder(result.order);
    } catch (e) {
      console.error('Failed to remove from cart:', e);
    } finally {
      setIsLoading(false);
    }
  }, [ensureAddingItemsState]);

  return (
    <CartContext.Provider
      value={{
        order,
        isOpen,
        isLoading,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
