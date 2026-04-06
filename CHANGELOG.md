# Changelog

All notable changes to this project will be documented in this file.

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
