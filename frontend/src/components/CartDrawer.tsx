'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
    const { order, isOpen, isLoading, closeCart, updateQuantity, removeFromCart } = useCart();

    const rawSubTotal = order ? (order as any).subTotal : 0;
    const total = (typeof rawSubTotal === 'number' && !isNaN(rawSubTotal)) ? (rawSubTotal / 100).toFixed(2) : '0.00';
    const lines = order?.lines || [];

    return (
        <div className={`${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} {...(!isOpen ? { inert: true } : {})}>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${isOpen ? 'z-50 opacity-100' : '-z-10 opacity-0 invisible'}`}
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-dark-card)] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'z-50 translate-x-0' : '-z-10 translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5">
                    <h2 className="font-display text-lg font-bold text-white">
                        Your Cart
                        {order && order.totalQuantity > 0 && (
                            <span className="ml-2 text-sm font-normal text-neutral-500">
                                ({order.totalQuantity} {order.totalQuantity === 1 ? 'item' : 'items'})
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={closeCart}
                        className="p-2 text-neutral-500 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="h-px bg-neutral-800/50" />

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {lines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </div>
                            <p className="text-neutral-500 text-sm mb-6">Your cart is empty</p>
                            <button
                                onClick={closeCart}
                                className="text-sm font-medium text-terra-400 hover:text-terra-300 transition-colors"
                            >
                                Continue Shopping →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {lines.map((line) => (
                                <div key={line.id} className="flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={
                                                line.productVariant.product.featuredAsset?.preview ||
                                                '/images/replicas/_DSC3783.jpg'
                                            }
                                            alt={line.productVariant.product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/product/${line.productVariant.product.slug}`}
                                            className="text-sm font-medium text-white hover:text-terra-300 transition-colors line-clamp-1"
                                            onClick={closeCart}
                                        >
                                            {line.productVariant.product.name}
                                        </Link>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            {line.productVariant.name}
                                        </p>

                                        {/* Price with multi-pet discount indicator */}
                                        {(() => {
                                            const instructions = ((line as any).customFields?.specialInstructions || '');
                                            const discountMatch = instructions.match(/\[Multi-pet (\d+)% off\]/);
                                            return discountMatch ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm font-medium text-terra-400">
                                                        ${(((line as any).linePrice || 0) / 100).toFixed(2)}
                                                    </p>
                                                    <span className="text-xs font-semibold text-terra-400 bg-terra-500/10 px-2 py-0.5 rounded-full">
                                                        {discountMatch[1]}% OFF
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-neutral-300 mt-1">
                                                    ${(((line as any).linePrice || 0) / 100).toFixed(2)}
                                                </p>
                                            );
                                        })()}

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => updateQuantity(line.id, line.quantity - 1)}
                                                disabled={isLoading || line.quantity <= 1}
                                                className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center text-sm transition-colors disabled:opacity-40"
                                            >
                                                −
                                            </button>
                                            <span className="text-sm text-neutral-300 w-4 text-center">
                                                {line.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(line.id, line.quantity + 1)}
                                                disabled={isLoading}
                                                className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center text-sm transition-colors disabled:opacity-40"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(line.id)}
                                                disabled={isLoading}
                                                className="ml-auto text-xs text-neutral-600 hover:text-red-400 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {lines.length > 0 && (
                    <div className="px-6 py-6 bg-[var(--color-dark-elevated)]">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm text-neutral-500">Subtotal</span>
                            <span className="text-lg font-display font-bold text-white">${total}</span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="block w-full py-4 text-center bg-terra-600 hover:bg-terra-500 text-white text-base font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)]"
                        >
                            Proceed to Checkout
                        </Link>
                        <button
                            onClick={closeCart}
                            className="block w-full mt-3 text-center text-sm text-neutral-500 hover:text-white transition-colors py-2"
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
