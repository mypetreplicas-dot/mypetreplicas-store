# My Pet Replicas - Development Roadmap & Tasks

## Phase 1: Environment & Foundation
- [x] Scaffold Backend (Vendure) & Frontend (Next.js)
- [x] Configure Database Connection (SQLite/PostgreSQL)
- [x] Seed Initial Products (Custom Pet Replicas, Memorial Halo)
- [x] Ensure local Dev Servers sync correctly (Next.js & Vendure)

## Phase 2: Frontend UI & Pet Replica Configurator
- [x] **Fix NaN Price Errors:** Added guards for undefined/NaN prices across ProductCard, ProductConfigurator, and CartDrawer.
- [x] **Pet Replica Configurator Flow:**
  - [x] Implement robust image upload component (drag & drop, 5 files max, 10MB, JPG/PNG/WebP).
  - [x] Ensure user-entered "Special Instructions" are correctly saved to the cart/order via custom fields.
  - [x] Validate accurate pricing based on replica size selected (3-inch, 6-inch, 9-inch).
  - [ ] Ensure add-ons (like the Memorial Halo) can be cleanly attached to the main product in the cart.
- [x] **Trust & Visuals:**
  - [x] Product pages use framer-motion animations (fade-in, slide-in gallery, scroll-triggered sections).
  - [x] Interactive image gallery with thumbnail selector and animated transitions on product pages.
  - [x] Product cards have hover lift + clay glow animation.
  - [x] Added customer reviews/testimonials section to home page and product pages.

## Phase 3: SEO & Local GEO Strategy (Crucial)
- [x] **Core SEO Fundamentals:**
  - [x] Implement dynamic Meta Titles & Descriptions focused on "Custom Pet Replicas" (product pages have dynamic metadata).
  - [x] Ensure semantic HTML structure (H1, H2, H3) across product pages and articles.
  - [ ] Generate XML Sitemap & `robots.txt`.
- [ ] **GEO / Local Strategy:**
  - [ ] Create dynamic location-based landing pages if targeting specific cities/regions (e.g., `/locations/...`).
  - [ ] Implement `LocalBusiness` or `Product` Schema Markup tailored for local visibility.
  - [ ] Target voice-search FAQ phrases (e.g., "Where can I get a custom plush of my dog?").

## Phase 4: Operations & Payments (Stripe)
- [x] Configure `StripePlugin` in `vendure-config.ts`.
- [x] Create Stripe payment method in Vendure Admin.
- [x] Connect Stripe Elements on Next.js Checkout page.
- [x] Configure local Stripe Webhook for event handling and testing.
- [ ] Set up United States Tax Zones (e.g., 8.25% Sales tax) to calculate instantly on checkout.

## Phase 5: Storage & Email
- [x] **Asset Storage:**
  - [x] `@vendure/asset-server-plugin` configured with local dev storage + Cloudflare R2 for production.
- [x] **Transactional Email:**
  - [x] `@vendure/email-plugin` connected to Resend (SMTP) with verified domain `sales.mypetreplicas.com`.
  - [x] Styled "Order Confirmation" email template (dark theme matching website design).
  - [x] Fixed timezone display (TZ=America/Chicago).

## Phase 6: Deployment & Launch
- [ ] Provision Production PostgreSQL Database (Railway / Supabase).
- [ ] Deploy Vendure Backend (e.g., to Railway).
- [ ] Deploy Next.js Frontend (e.g., to Vercel or Railway).
- [ ] Configure Custom Domain and switch out localhost environment variables.
- [ ] Switch Stripe from `Test Mode` to `Live Mode`.
