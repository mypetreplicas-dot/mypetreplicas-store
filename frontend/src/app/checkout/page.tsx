'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart, vendureMutation } from '@/context/CartContext';

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51T2mwGPQzaJzUOsVyMoI6GkOVeHW5KFgZPvfWthais2rtA0Dah2LqNyiWPcuJGkmJA6Tsp10JaW2WLdhgJhXzDcc003EvjZjA3';
const stripePromise = loadStripe(STRIPE_PK);

interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    priceWithTax: number;
}

// ── Stripe Payment Form (inner component) ──
function StripePaymentForm({ onSuccess, total }: { onSuccess: () => void; total: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setPaymentError('');

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/confirmation`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setPaymentError(error.message || 'Payment failed');
            setIsProcessing(false);
        } else {
            // Payment succeeded without redirect
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Payment Details</h2>

            <div className="rounded-xl bg-neutral-800/30 p-5">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {paymentError && (
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm">
                    {paymentError}
                </div>
            )}

            <button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="w-full py-4 mt-4 bg-terra-600 hover:bg-terra-500 text-white text-base font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing Payment...
                    </span>
                ) : (
                    `Pay $${total}`
                )}
            </button>

            <p className="text-xs text-neutral-600 text-center">
                Test mode — use card 4242 4242 4242 4242, any future exp, any CVC
            </p>
        </form>
    );
}

// ── Main Checkout Page ──
export default function CheckoutPage() {
    const { order, refreshCart } = useCart();
    const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [completedOrder, setCompletedOrder] = useState<any>(null);
    const [error, setError] = useState('');

    // Fetch eligible shipping methods on mount
    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const result = await vendureMutation<{ eligibleShippingMethods: ShippingMethod[] }>(`
                    query { eligibleShippingMethods { id name price priceWithTax } }
                `);
                const methods = result.eligibleShippingMethods || [];
                setShippingMethods(methods);
                if (methods.length > 0 && !selectedShippingMethodId) {
                    setSelectedShippingMethodId(methods[0].id);
                }
            } catch (e) { /* no active order yet is fine */ }
        };
        if (order) fetchMethods();
    }, [order, selectedShippingMethodId]);

    // Shipping form
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        emailAddress: '',
        streetLine1: '',
        streetLine2: '',
        city: '',
        province: '',
        postalCode: '',
        countryCode: 'US',
        phoneNumber: '',
    });

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Set customer + shipping, then create Stripe PaymentIntent
    const handleShippingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // 1. Set customer for order
            const customerResult = await vendureMutation<Record<string, any>>(`
                mutation SetCustomerForOrder($input: CreateCustomerInput!) {
                    setCustomerForOrder(input: $input) {
                        ... on Order { id }
                        ... on ErrorResult { errorCode message }
                    }
                }
            `, {
                input: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    emailAddress: form.emailAddress,
                    phoneNumber: form.phoneNumber,
                }
            });

            if (customerResult.setCustomerForOrder?.errorCode) {
                setError(customerResult.setCustomerForOrder.message || 'Failed to set customer');
                setIsSubmitting(false);
                return;
            }

            // 2. Set shipping address
            await vendureMutation<Record<string, any>>(`
                mutation SetOrderShippingAddress($input: CreateAddressInput!) {
                    setOrderShippingAddress(input: $input) {
                        ... on Order { id }
                        ... on ErrorResult { errorCode message }
                    }
                }
            `, {
                input: {
                    streetLine1: form.streetLine1,
                    streetLine2: form.streetLine2 || undefined,
                    city: form.city,
                    province: form.province,
                    postalCode: form.postalCode,
                    countryCode: form.countryCode,
                    phoneNumber: form.phoneNumber,
                }
            });

            // 3. Set the chosen shipping method
            if (selectedShippingMethodId) {
                await vendureMutation(`
                    mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
                        setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
                            ... on Order { id }
                            ... on ErrorResult { errorCode message }
                        }
                    }
                `, { shippingMethodId: [selectedShippingMethodId] });
                await refreshCart();
            }

            // 4. Transition to ArrangingPayment
            const transitionResult = await vendureMutation<Record<string, any>>(`
                mutation TransitionOrderToState($state: String!) {
                    transitionOrderToState(state: $state) {
                        ... on Order { id state }
                        ... on OrderStateTransitionError { errorCode message transitionError }
                    }
                }
            `, { state: 'ArrangingPayment' });

            if (transitionResult.transitionOrderToState?.transitionError) {
                const msg = transitionResult.transitionOrderToState.message || '';
                // Suppress redundant state transitions (e.g., user hits 'Continue' twice)
                if (!msg.includes('from "ArrangingPayment" to "ArrangingPayment"')) {
                    setError(msg);
                    setIsSubmitting(false);
                    return;
                }
            }

            // 5. Create Stripe PaymentIntent
            const intentResult = await vendureMutation<Record<string, any>>(`
                mutation CreateStripePaymentIntent {
                    createStripePaymentIntent
                }
            `);

            const secret = intentResult.createStripePaymentIntent;
            if (!secret) {
                setError('Failed to initialize payment. Please try again.');
                setIsSubmitting(false);
                return;
            }

            setClientSecret(secret);
            await refreshCart();
            setStep('payment');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSuccess = async () => {
        // Save order snapshot before it's cleared
        setCompletedOrder(order);

        // The Stripe webhook will handle transitioning the order to
        // PaymentSettled, which triggers the confirmation email.
        setOrderPlaced(true);
        await refreshCart();
    };

    // If order placed successfully
    if (orderPlaced) {
        return (
            <main className="min-h-screen bg-[var(--color-dark-bg)] relative overflow-hidden">
                {/* Confetti particles */}
                <style>{`
                    @keyframes confetti-fall {
                        0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                    }
                    @keyframes check-scale {
                        0% { transform: scale(0); opacity: 0; }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes ring-expand {
                        0% { transform: scale(0.5); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes fade-up {
                        0% { transform: translateY(20px); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                    .confetti-particle {
                        position: absolute;
                        top: -10px;
                        width: 10px;
                        height: 10px;
                        border-radius: 2px;
                        animation: confetti-fall linear forwards;
                    }
                `}</style>
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            backgroundColor: ['#c45a2e', '#d4703e', '#e08a5c', '#ecab86', '#f4cdb5', '#fae8dc', '#a34726'][i % 7],
                            animationDuration: `${2 + Math.random() * 3}s`,
                            animationDelay: `${Math.random() * 1.5}s`,
                            width: `${6 + Math.random() * 10}px`,
                            height: `${6 + Math.random() * 10}px`,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        }}
                    />
                ))}

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
                    {/* Success Icon */}
                    <div className="text-center mb-10">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div
                                className="absolute inset-0 rounded-full border-4 border-terra-500/30"
                                style={{ animation: 'ring-expand 0.6s ease-out forwards' }}
                            />
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ animation: 'check-scale 0.5s ease-out 0.3s both' }}
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terra-500 to-terra-700 flex items-center justify-center shadow-[0_0_40px_rgba(212,112,62,0.3)]">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <h1
                            className="text-3xl sm:text-4xl font-display font-bold text-white mb-3"
                            style={{ animation: 'fade-up 0.5s ease-out 0.5s both' }}
                        >
                            Order Confirmed!
                        </h1>
                        {completedOrder && (
                            <p
                                className="text-neutral-500 text-sm"
                                style={{ animation: 'fade-up 0.5s ease-out 0.6s both' }}
                            >
                                Order #{completedOrder.code}
                            </p>
                        )}
                    </div>

                    {/* Email confirmation */}
                    {form.emailAddress && (
                        <div
                            className="rounded-xl bg-terra-600/10 border border-terra-600/20 p-4 flex items-start gap-3 mb-8"
                            style={{ animation: 'fade-up 0.5s ease-out 0.7s both' }}
                        >
                            <svg className="w-5 h-5 text-terra-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <div>
                                <p className="text-sm text-neutral-200">Confirmation sent to <span className="text-terra-400 font-medium">{form.emailAddress}</span></p>
                                <p className="text-xs text-neutral-500 mt-0.5">Check your inbox for order details and tracking updates.</p>
                            </div>
                        </div>
                    )}

                    {/* What happens next timeline */}
                    <div
                        className="rounded-2xl bg-[var(--color-dark-card)] p-6 sm:p-8 mb-8"
                        style={{ animation: 'fade-up 0.5s ease-out 0.8s both' }}
                    >
                        <h2 className="text-lg font-semibold text-white mb-6">What Happens Next</h2>
                        <div className="space-y-6">
                            {[
                                {
                                    icon: (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ),
                                    title: 'Order Confirmed',
                                    desc: 'Your order has been received and payment processed.',
                                    active: true,
                                },
                                {
                                    icon: (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                                        </svg>
                                    ),
                                    title: 'Crafting Begins',
                                    desc: 'Our artists begin hand-sculpting your custom pet replica.',
                                    active: false,
                                },
                                {
                                    icon: (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                        </svg>
                                    ),
                                    title: 'Shipped to You',
                                    desc: 'Carefully packaged and shipped with tracking to your door.',
                                    active: false,
                                },
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step.active ? 'bg-terra-600 text-white' : 'bg-neutral-800 text-neutral-500'}`}>
                                            {step.icon}
                                        </div>
                                        {i < 2 && <div className="w-px h-full bg-neutral-800 my-1" />}
                                    </div>
                                    <div className="pb-2">
                                        <p className={`text-sm font-medium ${step.active ? 'text-white' : 'text-neutral-400'}`}>{step.title}</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order details card */}
                    {completedOrder && (
                        <div
                            className="rounded-2xl bg-[var(--color-dark-card)] p-6 sm:p-8 mb-8"
                            style={{ animation: 'fade-up 0.5s ease-out 0.9s both' }}
                        >
                            <h2 className="text-lg font-semibold text-white mb-5">Order Details</h2>

                            {/* Items */}
                            <div className="space-y-3 mb-5">
                                {completedOrder.lines.map((line: any) => (
                                    <div key={line.id} className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={line.productVariant?.product?.featuredAsset?.preview || '/images/replicas/_DSC3783.jpg'}
                                                alt={line.productVariant?.product?.name || 'Product'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-200 font-medium line-clamp-1">{line.productVariant?.product?.name || 'Custom Pet Replica'}</p>
                                            <p className="text-xs text-neutral-500">{line.productVariant?.name} · Qty {line.quantity}</p>
                                        </div>
                                        <span className="text-sm text-neutral-300">${(((line as any).linePrice || line.linePriceWithTax) / 100).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-neutral-800/50 mb-4" />

                            {/* Shipping & Total */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Shipping to</p>
                                    <p className="text-sm text-neutral-300">{form.firstName} {form.lastName}</p>
                                    <p className="text-xs text-neutral-500">{form.city}, {form.province} {form.postalCode}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Paid</p>
                                    <p className="text-2xl font-display font-bold text-white">
                                        ${(completedOrder.totalWithTax / 100).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CTAs */}
                    <div
                        className="flex flex-col sm:flex-row gap-3 justify-center"
                        style={{ animation: 'fade-up 0.5s ease-out 1s both' }}
                    >
                        <Link
                            href="/"
                            className="px-8 py-3.5 bg-terra-600 hover:bg-terra-500 text-white font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)] text-center"
                        >
                            Back to Home
                        </Link>
                        <Link
                            href="/product/custom-pet-replica"
                            className="px-8 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-full transition-all border border-neutral-700/50 text-center"
                        >
                            Create Another Replica
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // Empty cart
    if (!order || order.lines.length === 0) {
        return (
            <main className="min-h-screen bg-[var(--color-dark-bg)] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-display font-bold text-white">Your cart is empty</h1>
                    <p className="text-neutral-500 text-sm">Add a custom pet replica to get started.</p>
                    <Link
                        href="/product/custom-pet-replica"
                        className="inline-block px-8 py-3 bg-terra-600 hover:bg-terra-500 text-white font-semibold rounded-full transition-all"
                    >
                        Create Your Replica →
                    </Link>
                </div>
            </main>
        );
    }

    const subtotal = ((order as any).subTotal / 100).toFixed(2);
    const shippingCost = ((order as any).shipping || 0) / 100;
    const taxTotal = ((order as any).taxSummary || []).reduce((sum: number, t: any) => sum + (t.taxTotal || 0), 0) / 100;
    const taxRate = ((order as any).taxSummary?.[0]?.taxRate || 0);
    const total = (order.totalWithTax / 100).toFixed(2);

    return (
        <main className="min-h-screen bg-[var(--color-dark-bg)]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                {/* Header */}
                <div className="flex items-center gap-3 mb-10">
                    <Link href="/" className="text-neutral-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Checkout</h1>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-3 mb-10">
                    <span className={`flex items-center gap-2 text-sm font-medium ${step === 'shipping' ? 'text-terra-400' : 'text-neutral-500'}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === 'shipping' ? 'bg-terra-600 text-white' : 'bg-neutral-700 text-neutral-400'}`}>1</span>
                        Shipping
                    </span>
                    <div className="w-8 h-px bg-neutral-700" />
                    <span className={`flex items-center gap-2 text-sm font-medium ${step === 'payment' ? 'text-terra-400' : 'text-neutral-600'}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === 'payment' ? 'bg-terra-600 text-white' : 'bg-neutral-800 text-neutral-600'}`}>2</span>
                        Payment
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    {/* Left: Form */}
                    <div className="lg:col-span-3">
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {step === 'shipping' && (
                            <form onSubmit={handleShippingSubmit} className="space-y-6">
                                <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">First Name</label>
                                        <input type="text" required value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">Last Name</label>
                                        <input type="text" required value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Email</label>
                                    <input type="email" required value={form.emailAddress} onChange={(e) => updateField('emailAddress', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40"
                                        placeholder="you@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Phone</label>
                                    <input type="tel" value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40"
                                        placeholder="(210) 555-1234" />
                                </div>

                                <div className="h-px bg-neutral-800/50 my-4" />

                                <h2 className="text-lg font-semibold text-white mb-4">Shipping Address</h2>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Street Address</label>
                                    <input type="text" required value={form.streetLine1} onChange={(e) => updateField('streetLine1', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40"
                                        placeholder="123 Main St" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 mb-1.5">Apartment, suite, etc. <span className="text-neutral-600">(optional)</span></label>
                                    <input type="text" value={form.streetLine2} onChange={(e) => updateField('streetLine2', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">City</label>
                                        <input type="text" required value={form.city} onChange={(e) => updateField('city', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40"
                                            placeholder="San Antonio" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">State</label>
                                        <input type="text" required value={form.province} onChange={(e) => updateField('province', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40"
                                            placeholder="TX" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">ZIP Code</label>
                                        <input type="text" required value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-terra-500/40"
                                            placeholder="78201" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 mb-1.5">Country</label>
                                        <select value={form.countryCode} onChange={(e) => updateField('countryCode', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 text-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-terra-500/40">
                                            <option value="US">United States</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Delivery Method */}
                                {shippingMethods.length > 0 && (
                                    <>
                                        <div className="h-px bg-neutral-800/50 my-4" />
                                        <h2 className="text-lg font-semibold text-white mb-4">Delivery Method</h2>
                                        <div className="space-y-3">
                                            {shippingMethods.map((method) => {
                                                const isSelected = selectedShippingMethodId === method.id;
                                                const isLocalDelivery = method.name.toLowerCase().includes('local') || method.name.toLowerCase().includes('delivery') || method.name.toLowerCase().includes('pickup');
                                                return (
                                                    <label
                                                        key={method.id}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected
                                                            ? 'border-terra-500/50 bg-terra-600/10'
                                                            : 'border-neutral-800/50 bg-neutral-800/20 hover:border-neutral-700/50'
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="shippingMethod"
                                                            value={method.id}
                                                            checked={isSelected}
                                                            onChange={() => setSelectedShippingMethodId(method.id)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-terra-500' : 'border-neutral-600'
                                                            }`}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-terra-500" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                {isLocalDelivery ? (
                                                                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                                                    </svg>
                                                                )}
                                                                <p className="text-sm text-neutral-200 font-medium">{isLocalDelivery ? 'Local Delivery' : method.name}</p>
                                                            </div>
                                                            {isLocalDelivery && (
                                                                <p className="text-xs text-terra-400 mt-1 ml-6">I will personally deliver your replicas to you! (San Antonio area)</p>
                                                            )}
                                                        </div>
                                                        <span className={`text-sm font-medium ${method.price === 0 ? 'text-terra-400' : 'text-neutral-300'}`}>
                                                            {method.price === 0 ? 'FREE' : `$${(method.price / 100).toFixed(2)}`}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 mt-4 bg-terra-600 hover:bg-terra-500 text-white text-base font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        'Continue to Payment →'
                                    )}
                                </button>
                            </form>
                        )}

                        {step === 'payment' && clientSecret && (
                            <Elements
                                stripe={stripePromise}
                                options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'night',
                                        variables: {
                                            colorPrimary: '#c45a2e',
                                            colorBackground: '#1a1a1a',
                                            colorText: '#e5e5e5',
                                            colorDanger: '#ef4444',
                                            fontFamily: 'system-ui, -apple-system, sans-serif',
                                            borderRadius: '12px',
                                            spacingUnit: '4px',
                                        },
                                        rules: {
                                            '.Input': {
                                                backgroundColor: 'rgba(38, 38, 38, 0.5)',
                                                border: '1px solid rgba(64, 64, 64, 0.5)',
                                                padding: '12px 16px',
                                            },
                                            '.Input:focus': {
                                                borderColor: 'rgba(185, 81, 51, 0.4)',
                                                boxShadow: '0 0 0 2px rgba(185, 81, 51, 0.2)',
                                            },
                                            '.Label': {
                                                color: '#737373',
                                                fontSize: '12px',
                                                marginBottom: '6px',
                                            },
                                            '.Tab': {
                                                backgroundColor: 'rgba(38, 38, 38, 0.5)',
                                                border: '1px solid rgba(64, 64, 64, 0.5)',
                                            },
                                            '.Tab--selected': {
                                                backgroundColor: '#c45a2e',
                                                borderColor: '#c45a2e',
                                            },
                                        },
                                    },
                                }}
                            >
                                <div className="space-y-6">
                                    {/* Shipping summary */}
                                    <div className="rounded-xl bg-neutral-800/30 p-5 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Ship to</p>
                                            <button onClick={() => setStep('shipping')} className="text-xs text-terra-400 hover:text-terra-300 transition-colors">
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-sm text-neutral-200">
                                            {form.firstName} {form.lastName}
                                        </p>
                                        <p className="text-sm text-neutral-400">
                                            {form.streetLine1}{form.streetLine2 ? `, ${form.streetLine2}` : ''}<br />
                                            {form.city}, {form.province} {form.postalCode}
                                        </p>
                                    </div>

                                    <StripePaymentForm onSuccess={handlePaymentSuccess} total={total} />
                                </div>
                            </Elements>
                        )}
                    </div>

                    {/* Right: Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl bg-[var(--color-dark-card)] p-6 sticky top-8">
                            <h2 className="text-lg font-semibold text-white mb-5">Order Summary</h2>
                            <div className="space-y-4">
                                {order.lines.map((line) => (
                                    <div key={line.id} className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={line.productVariant.product.featuredAsset?.preview || '/images/replicas/_DSC3783.jpg'}
                                                alt={line.productVariant.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium line-clamp-1">{line.productVariant.product.name}</p>
                                            <p className="text-xs text-neutral-500">{line.productVariant.name}</p>
                                            <p className="text-xs text-neutral-500">Qty: {line.quantity}</p>
                                        </div>
                                        <span className="text-sm text-neutral-300 shrink-0">
                                            ${(((line as any).linePrice || line.linePriceWithTax) / 100).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-neutral-800/50 my-5" />

                            <div className="space-y-2.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Subtotal</span>
                                    <span className="text-neutral-300">${subtotal}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Shipping</span>
                                    {shippingCost === 0 ? (
                                        <span className="text-terra-400 text-xs font-medium">FREE</span>
                                    ) : (
                                        <span className="text-neutral-300">${shippingCost.toFixed(2)}</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Tax</span>
                                    <span className="text-neutral-300">${taxTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="h-px bg-neutral-800/50 my-5" />

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-neutral-400">Total</span>
                                <span className="text-xl font-display font-bold text-white">${total}</span>
                            </div>

                            {/* Trust signals */}
                            <div className="mt-6 pt-5 border-t border-neutral-800/50 space-y-2.5">
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                    Powered by Stripe — secure 256-bit encryption
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <svg className="w-4 h-4 text-terra-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Handcrafted with care in San Antonio, TX
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
