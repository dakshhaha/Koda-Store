# Koda Store 🛍️ - Next-Gen E-commerce Platform

![Koda Store Banner](https://github.com/dakshhaha/Koda-Store/blob/884553df750a58c775ca5cfdca579087e5ececed/public/images/page.PNG)

**Koda Store** is a premium, high-performance e-commerce ecosystem built with Next.js 15 (App Router), React 19, and PostgreSQL. It features an advanced AI-powered customer support system, a dual-stage referral economy, and a "Curated Light" editorial design system.

🌍 **Live Demo:** [koda-store.vercel.app](https://koda-store.vercel.app/)

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/dakshisoffline) [![UPI](https://img.shields.io/badge/UPI-dakshdeepoffx%40fam-4CAF50?style=for-the-badge&logo=google-pay&logoColor=white)](upi://pay?pa=dakshdeepoffx@fam&pn=Developer)

---

## 🌟 Key Features

* **⚡ Cutting-Edge Stack**: Next.js 15, React 19, Tailwind CSS v4, and Prisma 6/7.
* **🤖 AI Support Ecosystem**: Specialized customer support bot with product embedding, order tracking, and seamless human agent escalation.
* **💰 Aura Rewards & Referrals**: A sophisticated growth engine with dual-stage rewards (Signup + Delivery).
* **🌍 Global Optimization**: Automatic IP-based localization, real-time currency conversion, and regional pricing.
* **💳 Unified Payment Gateway**: Robust support for Stripe, Razorpay, and COD, including seamless COD-to-Online payment conversion.
* **🛠️ Enterprise Admin Suite**: Comprehensive control over inventory, orders, user roles, support sessions, and site configuration.

---

## 💎 Core Modules

### 🪙 Aura Rewards System
The store features a proprietary virtual currency, **Aura Coins**, integrated into every interaction:
- **Dual-Stage Referral**: Referrers earn **100 Aura** instantly on friend signup and **400 Aura** once the friend's first order is delivered.
- **Spending**: Aura can be used in the dedicated Rewards Store for discounts or exclusive items.
- **Dynamic Tracking**: Real-time balance updates in the navigation profile and rewards dashboard.

### 🧠 AI Customer Support
More than a chatbot, the Koda AI is a full-service assistant:
- **Product Context**: Links products directly in chat cards with rich UI embeds.
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
