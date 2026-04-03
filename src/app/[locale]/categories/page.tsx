import Link from "next/link";

const CATEGORIES = [
  { name: "Furniture", slug: "furniture", count: 12, desc: "Handcrafted tables, desks, and chairs built to last." },
  { name: "Lighting", slug: "lighting", count: 8, desc: "Desk lamps, pendants, and ambient lighting." },
  { name: "Home & Living", slug: "home-living", count: 15, desc: "Blankets, vases, and curated decor." },
  { name: "Dining", slug: "dining", count: 10, desc: "Glassware, ceramics, and tabletop essentials." },
  { name: "Accessories", slug: "accessories", count: 6, desc: "Bags, wallets, and everyday luxuries." },
  { name: "Decor", slug: "decor", count: 9, desc: "Art objects, candle holders, and bookends." },
  { name: "Storage", slug: "storage", count: 5, desc: "Baskets, boxes, and organizational pieces." },
];

export default function CategoriesPage() {
  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">Shop by Category</h1>
          <p className="section-subtitle">Browse our curated collections</p>
        </div>
      </div>
      <div className="grid grid-3">
        {CATEGORIES.map((cat, i) => (
          <Link href={`/products?category=${cat.slug}`} key={cat.slug}>
            <div className={`card animate-in animate-delay-${(i % 4) + 1}`} style={{ height: '100%' }}>
              <div className="card-img-wrap" style={{ aspectRatio: '16 / 9' }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: `linear-gradient(${135 + i * 25}deg, var(--surface-container), var(--surface-container-high))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800,
                  color: 'var(--on-surface-variant)', opacity: 0.2,
                }}>
                  {cat.name.charAt(0)}
                </div>
              </div>
              <div className="card-body">
                <h3 className="card-title">{cat.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>{cat.desc}</p>
                <span className="card-meta" style={{ marginTop: '0.5rem' }}>{cat.count} products</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
