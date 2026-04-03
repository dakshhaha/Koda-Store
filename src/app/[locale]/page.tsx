import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Truck, ShieldCheck, RefreshCw, Star, ArrowRight, Zap, Clock, Gift, BadgeCheck, Headset, MapPin, HelpCircle } from "lucide-react";
import { convertUsdToCurrency, formatCurrency, normalizeCurrency } from "@/lib/currency";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const head = await headers();
  const currency = normalizeCurrency(head.get("x-detected-currency") || "USD");

  const { locale } = await params;
  const money = (amount: number) => formatCurrency(convertUsdToCurrency(amount, currency), currency, locale);
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true },
    take: 8,
    include: { category: true }
  });

  const allProducts = await prisma.product.findMany({
    take: 12,
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  const categories = await prisma.category.findMany();

  // Split products for different sections
  const newArrivals = allProducts.slice(0, 4);
  const bestSellers = allProducts.slice(4, 8);
  const dealProducts = allProducts.filter(p => p.salePrice).slice(0, 4);
  const roomCollections = [
    { title: "Living Room", subtitle: "Sofas, side tables, statement lighting", product: allProducts[0] },
    { title: "Bedroom", subtitle: "Comfort layers, storage, soft textures", product: allProducts[1] },
    { title: "Dining", subtitle: "Tables, serveware, everyday hosting", product: allProducts[2] },
    { title: "Work + Study", subtitle: "Desks, organizers, focused lighting", product: allProducts[3] },
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-content animate-in">
            <div className="hero-badge">New Collection — SS26</div>
            <h1>Simple Designs for Modern Living.</h1>
            <p>Discover quality products chosen for their craftsmanship. Free shipping on orders over {money(200)}.</p>
            <div className="hero-actions">
              <Link href={`/${locale}/products`} className="btn btn-primary btn-lg">Shop Now</Link>
              <Link href={`/${locale}/categories`} className="btn btn-secondary btn-lg">Shop by Style</Link>
            </div>
          </div>
          <div className="hero-visual animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="hero-image-wrap">
              <img src="/images/ceramic_vase_editorial_1775099062134.png" alt="Featured product" />
            </div>
            <div className="hero-float hero-float-1"></div>
            <div className="hero-float hero-float-2"></div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{ background: 'var(--surface-container)', padding: '1.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <Truck size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontWeight: 700 }}>Free Shipping</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>On orders over {money(200)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontWeight: 700 }}>Secure Payments</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Stripe, Razorpay, PayPal</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <RefreshCw size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontWeight: 700 }}>30-Day Returns</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Easy return policy</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <Clock size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontWeight: 700 }}>24/7 Support</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>AI + Human agents</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="section bg-surface">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Find exactly what you need</p>
            </div>
            <Link href={`/${locale}/categories`} className="btn btn-tertiary">View All &rarr;</Link>
          </div>
          <div className="grid grid-3">
            {categories.map((cat, i) => {
              let imgSrc = cat.image;
              if (!imgSrc) {
                const firstProduct = allProducts.find(p => p.categoryId === cat.id);
                if (firstProduct) {
                  try { imgSrc = JSON.parse(firstProduct.images || "[]")[0]; } catch {}
                }
              }
              // Hardcoded fallback for new categories without products like Decor
              if (!imgSrc && cat.slug === "decor") {
                imgSrc = "/images/ceramic_vase_editorial_1775099062134.png";
              }

              return (
                <Link href={`/${locale}/products?category=${cat.slug}`} key={cat.id}>
                  <div className={`cat-card animate-in animate-delay-${(i % 4) + 1}`}>
                    {imgSrc ? (
                      <img 
                        src={imgSrc} 
                        alt={cat.name} 
                        style={{ 
                          position: 'absolute', 
                          inset: 0, 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        background: `linear-gradient(${135 + i * 20}deg, var(--surface-container), var(--surface-container-high))` 
                      }}></div>
                    )}
                    <div className="cat-card-overlay">
                      <h3>{cat.name}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Our most popular picks</p>
            </div>
            <Link href={`/${locale}/products`} className="btn btn-secondary">Shop All <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-4">
            {featuredProducts.slice(0, 4).map((product, i) => {
              const images = JSON.parse(product.images || "[]");
              return (
                <Link href={`/${locale}/products/${product.slug}`} key={product.id}>
                  <div className={`card animate-in animate-delay-${(i % 4) + 1}`}>
                    <div className="card-img-wrap">
                      <img src={images[0] || "/placeholder.png"} alt={product.name} />
                      {product.salePrice && <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'var(--error)', color: 'white', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.625rem', fontWeight: 700 }}>SALE</span>}
                    </div>
                    <div className="card-body">
                      <span className="card-meta">{product.category?.name || "Uncategorized"}</span>
                      <h3 className="card-title">{product.name}</h3>
                      <div className="card-price">
                        {money(product.salePrice || product.price)}
                        {product.salePrice && <span className="card-price-old">{money(product.price)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Deals Banner */}
      {dealProducts.length > 0 && (
        <section className="section" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '4rem 0' }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Zap size={24} style={{ color: '#fbbf24' }} />
                  <h2 className="section-title" style={{ color: 'white' }}>Deals of the Day</h2>
                </div>
                <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.6)' }}>Limited time offers on top products</p>
              </div>
            </div>
            <div className="grid grid-4">
              {dealProducts.map((product, i) => {
                const images = JSON.parse(product.images || "[]");
                const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
                return (
                  <Link href={`/${locale}/products/${product.slug}`} key={product.id}>
                    <div className={`card animate-in animate-delay-${(i % 4) + 1}`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="card-img-wrap">
                        <img src={images[0] || "/placeholder.png"} alt={product.name} />
                        <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#ef4444', color: 'white', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800 }}>-{discount}%</span>
                      </div>
                      <div className="card-body">
                        <h3 className="card-title" style={{ color: 'white' }}>{product.name}</h3>
                        <div className="card-price" style={{ color: '#fbbf24' }}>
                          {money(product.salePrice || product.price)}
                          <span className="card-price-old" style={{ color: 'rgba(255,255,255,0.4)' }}>{money(product.price)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">Just added to our collection</p>
            </div>
            <Link href={`/${locale}/products`} className="btn btn-tertiary">View All &rarr;</Link>
          </div>
          <div className="grid grid-4">
            {newArrivals.map((product, i) => {
              const images = JSON.parse(product.images || "[]");
              return (
                <Link href={`/${locale}/products/${product.slug}`} key={product.id}>
                  <div className={`card animate-in animate-delay-${(i % 4) + 1}`}>
                    <div className="card-img-wrap">
                      <img src={images[0] || "/placeholder.png"} alt={product.name} />
                      <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'var(--primary)', color: 'white', padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)', fontSize: '0.625rem', fontWeight: 700 }}>NEW</span>
                    </div>
                    <div className="card-body">
                      <span className="card-meta">{product.category?.name}</span>
                      <h3 className="card-title">{product.name}</h3>
                      <div className="card-price">
                        {money(product.salePrice || product.price)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className="section" style={{ background: 'var(--surface-container-low)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Why Shop With Koda Store?</h2>
            <p className="section-subtitle">We make online shopping simple and secure</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div className="admin-card animate-in" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
              <ShieldCheck size={36} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Secure Checkout</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Your payments are protected with industry-standard encryption. We support Stripe, Razorpay, PayPal, and more.
              </p>
            </div>
            <div className="admin-card animate-in" style={{ textAlign: 'center', padding: '2.5rem 2rem', animationDelay: '0.1s' }}>
              <Gift size={36} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Quality Products</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Every item in our store is selected for its design and build quality. We stand behind every product we sell.
              </p>
            </div>
            <div className="admin-card animate-in" style={{ textAlign: 'center', padding: '2.5rem 2rem', animationDelay: '0.2s' }}>
              <Truck size={36} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>Fast Delivery</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                We ship worldwide with tracking. Free delivery on orders over {money(200)}. Most orders arrive in 3-7 days.
              </p>
            </div>
            <div className="admin-card animate-in" style={{ textAlign: 'center', padding: '2.5rem 2rem', animationDelay: '0.3s' }}>
              <Star size={36} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem' }}>5-Star Support</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Our AI assistant is available 24/7, and our human support team is ready to help with any issue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">Best Sellers</h2>
                <p className="section-subtitle">Top-rated by our customers</p>
              </div>
              <Link href={`/${locale}/products`} className="btn btn-tertiary">Shop All &rarr;</Link>
            </div>
            <div className="grid grid-4">
              {bestSellers.map((product, i) => {
                const images = JSON.parse(product.images || "[]");
                return (
                  <Link href={`/${locale}/products/${product.slug}`} key={product.id}>
                    <div className={`card animate-in animate-delay-${(i % 4) + 1}`}>
                      <div className="card-img-wrap">
                        <img src={images[0] || "/placeholder.png"} alt={product.name} />
                      </div>
                      <div className="card-body">
                        <span className="card-meta">{product.category?.name}</span>
                        <h3 className="card-title">{product.name}</h3>
                        <div className="card-price">
                          {money(product.salePrice || product.price)}
                          {product.salePrice && <span className="card-price-old">{money(product.price)}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop With Confidence</h2>
              <p className="section-subtitle">Reliable shipping, verified payments, and support when you need it.</p>
            </div>
          </div>
          <div className="grid grid-4">
            <div className="admin-card animate-in" style={{ marginBottom: 0 }}>
              <BadgeCheck size={24} style={{ color: "var(--primary)", marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Verified Quality</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>Each listing is checked for accurate product details, availability, and final pricing.</p>
            </div>
            <div className="admin-card animate-in" style={{ marginBottom: 0, animationDelay: "0.08s" }}>
              <MapPin size={24} style={{ color: "var(--primary)", marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Location-Aware Checkout</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>Country, region, and PIN code can auto-fill from IP and browser location permission.</p>
            </div>
            <div className="admin-card animate-in" style={{ marginBottom: 0, animationDelay: "0.16s" }}>
              <Headset size={24} style={{ color: "var(--primary)", marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Support Agent Portal</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>Complex support chats are escalated from AI directly to human agents in real time.</p>
            </div>
            <div className="admin-card animate-in" style={{ marginBottom: 0, animationDelay: "0.24s" }}>
              <RefreshCw size={24} style={{ color: "var(--primary)", marginBottom: "0.75rem" }} />
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Easy Returns</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)" }}>Simple return steps and clear order tracking from checkout to delivery.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface-container-low)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Room</h2>
              <p className="section-subtitle">Explore a long-form marketplace layout like major e-commerce experiences</p>
            </div>
            <Link href={`/${locale}/products`} className="btn btn-secondary">View Full Catalog <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-4">
            {roomCollections.map((room, i) => {
              const product = room.product;
              const images = JSON.parse(product?.images || "[]");
              return (
                <Link href={product ? `/${locale}/products/${product.slug}` : `/${locale}/products`} key={room.title}>
                  <div className={`card animate-in animate-delay-${(i % 4) + 1}`}>
                    <div className="card-img-wrap">
                      <img src={images[0] || "/placeholder.png"} alt={room.title} />
                    </div>
                    <div className="card-body">
                      <span className="card-meta">{room.title}</span>
                      <h3 className="card-title">{product?.name || `${room.title} Essentials`}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{room.subtitle}</p>
                      <div className="card-price">{money(product?.salePrice || product?.price || 0)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recently Viewed / All Products */}
      <section className="section" style={{ background: 'var(--surface-container-low)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Explore More Products</h2>
              <p className="section-subtitle">Browse our full collection</p>
            </div>
            <Link href={`/${locale}/products`} className="btn btn-secondary">View All Products <ArrowRight size={16} /></Link>
          </div>
          <div className="grid grid-4">
            {allProducts.slice(0, 8).map((product, i) => {
              const images = JSON.parse(product.images || "[]");
              return (
                <Link href={`/${locale}/products/${product.slug}`} key={product.id}>
                  <div className={`card animate-in animate-delay-${(i % 4) + 1}`}>
                    <div className="card-img-wrap">
                      <img src={images[0] || "/placeholder.png"} alt={product.name} />
                    </div>
                    <div className="card-body">
                      <span className="card-meta">{product.category?.name}</span>
                      <h3 className="card-title">{product.name}</h3>
                      <div className="card-price">
                        {money(product.salePrice || product.price)}
                        {product.salePrice && <span className="card-price-old">{money(product.price)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">Quick answers before you place your order.</p>
            </div>
          </div>
          <div className="grid grid-2">
            {[
              {
                title: "Do you support real payment gateways?",
                detail: "Yes. Checkout uses live provider flows such as Stripe Checkout, Razorpay, PayPal, and Flutterwave with verification before receipt.",
              },
              {
                title: "Can my address auto-fill?",
                detail: "Yes. We detect location from IP by default and can request browser location permission for more precise city and postal details.",
              },
              {
                title: "Can I edit auto-detected location?",
                detail: "Always. The address fields remain fully editable before payment, and you can save them for later checkouts.",
              },
              {
                title: "How do I contact support?",
                detail: "Use the chat assistant on the storefront. If needed, chats are escalated to the support agent portal for human response.",
              },
            ].map((item, index) => (
              <div key={item.title} className="admin-card animate-in" style={{ marginBottom: 0, animationDelay: `${index * 0.08}s` }}>
                <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <HelpCircle size={16} style={{ color: "var(--primary)" }} /> {item.title}
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)", lineHeight: 1.7 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
