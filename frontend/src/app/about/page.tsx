import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About the Artist | My Pet Replicas — San Antonio, TX',
    description:
        'Meet the artist behind My Pet Replicas. Hand-painted custom pet figures crafted with love in San Antonio, Texas.',
};

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24">
            {/* Breadcrumb */}
            <div className="text-xs text-neutral-600 mb-12">
                <Link href="/" className="hover:text-neutral-400 transition-colors">
                    Home
                </Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-400">About</span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terra-400 mb-4">
                Our Story
            </p>

            <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-12">
                The Artist Behind
                <br />
                Every Replica
            </h1>

            {/* ── Story Section ── */}
            <div className="space-y-8 text-neutral-400 leading-relaxed text-base">
                <p>
                    It started with a simple question:{' '}
                    <span className="text-white font-medium">
                        &ldquo;What if I could hold onto this moment forever?&rdquo;
                    </span>
                </p>

                <p>
                    As a 3D printing artist and lifelong pet lover based in San Antonio, Texas,
                    I&apos;ve always been fascinated by the intersection of technology and
                    craft. When I first started 3D printing custom figures, I realized that
                    the most powerful reactions didn&apos;t come from the complexity of the
                    design — they came from the personal connection.
                </p>

                <p>
                    A parent seeing their child&apos;s favorite character come to life. A
                    gamer holding their own avatar in their hands. And then came the moment
                    that changed everything — a customer asked if I could recreate their
                    dog who had recently passed away.
                </p>

                <p className="text-white text-lg font-medium">
                    That single request became my mission.
                </p>

                <p>
                    Every pet replica I create is hand-printed and meticulously hand-painted.
                    I study every photo you send — the way the light catches their fur, the
                    unique markings that make them <em>them</em>, the expression that makes
                    you smile. The result isn&apos;t just a figurine. It&apos;s a piece of
                    your heart, made tangible.
                </p>
            </div>

            {/* ── Values ── */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    {
                        title: 'Handcrafted',
                        desc: 'Every single replica is hand-painted by a real artist — no mass production, no shortcuts.',
                    },
                    {
                        title: 'Personal',
                        desc: 'I work directly with you to capture every detail that makes your pet unique.',
                    },
                    {
                        title: 'Local',
                        desc: 'Proudly designed, printed, and painted in San Antonio, TX.',
                    },
                ].map((item) => (
                    <div key={item.title}>
                        <h3 className="font-display text-lg font-semibold text-white mb-2">
                            {item.title}
                        </h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── CTA ── */}
            <div className="mt-24 text-center">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                    Ready to immortalize your best friend?
                </h2>
                <p className="text-neutral-500 mb-8">
                    It takes less than 2 minutes to get started.
                </p>
                <Link
                    href="/product/custom-6-inch-pet-replica"
                    className="inline-block px-8 py-4 bg-terra-600 hover:bg-terra-500 text-white text-base font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)]"
                >
                    Create My Pet Replica →
                </Link>
            </div>
        </div>
    );
}
