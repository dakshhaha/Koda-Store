# Koda Store 🛍️ - Next-Gen E-commerce Platform

![Koda Store Banner](https://github.com/dakshhaha/Koda-Store/blob/884553df750a58c775ca5cfdca579087e5ececed/public/images/page.PNG)

**Koda Store** is a premium, high-performance e-commerce ecosystem built with Next.js 16 (App Router), React 19, and PostgreSQL. It features an advanced AI-powered customer support system, a dual-stage referral economy, and a "Curated Light" editorial design system.

🌍 **Live Demo:** [koda-store.vercel.app](https://koda-store.vercel.app/)

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/dakshisoffline) [![UPI](https://img.shields.io/badge/UPI-dakshdeepoffx%40fam-4CAF50?style=for-the-badge&logo=google-pay&logoColor=white)](upi://pay?pa=dakshdeepoffx@fam&pn=Developer)

---

## 🚀 What's New in v0.3.0: Enterprise Core

The "Stabilization & Security" milestone is here. Koda Store is now more secure, localized, and data-driven.

- **📊 High-Performance Analytics**: A new Admin Dashboard using **Recharts** for real-time revenue, order trends, and product performance tracking.
- **⚡ AI Stream Engine**: Upgraded the support agent to use **Server-Sent Events (SSE)**. Responses now stream token-by-token for zero perceived latency.
- **🇮🇳 Global Reach (i18n)**: Native support for **Hindi and English**, with automatic locale detection and a dictionary-based translation system.
- **🛡️ AI Moderation Layer**: Proactive regex and safety filtering for all AI interactions to prevent abuse and toxic inputs.
- **📦 Advanced Logistics**: Live **Order Tracking** pages with dynamic **QR Code** generation for mobile-first customer experiences.
- **🧩 Product Variants**: Full support for multi-SKU inventory (Size, Color, Price Overrides) in the persistent cart system.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdakshhaha%2FKoda-Store)

---

## 🖼️ Visual Experience

````carousel
![AI Support Chat](public/images/ai_chat.png)
<!-- slide -->
![Admin Analytics Dashboard](public/images/admin_dashboard.png)
<!-- slide -->
![Aura Rewards & Referrals](public/images/rewards_dashboard.png)
````

---

## 🧠 How Koda Agent Works (RAG + Tool-Calling)

The Koda AI Assistant is built on a "Reason-Act" architecture, allowing it to move beyond simple chat and into real-time store operations:

1. **Semantic Search (RAG)**: When a user asks about products, the system converts the query into a vector using Gemini's `text-embedding-004`. It then performs a cosine similarity search against the `ProductEmbedding` table in PostgreSQL.
2. **Dynamic Tool-Calling**: Koda has access to a suite of internal "tools" (server actions). If a user asks "Where is my order?", the agent autonomously identifies the need for the `lookupOrder` tool and fetches live data from Prisma.
3. **Contextual Memory**: Unlike basic bots, Koda retains short-term session memory backed by `SupportSession` and `ChatMessage` models, allowing for complex multi-turn support.
4. **Human Handoff**: If the sentiment analysis detects frustration or a request for a "real person," Koda transitions the session to `human_needed` status, notifying agents in the Admin Portal.

---

## 💎 Core Modules

### 🪙 Aura Rewards System
The store features a proprietary virtual currency, **Aura Coins**, integrated into every interaction:
- **Dual-Stage Referral**: Referrers earn **100 Aura** instantly on friend signup and **400 Aura** once the friend's first order is delivered.
- **Spending**: Aura can be used in the dedicated Rewards Store for discounts or exclusive items.
- **Dynamic Tracking**: Real-time balance updates in the navigation profile and rewards dashboard.

### 🧠 AI Customer Support (Koda Agent)
More than a chatbot, the Koda AI is a full-service assistant:
- **RAG & Embeddings**: Uses `pgvector` for high-fidelity semantic search across the product catalog.
- **Tool-Calling**: The agent can autonomously call internal APIs to check order status, fetch product details, and initiate support sessions.
- **Order Awareness**: Authenticated users can ask about their specific order status.
- **Escalation Logic**: Automatically detects complex queries and initializes a human support session in the Admin Portal.
- **Model Agnostic**: Integrated fallback for Gemini, OpenRouter, and Claude.

### 💳 Advanced Payment Infrastructure
- **COD Upgrades**: Unique "Pay Online" feature allows customers who chose COD to upgrade to online payment at any time before delivery.
- **Regional Resilience**: Smart gateway selection picks the best provider (Stripe/Razorpay) based on the user's currency and region.
- **Sanitized Flow**: Comprehensive verification for Razorpay signatures and Stripe webhooks.

### 🎨 Design System: "Curated Light"
- **Editorial Aesthetic**: A high-end, light-themed editorial brand identity using Burnt Ochre and Amber accents.
- **Responsive Fluidity**: Optimized for mobile-first editorial browsing with smooth micro-animations.
- **Glassmorphism**: Subtle structural elements in chat and navigation for a premium feel.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 20+
* npm, yarn, pnpm, or bun

### 1. Clone & Install
```bash
git clone https://github.com/dakshhaha/Koda-Store
cd Koda-Store
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your keys (including Gemini API and Database credentials):
```bash
cp .env.example .env
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```
*(Optional)* Seed the database:
```bash
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🤝 Contributing
Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and pull request process.

---

## 💖 Support the Project
If you found this template helpful, consider supporting the development!

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/dakshisoffline)
[![UPI](https://img.shields.io/badge/UPI-dakshdeepoffx%40fam-4CAF50?style=for-the-badge&logo=google-pay&logoColor=white)](upi://pay?pa=dakshdeepoffx@fam&pn=Developer)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
