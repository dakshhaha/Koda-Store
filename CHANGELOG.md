# Changelog

All notable changes to this project will be documented in this file.
 
## [0.4.0] - 2026-04-06

### ⚡ Hybrid Discovery Engine
- **Traditional Search Route**: Launched `/search` with server-side fuzzy matching and category/price/sort filters.
- **Improved Discoverability**: Re-routed global SearchBar to the high-performance search engine to complement AI-based discovery.

### 🛡️ Distributed Stability (Rate Limiting)
- **Upstash Redis Middleware**: Migrated global rate-limiting from in-memory maps to distributed Redis. This ensures consistency across Vercel deployments and multi-region scaling.
- **Centralized Utility**: Refined `src/lib/rate-limit.ts` to be edge-compatible and robust against connection failures.

### 📦 Public Order Transparency
- **Tracking Portal**: New public `/track/[id]` route allowing customers to monitor delivery progress without logging in (shareable links).
- **QR Handover**: Dynamic QR code generation for every order, enabling seamless status tracking on mobile devices.

## [0.3.5] - 2026-04-06
### Added
- **Resilient AI sync**: Hardened the chat pipeline with background retry logic to handle transient LLM provider timeouts.

## [0.3.0] - 2026-04-06

### 📊 Performance Intelligence (Analytics)
- **Live Sync**: Admin Analytics dashboard now tracks **live active sessions** using Prisma session monitoring.
- **Dynamic Formatting**: Full **multi-currency support** in charts using `siteSettings` data and the `formatCurrency` utility.
- **Custom Visuals**: Re-engineered Recharts visuals into a specialized "Operational Status Allocation" donut and "Revenue Growth Projection" area chart.

### 🤖 AI Chat v0.3 (Stabilization)
- **Multi-Channel Sync**: Implemented a **resilient polling-based recovery** pipeline. Background sync (`syncSession`) automatically catches up if the primary streaming connection fails.
- **UX Refinement**: Removed "Sorry, I couldn't connect" flash-errors for transient timeouts; the UI now silently retries before notifying the user.
- **Hydration Fix**: Resolved a critical React hydration error by replacing semantically restricted `<p>` wrappers with `<div>` in the message formatter.

### 🛒 Persistent Cartesian
- **State Synchronization**: Carts are now fully synchronized with the `Cart` and `CartItem` Prisma models for logged-in users, enabling cross-device persistence.
- **Merge Logic**: Improved logic for merging local guest carts into the server-side Cartesian system during authentication.

### 🛠️ Core Hardening
- **Prisma Schema Fix**: Resolved `PrismaClientKnownRequestError` by applying missing `trackingNumber` column to the `Order` model.
- **Analytics Resilience**: Implemented explicit field selection on heavy dashboard queries to prevent runtime overhead.

## [0.2.1] - 2026-04-06

### 🛡️ Security & Performance
- **Redis Rate Limiting**: Migrated in-memory rate limiting to **Upstash Redis** for multi-instance scalability on `/api/chat`.
- **Lower Limits**: Reduced AI chat limits (8/min auth, 3/min anon) to optimize LLM costs and prevent abuse.
- **Zod Validation**: Replaced manual property checks with strict **Zod schemas** in `/api/auth/signup` and `/api/admin/settings`.
- **Hardened Headers**: Added `X-XSS-Protection` and refined CSP in `next.config.ts`.

### 📖 Documentation & UX
- **UI Visualizations**: Added professional shots of the AI Chat, Admin Dashboard, and Rewards engine to the README.
- **Agent Architecture**: New "How Koda Agent Works" section detailing the RAG + Tool-calling logic.
- **Vercel Integration**: Added "Deploy to Vercel" one-click button for instant community testing.

## [0.2.0] - 2026-04-06

### 🤖 AI / Agent (Phase 1)
- **Tool-calling agent**: AI assistant now calls Prisma-backed tools (search, order lookup, stock check, coupon listing) instead of context-stuffing the entire catalog into the prompt.
- **RAG with pgvector**: Product embeddings via Gemini `text-embedding-004` stored in PostgreSQL with pgvector. Semantic similarity search replaces keyword-only matching.
- **ChatMessage model**: Chat history migrated from JSON string in `SupportSession.messages` to a proper `ChatMessage` relational model with indexed `sessionId + createdAt`.

### 🗃️ Database & Schema (Phase 2)
- **Indexes**: Added indexes on `Product.categoryId`, `Product.featured`, `Order.userId`, `Order.status`, `Order.createdAt`, `Review.productId`, `Review.userId`, `Address.userId`, `SupportSession.userId`, `SupportSession.status`, `Referral.referrerId`, `Referral.referredId`, and all foreign keys on `OrderItem`, `CartItem`.
- **Cart model**: New server-side `Cart` and `CartItem` models with `CartContext` syncing to the API when authenticated, falling back to `localStorage` for guests.
- **JSONB images**: `Product.images` changed from `String` to `Json` type. Removed all `JSON.parse(product.images)` calls across the codebase.
- **ProductEmbedding model**: New model for storing vector embeddings per product with pgvector's `vector(768)` type.

### 🔒 Security & Production Readiness (Phase 3)
- **Rate limiting**: In-memory sliding-window rate limiter on `/api/chat` (20/min anon, 40/min auth) and `/api/auth/login` (5/min per IP).
- **Input validation**: New `src/lib/validation.ts` with email, password, UUID, and XSS sanitization utilities.
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy configured in `next.config.ts`.
- **Chat sanitization**: User messages are sanitized before AI processing and database storage.

### 📊 UI Polish (Phase 5)
- **Analytics dashboard**: New admin analytics page at `/admin/analytics` with Recharts — revenue trend (area chart), order status distribution (donut), top products (horizontal bar), and customer growth (bar chart).
- **Invite & Earn**: Added visible "Invite & Earn" button in NavActions for authenticated users, making the referral program more discoverable.
- **Version fix**: README updated from Next.js 15 → 16 and Prisma 6/7 → 7.

### 🛠️ Developer Experience (Phase 4)
- **CHANGELOG.md**: This file — tracking all changes systematically.
- **Migration scripts**: `scripts/migrate-messages.ts` for JSON→ChatMessage migration, `scripts/generate-embeddings.ts` for product embedding generation.

## [0.1.0] - 2026-04-02

### Initial Release
- Full e-commerce platform with Next.js 16, React 19, Prisma 7, PostgreSQL
- AI-powered customer support with multi-provider fallback (Gemini, OpenRouter, Claude)
- Dual-stage referral system with Aura Coins economy
- Multi-gateway payments (Stripe, Razorpay) with automatic currency detection
- Admin panel with product management, order tracking, user management, and support portal
- IP-based locale/currency detection middleware
- "Curated Light" editorial design system
