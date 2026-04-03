# Koda Store 🛍️ - Next-Gen E-commerce Platform

![Koda Store Banner](public/page.png) 

**Koda Store** is a modern, high-performance, open-source e-commerce template built with Next.js 16 (App Router), React 19, and SQLite. It features an advanced AI-powered customer support system, multi-currency support, IP-based localization, and a comprehensive admin dashboard.

---

## 🌟 Key Features

* **⚡ Modern Tech Stack**: Next.js 16, React 19, Tailwind CSS v4, and TypeScript.
* **🤖 AI Support Agents**: Built-in intelligent customer support bot capable of handling initial queries before escalating to human agents. Fallback mechanism supports Gemini, OpenRouter, and Claude.
* **🌍 Global Ready**: Automatic IP-based localization and currency conversion.
* **💳 Multi-Gateway Payments**: Ready-to-go integrations for Stripe, PayPal, and Razorpay.
* **🛠️ Admin Dashboard**: Full control over products, orders, users, announcements, coupons, and support tickets.
* **🗄️ Lightweight & Fast Database**: Uses Prisma with Better-SQLite3 for instant setup and blisteringly fast local reads/writes, easily scalable to PostgreSQL.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 20+
* npm, yarn, pnpm, or bun

### 1. Clone & Install
*(Once you push this to GitHub, users can clone it like this:)*
```bash
git clone https://github.com/dakshhaha/Koda-Store
cd koda-store
npm install
```

### 2. Environment Variables
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```

### 3. Database Setup
Initialize the SQLite database and run the initial migrations:
```bash
npx prisma generate
npx prisma db push
```
*(Optional)* Seed the database with initial categories:
```bash
# Example if you have a configured runner for scripts:
npx tsx scripts/seed-categories.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

Koda Store includes a `Dockerfile` and `docker-compose.yml` for effortless self-hosting.

```bash
# Build and start the container in detached mode
docker-compose up -d --build
```
Your app will be available on port 3000. Production database is stored in the Docker volume.

---

## 🐘 Using PostgreSQL 
By default, Koda Store uses SQLite for easy local setup. However, moving to PostgreSQL is simple:

1. Open `prisma/schema.prisma`
2. Change the provider block:
   ```prisma
   datasource db {
     provider = "postgresql" // Changed from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Update your `.env` file with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/kodastore?schema=public"
   ```
4. Run `npx prisma generate` and `npx prisma db push` to push the schema to your Postgres instance.

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

---

## 💖 Support the Project

If you found this template helpful and want to support the development of **Koda Store**, consider making a donation! Your support helps keep this project alive and continuously updated.

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/dakshisoffline)

[![UPI](https://img.shields.io/badge/UPI-dakshdeepoffx%40fam-4CAF50?style=for-the-badge&logo=google-pay&logoColor=white)](upi://pay?pa=dakshdeepoffx@fam&pn=Developer)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
