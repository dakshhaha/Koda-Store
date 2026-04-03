import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductReviewSection from "@/components/ProductReviews";
import BuyButton from "@/components/BuyButton";
import { ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { convertUsdToCurrency, formatCurrency, normalizeCurrency } from "@/lib/currency";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const head = await headers();
  const currency = normalizeCurrency(head.get("x-detected-currency") || "USD");

  const product = await prisma.product.findUnique({
    where: { slug: slug },
    include: { category: true, reviews: { include: { user: { select: { name: true } } } } }
  });

  if (!product) return notFound();

  const primarySimilar = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 4,
  });

  let similarProducts = primarySimilar;
  if (primarySimilar.length < 4) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        id: {
          notIn: [product.id, ...primarySimilar.map((item) => item.id)],
        },
      },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4 - primarySimilar.length,
    });
    similarProducts = [...primarySimilar, ...fallbackProducts];
  }

  const images = JSON.parse(product.images || "[]");
  const displayPrice = convertUsdToCurrency(product.salePrice || product.price, currency);
  const displayOriginalPrice = convertUsdToCurrency(product.price, currency);
  const freeShippingThreshold = convertUsdToCurrency(200, currency);

  return (
    <div className="container section">
      <nav style={{ marginBottom: '2rem', fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
        <Link href={`/${locale}`}>Home</Link> / <Link href={`/${locale}/products`}>Products</Link> / <span style={{ color: 'var(--on-surface)' }}>{product.name}</span>
      </nav>

      <div className="product-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '4rem', alignItems: 'start' }}>
        {/* Gallery */}
        <div className="animate-in">
          <div className="detail-image-wrap" style={{ 
            aspectRatio: '1/1', background: 'var(--surface-container)', 
            borderRadius: 'var(--radius-xl)', overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <img src={images[0] || "/placeholder.png"} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {/* Thumbnails if any */}
          {images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {images.map((img: string, i: number) => (
                <div key={i} style={{ aspectRatio: '1/1', border: '2px solid var(--surface-container-high)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                   <img src={img} alt={`${product.name} ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          <span className="card-meta" style={{ display: 'block', marginBottom: '0.75rem' }}>{product.category?.name}</span>
          <h1 style={{ fontSize: '3rem', marginBottom: '1.25rem', lineHeight: '1.1', fontWeight: 800 }}>{product.name}</h1>
          
          <div className="card-price" style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {formatCurrency(displayPrice, currency, locale)}
            {product.salePrice && <span className="card-price-old" style={{ fontSize: '1.125rem' }}>{formatCurrency(displayOriginalPrice, currency, locale)}</span>}
          </div>

          <div style={{ padding: '1.5rem 0', borderTop: '1px solid var(--outline-variant)', borderBottom: '1px solid var(--outline-variant)', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.1em', color: 'var(--on-surface-variant)' }}>Product Overview</h3>
            <p style={{ color: 'var(--on-surface)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>{product.description}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Category</h4>
                <p style={{ color: 'var(--on-surface-variant)', textTransform: 'capitalize' }}>{product.category?.name || "Uncategorized"}</p>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Availability</h4>
                <p style={{ color: 'var(--on-surface-variant)' }}>{product.stock > 0 ? `In Stock (${product.stock} units)` : "Out of Stock"}</p>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Shipping</h4>
                <p style={{ color: 'var(--on-surface-variant)' }}>Ships globally in 24 hours</p>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Guarantee</h4>
                <p style={{ color: 'var(--on-surface-variant)' }}>1-Year Limited Warranty</p>
              </div>
            </div>
          </div>

          <BuyButton product={product} locale={locale} />
          
          {product.stock <= 5 && <p style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
               <ShieldCheck size={14} /> Low Stock — Only {product.stock} items left
            </p>}

          <div style={{ marginTop: '3.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              <Truck size={20} style={{ marginBottom: '0.5rem', color: 'var(--primary)' }} />
              <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Worldwide Shipping</p>
              <p>Free delivery on orders over {formatCurrency(freeShippingThreshold, currency, locale)}.</p>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              <ShieldCheck size={20} style={{ marginBottom: '0.5rem', color: 'var(--primary)' }} />
              <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Secure Payment</p>
              <p>Securely encrypted checkout with every transaction.</p>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              <RefreshCw size={20} style={{ marginBottom: '0.5rem', color: 'var(--primary)' }} />
              <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '0.25rem' }}>Easy Returns</p>
              <p>30-day return policy for all purchases.</p>
            </div>
          </div>
        </div>
      </div>

      <ProductReviewSection productId={product.id} />

      {similarProducts.length > 0 && (
        <section style={{ marginTop: "4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Similar Products</h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>
                Explore more picks from the same vibe and category.
              </p>
            </div>
            <Link href={`/${locale}/products`} className="btn btn-tertiary">See all products</Link>
          </div>

          <div className="grid grid-4" style={{ gap: "1.25rem" }}>
            {similarProducts.map((item, index) => {
              let thumb = "/placeholder.png";
              try {
                const parsedImages = JSON.parse(item.images || "[]");
                if (Array.isArray(parsedImages) && parsedImages[0]) {
                  thumb = parsedImages[0];
                }
              } catch {
              }

              return (
                <Link
                  key={item.id}
                  href={`/${locale}/products/${item.slug}`}
                  className="card animate-in"
                  style={{ animationDelay: `${0.05 * index}s`, display: "block" }}
                >
                  <div className="card-img-wrap" style={{ aspectRatio: "4 / 5" }}>
                    <img src={thumb} alt={item.name} />
                  </div>
                  <div className="card-body">
                    <p className="card-meta">{item.category?.name || "Product"}</p>
                    <h3 className="card-title">{item.name}</h3>
                    <p className="card-price">
                      {formatCurrency(convertUsdToCurrency(item.salePrice || item.price, currency), currency, locale)}
                      {item.salePrice && (
                        <span className="card-price-old">{formatCurrency(convertUsdToCurrency(item.price, currency), currency, locale)}</span>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
