import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'FAQ | My Pet Replicas — San Antonio, TX',
    description:
        'Frequently asked questions about custom pet replicas — turnaround times, photo requirements, materials, shipping, and more.',
};

const faqs = [
    {
        q: 'How does the ordering process work?',
        a: 'It\'s simple: choose a size, upload clear photos of your pet, add any special instructions, and place your order. Our artist will review your photos and begin crafting your one-of-a-kind replica.',
    },
    {
        q: 'What kind of photos should I send?',
        a: 'The more angles, the better! We recommend at least 3-4 clear, well-lit photos showing your pet from the front, sides, and any unique markings. Close-ups of their face are especially helpful. Don\'t worry if the photos aren\'t professional — phone photos work great as long as the details are visible.',
    },
    {
        q: 'What if my photos aren\'t great quality?',
        a: 'We work with what you have! If we need additional angles or better lighting on a specific area, we\'ll reach out to you before starting. We never begin a replica until we\'re confident we can capture your pet accurately.',
    },
    {
        q: 'How long does it take to receive my replica?',
        a: 'Each replica is custom-made, so please allow 2-3 weeks for creation and painting. Shipping within the US typically takes an additional 3-5 business days. We\'ll send you updates along the way!',
    },
    {
        q: 'What materials are used?',
        a: 'Replicas are 3D printed using high-quality PLA, a durable and eco-friendly material. Each piece is meticulously hand-painted with professional-grade acrylics and sealed with a protective clear coat for lasting quality.',
    },
    {
        q: 'What sizes are available?',
        a: 'We currently offer three sizes: 3-inch (perfect for desks and shelves), 6-inch (our most popular — great detail and presence), and 9-inch premium (maximum detail and a stunning display piece).',
    },
    {
        q: 'Can I request a specific pose or accessories?',
        a: 'Absolutely! Use the "Special Instructions" field when ordering to describe the pose, accessories, or any other details you\'d like. We\'ll do our best to accommodate your vision.',
    },
    {
        q: 'Do you offer memorial replicas for pets who have passed?',
        a: 'Yes, and it\'s one of the most meaningful things we do. We treat every memorial order with extra care. You can also add our Memorial Halo accessory for a beautiful tribute.',
    },
    {
        q: 'What is your refund/revision policy?',
        a: 'Because each piece is custom-made, we can\'t offer standard refunds. However, we want you to be 100% satisfied. If something doesn\'t look right, we\'ll work with you to make adjustments before shipping.',
    },
    {
        q: 'Do you ship outside of San Antonio?',
        a: 'Yes! While we\'re proudly based in San Antonio, TX, we ship to all 50 US states. International shipping is available on a case-by-case basis — just reach out to us.',
    },
];

export default function FaqPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            {/* Breadcrumb */}
            <div className="text-xs text-neutral-600 mb-12">
                <Link href="/" className="hover:text-neutral-400 transition-colors">
                    Home
                </Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-400">FAQ</span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terra-400 mb-4">
                Common Questions
            </p>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                Frequently Asked Questions
            </h1>

            <p className="text-neutral-500 leading-relaxed mb-16 max-w-lg">
                Everything you need to know about ordering your custom pet replica.
                Can&apos;t find what you&apos;re looking for?{' '}
                <a
                    href="mailto:hello@mypetreplicas.com"
                    className="text-terra-400 hover:text-terra-300 transition-colors"
                >
                    Reach out to us
                </a>
                .
            </p>

            {/* ── FAQ List ── */}
            <div className="space-y-0">
                {faqs.map((faq, i) => (
                    <div key={i} className="py-8 first:pt-0">
                        <h3 className="font-display text-lg font-semibold text-white mb-3">
                            {faq.q}
                        </h3>
                        <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                            {faq.a}
                        </p>
                        {i < faqs.length - 1 && (
                            <div className="mt-8 h-px bg-neutral-800/50" />
                        )}
                    </div>
                ))}
            </div>

            {/* ── CTA ── */}
            <div className="mt-24 text-center">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                    Still have questions?
                </h2>
                <p className="text-neutral-500 mb-8">
                    We&apos;re happy to help. Drop us a line anytime.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <a
                        href="mailto:hello@mypetreplicas.com"
                        className="px-8 py-4 bg-terra-600 hover:bg-terra-500 text-white text-base font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)]"
                    >
                        Contact Us
                    </a>
                    <Link
                        href="/product/custom-6-inch-pet-replica"
                        className="px-8 py-4 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                        Start Creating →
                    </Link>
                </div>
            </div>
        </div>
    );
}
