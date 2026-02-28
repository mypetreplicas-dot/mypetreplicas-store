import Link from 'next/link';
import { HomeHero } from '@/components/HomeAnimations';

export default function HomePage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/replicas/_DSC3783.jpg"
            alt="A beautifully hand-painted custom pet replica"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-dark-main)] via-[var(--color-dark-main)]/60 to-[var(--color-dark-main)]" />
        </div>

        <HomeHero>
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="max-w-2xl space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terra-400">
                Handcrafted in San Antonio, TX
              </p>

              <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1]">
                Immortalize Your{' '}
                <span className="text-gradient-terra">Best Friend</span>
              </h1>

              <p className="text-lg text-neutral-400 leading-relaxed max-w-lg">
                Your pet isn&apos;t just an animal—they&apos;re family. A museum-quality,
                hand-painted keepsake that captures their unique spirit and personality forever.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/product/custom-pet-replica"
                  className="px-8 py-4 bg-terra-600 hover:bg-terra-500 text-white text-base font-semibold rounded-full transition-all shadow-[0_0_32px_rgba(212,112,62,0.25)] hover:shadow-[0_0_48px_rgba(212,112,62,0.4)]"
                >
                  Create My Pet Replica →
                </Link>
              </div>
            </div>
          </div>
        </HomeHero>
      </section>
    </>
  );
}
