import { notFound } from 'next/navigation';
import { queryVendure, GET_PRODUCT_BY_SLUG_QUERY, GetProductBySlugResponse, getEnabledVariants } from '@/lib/vendure';
import ProductConfigurator from '@/components/ProductConfigurator';
import { ProductGallery, ProductInfo, ProductFadeUp } from '@/components/ProductPageClient';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const data = await queryVendure<GetProductBySlugResponse>(GET_PRODUCT_BY_SLUG_QUERY, { slug });

    if (!data.product) {
        return { title: 'Product Not Found' };
    }

    return {
        title: `${data.product.name} | My Pet Replicas — San Antonio, TX`,
        description: data.product.description?.replace(/<[^>]*>/g, '').trim().slice(0, 160) || 'Custom hand-painted pet replica.',
    };
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    const data = await queryVendure<GetProductBySlugResponse>(GET_PRODUCT_BY_SLUG_QUERY, { slug });

    if (!data.product) {
        notFound();
    }

    const product = data.product;

    // Filter to only enabled variants
    const enabledVariants = getEnabledVariants(product.variants);

    // Strip HTML tags from description
    const cleanDescription = product.description
        ? product.description.replace(/<[^>]*>/g, '').trim()
        : '';

    // Build gallery from product assets + fallback showcase images
    const showcaseImages = [
        '/images/replicas/_DSC3783.jpg',
        '/images/replicas/IMG_20200621_132113~3.jpg',
        '/images/replicas/_DSC3851.jpg',
        '/images/replicas/_DSC3852.jpg',
    ];

    const galleryImages = product.assets && product.assets.length > 0
        ? product.assets.map((a: { preview: string }) => a.preview)
        : showcaseImages;

    // Get price range from enabled variants only
    const prices = enabledVariants.map((v: any) => v.price).filter((p: number) => typeof p === 'number') || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) / 100 : 150.00;
    const maxPrice = prices.length > 0 ? Math.max(...prices) / 100 : 215.00;

    // Product schema markup
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": cleanDescription,
        "image": galleryImages,
        "brand": {
            "@type": "Brand",
            "name": "My Pet Replicas"
        },
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "USD",
            "lowPrice": minPrice.toFixed(2),
            "highPrice": maxPrice.toFixed(2),
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "My Pet Replicas"
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "reviewCount": "127"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    {/* ── Left: Image Gallery ── */}
                    <ProductGallery
                        images={galleryImages}
                        productName={product.name}
                    />

                    {/* ── Right: Product Info + Configurator ── */}
                    <ProductInfo>
                        {/* Breadcrumb */}
                        <div className="text-xs text-neutral-600">
                            <a href="/" className="hover:text-neutral-400 transition-colors">Home</a>
                            <span className="mx-2">/</span>
                            <span className="text-neutral-400">{product.name}</span>
                        </div>

                        {/* Name */}
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                            {product.name}
                        </h1>

                        {/* Description */}
                        <p className="text-neutral-400 leading-relaxed text-base max-w-lg">
                            {cleanDescription}
                        </p>

                        {/* Divider */}
                        <div className="h-px bg-neutral-800/60" />

                        {/* Configurator */}
                        <ProductConfigurator product={{ ...product, variants: enabledVariants }} />
                    </ProductInfo>
                </div>

                {/* ── Value Proposition ── */}
                <section className="mt-24 max-w-3xl mx-auto">
                    <ProductFadeUp>
                        <div className="rounded-2xl bg-gradient-to-br from-terra-900/20 to-terra-950/20 border border-terra-700/20 p-8 md:p-12 text-center">
                            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                                More Than a Figurine—An Heirloom
                            </h2>
                            <p className="text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                                They&apos;re not just a pet. They&apos;re your constant companion, your best friend, your family.
                                This isn&apos;t a mass-produced toy—it&apos;s a hand-painted work of art that immortalizes
                                the unique spirit and personality of the one who loves you unconditionally.
                            </p>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                <div>
                                    <div className="w-10 h-10 rounded-full bg-terra-600/20 flex items-center justify-center mb-3">
                                        <svg className="w-5 h-5 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">Museum-Quality Artistry</h3>
                                    <p className="text-xs text-neutral-500">Hand-painted by a skilled artist with obsessive attention to detail</p>
                                </div>
                                <div>
                                    <div className="w-10 h-10 rounded-full bg-terra-600/20 flex items-center justify-center mb-3">
                                        <svg className="w-5 h-5 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">Proven Excellence</h3>
                                    <p className="text-xs text-neutral-500">5-star rated with over 100 happy customers on Etsy</p>
                                </div>
                                <div>
                                    <div className="w-10 h-10 rounded-full bg-terra-600/20 flex items-center justify-center mb-3">
                                        <svg className="w-5 h-5 text-terra-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">San Antonio Local</h3>
                                    <p className="text-xs text-neutral-500">Handcrafted right here in San Antonio with personal delivery available</p>
                                </div>
                            </div>
                        </div>
                    </ProductFadeUp>
                </section>

                {/* ── FAQ / Risk Reversal ── */}
                <section className="mt-24 max-w-3xl mx-auto">
                    <ProductFadeUp>
                        <h2 className="font-display text-2xl font-bold text-white text-center mb-12">
                            Common Questions
                        </h2>
                    </ProductFadeUp>
                    <div className="space-y-6">
                        {[
                            {
                                q: 'What if my photos aren\'t perfect?',
                                a: 'No worries! We\'ll work with you to get the details right. As long as we can see your pet clearly, we can create a beautiful replica. We may ask for additional photos if needed.',
                            },
                            {
                                q: 'How long does it take?',
                                a: '2-3 weeks for perfection. Each replica is hand-painted to order, and we never rush the process. You\'ll receive updates along the way.',
                            },
                            {
                                q: 'Can you capture specific markings or colors?',
                                a: 'Absolutely! That\'s our specialty. Use the special instructions field to highlight any unique features—spots, stripes, eye color, or expressions you want emphasized.',
                            },
                            {
                                q: 'Is this a good memorial gift?',
                                a: 'Yes. Many of our customers order replicas to honor pets who have passed. It\'s a beautiful, lasting way to keep their memory close.',
                            },
                        ].map((faq, i) => (
                            <ProductFadeUp key={i} delay={i * 0.1}>
                                <div className="rounded-xl bg-[var(--color-dark-card)] p-6">
                                    <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">{faq.a}</p>
                                </div>
                            </ProductFadeUp>
                        ))}
                    </div>
                </section>

                {/* ── Below: How it works ── */}
                <section className="mt-32">
                    <ProductFadeUp>
                        <h2 className="font-display text-2xl font-bold text-white text-center mb-16">
                            How It Works
                        </h2>
                    </ProductFadeUp>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                step: '01',
                                title: 'Upload Your Photos',
                                description: 'Send us clear photos of your pet from multiple angles. The more detail, the better the replica.',
                            },
                            {
                                step: '02',
                                title: 'We Handcraft Your Replica',
                                description: 'Our artist creates and hand-paints a unique figure capturing your pet\'s personality and markings.',
                            },
                            {
                                step: '03',
                                title: 'Delivered To Your Door',
                                description: 'Your one-of-a-kind replica is carefully packaged and shipped directly to you.',
                            },
                        ].map((item, i) => (
                            <ProductFadeUp key={item.step} delay={i * 0.15}>
                                <span className="text-xs font-semibold text-terra-500 tracking-widest">{item.step}</span>
                                <h3 className="mt-3 font-display text-lg font-semibold text-white">{item.title}</h3>
                                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{item.description}</p>
                            </ProductFadeUp>
                        ))}
                    </div>
                </section>


            </div>
        </>
    );
}
