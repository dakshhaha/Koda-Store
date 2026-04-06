import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { convertUsdToCurrency, formatCurrency, normalizeCurrency } from "@/lib/currency";
import SearchBar from "@/components/SearchBar";
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; minPrice?: string; maxPrice?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const { q, category, minPrice, maxPrice, sort } = resolvedSearchParams;
  const head = await headers();
  const currency = normalizeCurrency(head.get("x-detected-currency") || "USD");

  const query = q?.trim() || "";
  
  // Building the where clause for server-side filtering
  const where: any = {
    OR: query ? [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { category: { name: { contains: query, mode: 'insensitive' } } }
    ] : undefined,
  };

  if (category) {
    where.categoryId = category;
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }

  const orderBy: any = {};
  if (sort === "price_asc") orderBy.price = "asc";
  else if (sort === "price_desc") orderBy.price = "desc";
  else if (sort === "name_asc") orderBy.name = "asc";
  else orderBy.createdAt = "desc";

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      take: 40,
    }),
    prisma.category.findMany(),
  ]);

  return (
    <div className="container section">
      <div style={{ maxWidth: '800px', margin: '0 auto 3rem auto', textAlign: 'center' }}>
        <h1 className="section-title">Search Koda Store</h1>
        <p className="section-subtitle">Find exact curations using our traditional high-performance engine.</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <SearchBar />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem' }}>
        {/* FILTERS SIDEBAR */}
        <aside style={{ position: 'sticky', top: '6rem', height: 'fit-content' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '0.75rem' }}>
              <Filter size={18} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Filters</h2>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>Categories</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link 
                  href={{ query: { ...resolvedSearchParams, category: undefined } }}
                  className={!category ? 'text-primary font-bold' : 'text-muted'}
                  style={{ fontSize: '0.875rem', padding: '0.25rem 0' }}
                >
                  All Categories
                </Link>
                {categories.map(c => (
                  <Link 
                    key={c.id}
                    href={{ query: { ...resolvedSearchParams, category: c.id } }}
                    className={category === c.id ? 'text-primary font-bold' : 'text-muted'}
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0' }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>Sort By</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {[
                   { label: 'Latest', value: 'newest' },
                   { label: 'Price: Low to High', value: 'price_asc' },
                   { label: 'Price: High to Low', value: 'price_desc' },
                   { label: 'Name: A-Z', value: 'name_asc' }
                 ].map(s => (
                   <Link 
                    key={s.value}
                    href={{ query: { ...resolvedSearchParams, sort: s.value } }}
                    className={(sort === s.value || (!sort && s.value === 'newest')) ? 'text-primary font-bold' : 'text-muted'}
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0' }}
                  >
                    {s.label}
                  </Link>
                 ))}
              </div>
            </div>

            <Link 
              href={`/${locale}/search`}
              className="btn btn-secondary w-full"
              style={{ fontSize: '0.75rem', marginTop: '1rem' }}
            >
              Reset All
            </Link>
          </div>
        </aside>

        {/* RESULTS GRID */}
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Showing {products.length} {products.length === 1 ? 'result' : 'results'} {query ? `for "${query}"` : ''}
            </p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-3">
              {products.map((product, i) => {
                const images = (product.images || []) as string[];
                const convertedPrice = convertUsdToCurrency(product.salePrice || product.price, currency);
                return (
                  <Link href={`/${locale}/products/${product.slug}`} key={product.id}>
                    <div className="card" style={{ height: '100%' }}>
                      <div className="card-img-wrap" style={{ height: '200px' }}>
                        <img src={images[0] || "/placeholder.png"} alt={product.name} />
                      </div>
                      <div className="card-body">
                        <span className="card-meta">{product.category?.name || "General"}</span>
                        <h3 className="card-title" style={{ fontSize: '1rem' }}>{product.name}</h3>
                        <div className="card-price">
                          {formatCurrency(convertedPrice, currency, locale)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', background: 'var(--surface-container-low)' }}>
              <Search size={48} style={{ margin: '0 auto 1.5rem auto', opacity: 0.2 }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No products found</h2>
              <p className="text-muted">Try adjusting your search query or filters to find what you're looking for.</p>
              <div style={{ marginTop: '2rem' }}>
                <Link href={`/${locale}/products`} className="btn btn-primary">Browse All Products</Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
