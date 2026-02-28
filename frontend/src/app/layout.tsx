import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartButton from "@/components/CartButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "My Pet Replicas | Premium Custom Pet Figures — San Antonio, TX",
  description:
    "Museum-quality, hand-painted custom pet replicas starting at $150. Celebrate your pet or honor their memory with an heirloom keepsake. Handcrafted in San Antonio, TX.",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "My Pet Replicas",
    "image": "https://mypetreplicas.com/images/replicas/_DSC3783.jpg",
    "description": "Museum-quality, hand-painted custom pet replicas starting at $150. Heirloom keepsakes that capture your pet's unique personality. Handcrafted in San Antonio, TX.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Antonio",
      "addressRegion": "TX",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 29.4241,
      "longitude": -98.4936
    },
    "url": "https://mypetreplicas.com",
    "telephone": "+1-555-PET-REPLICA",
    "priceRange": "$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "reviewCount": "127"
    },
    "openingHours": "Mo-Fr 09:00-18:00"
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-[var(--color-dark-main)] text-[var(--color-neutral-100)] selection:bg-terra-500/30`}
      >
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            {/* ── Header ── */}
            <header className="fixed top-0 w-full z-50 bg-[var(--color-dark-main)]/80 backdrop-blur-lg">
              <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <span className="font-display font-bold text-2xl tracking-tight text-white">
                    MyPet<span className="text-terra-400">Replicas</span>
                  </span>
                </Link>



                <div className="flex items-center gap-4">
                  <CartButton />
                  <Link
                    href="/product/custom-pet-replica"
                    className="text-sm font-semibold px-6 py-3 bg-terra-600 hover:bg-terra-500 text-white rounded-full transition-all shadow-[0_0_24px_rgba(212,112,62,0.25)] hover:shadow-[0_0_32px_rgba(212,112,62,0.4)]"
                  >
                    Start Creating
                  </Link>
                </div>
              </div>
            </header>

            {/* ── Main ── */}
            <main className="flex-grow pt-20">{children}</main>

            {/* ── Footer ── */}
            <footer className="mt-32 py-16 bg-[var(--color-dark-card)]">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                  <div className="max-w-sm">
                    <span className="font-display font-bold text-xl text-white">
                      MyPet<span className="text-terra-400">Replicas</span>
                    </span>
                    <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
                      We make beautiful replicas of your pet. All of them are
                      hand-painted and are made with love.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                      Contact
                    </h4>
                    <ul className="space-y-3 text-sm text-neutral-400">
                      <li>
                        <a
                          href="mailto:mypetreplicas@gmail.com"
                          className="hover:text-white transition-colors"
                        >
                          mypetreplicas@gmail.com
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-600">
                  <p>
                    &copy; {new Date().getFullYear()} My Pet Replicas. All rights
                    reserved.
                  </p>
                  <p>Handcrafted in San Antonio, TX 🐾</p>
                </div>
              </div>
            </footer>
          </div>

          {/* Cart Drawer (rendered outside layout flow) */}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
