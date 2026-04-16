# 🔱 Koda Store v0.4.0
## Stabilized Production Release

Koda Store is a high-performance, editorial e-commerce platform designed with the **Digital Curator** philosophy. Version 0.4.0 marks the transition from "AI-First Proof of Concept" to "Enterprise-Ready Stabilized Storefront".

# Live Demo

Live Demo Link: https://koda-store.vercel.app/

<p align="left">
  <a href="https://ko-fi.com/dakshisoffline" target="_blank">
    <img src="https://img.shields.io/badge/Support%20on%20Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-fi" />
  </a>
  &nbsp;
  <a href="upi://pay?pa=dakshdeepoffx@fam&pn=Daksh%20Deep&cu=INR" target="_blank">
    <img src="https://img.shields.io/badge/Pay%20via%20UPI-dakshdeepoffx%40fam-4A90D9?style=for-the-badge&logo=googlepay&logoColor=white" alt="UPI" />
  </a>
</p>

---

### 🚀 Key v0.4.0 Features

-   **⚡ Hybrid Discovery Engine**: Complemented the RAG-based AI assistant with a **traditional, high-performance server-side search** route (`/search`) featuring fuzzy multi-field matching and comprehensive category/price filtering.
-   **🛡️ Distributed Shield**: Migrated global rate-limiting from transient in-memory maps to a robust **Upstash Redis** architecture. This ensures multi-region consistency and enterprise-grade abuse prevention across all sensitive API routes.
-   **📦 Public Transparency Portal**: Launched a public-facing **order tracking system** (`/track/[id]`). Customers can now share live status links featuring a real-time progress visualizer and mobile-friendly **QR code handoff**.
-   **🛒 Persistent Cartesian System**: Carts are synchronised with the database for all authenticated users, ensuring items persist seamlessly across devices and browser sessions.
-   **📊 Performance Intelligence**: Integrated **Recharts-driven analytics** for admins to monitor sales trends, order distributions, and operational bottlenecks in real-time.
-   **🤖 Resilient AI Pipeline**: Hardened the Koda assistant with **background polling**. If the primary streaming connection fails, the UI silently recovers the response from the database, ensuring zero downtime for support.

---

## 🛠️ Technology Stack
*   **Framework**: Next.js 16 (App Router)
*   **Database**: PostgreSQL (Supabase) + Prisma 7
*   **Search**: pgvector (Semantic) + traditional ILIKE (Fuzzy)
*   **Caching/Rate-Limit**: Upstash Redis
*   **Styling**: Vanilla CSS (The Editorial Design System)
*   **Analytics**: Recharts
*   **Auth**: NextAuth.js

## 📦 Deployment
The codebase is fully optimized for **Vercel** with edge-compatible middleware and optimized Prisma query patterns.

1.  Clone and `npm install`
2.  Set `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, and `GOOGLE_GENERATIVE_AI_API_KEY`
3.  `npx prisma db push`
4.  `npm run dev`

---
Consider Supporting this project :)
<p align="left">
  <a href="https://ko-fi.com/dakshisoffline" target="_blank">
    <img src="https://img.shields.io/badge/Support%20on%20Ko--fi-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" alt="Ko-fi" />
  </a>
  &nbsp;
  <a href="upi://pay?pa=dakshdeepoffx@fam&pn=Daksh%20Deep&cu=INR" target="_blank">
    <img src="https://img.shields.io/badge/Pay%20via%20UPI-dakshdeepoffx%40fam-4A90D9?style=for-the-badge&logo=googlepay&logoColor=white" alt="UPI" />
  </a>
</p>

## 📖 Feature Walkthrough
For a detailed breakdown of the AI architecture, Rewards economy, and Admin controls, see the [Walkthrough](./WALKTHROUGH.md) (coming soon) or check the [CHANGELOG.md](./CHANGELOG.md).
