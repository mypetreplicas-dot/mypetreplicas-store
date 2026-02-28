'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/vendure';
import { getEnabledVariants } from '@/lib/vendure';

export default function ProductCard({ product }: { product: Product }) {
    // Filter to only enabled variants
    const enabledVariants = getEnabledVariants(product.variants);

    // Show price range: "From $X"
    const prices = enabledVariants.map((v) => v.price).filter((p) => typeof p === 'number' && !isNaN(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const priceDisplay =
        prices.length === 0
            ? 'Price TBD'
            : minPrice === maxPrice
                ? `$${(minPrice / 100).toFixed(2)}`
                : `From $${(minPrice / 100).toFixed(2)}`;

    // Use the real replica photo as a fallback
    const imageUrl =
        product.featuredAsset?.preview || '/images/replicas/_DSC3783.jpg';

    return (
        <Link href={`/product/${product.slug}`} className="group block">
            <motion.div
                className="rounded-2xl overflow-hidden bg-neutral-900 transition-colors duration-300"
                whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(185, 81, 51, 0.12)' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
            >
                <div className="relative aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Option count badge */}
                    {enabledVariants.length > 1 && (
                        <span className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-xs text-neutral-300 px-3 py-1 rounded-full">
                            {enabledVariants.length} options
                        </span>
                    )}
                </div>

                <div className="p-6 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="font-display font-semibold text-lg text-white group-hover:text-terra-300 transition-colors">
                            {product.name}
                        </h3>
                        <span className="font-medium text-lg text-neutral-300 shrink-0">
                            {priceDisplay}
                        </span>
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                        {product.description ||
                            'Beautifully hand-crafted replica of your pet, painted to perfection.'}
                    </p>

                    <div className="pt-4 flex items-center gap-2 text-sm font-medium text-terra-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Customize &amp; Order <span aria-hidden="true">&rarr;</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
