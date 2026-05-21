import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Heart, Eye } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [featLoading, setFeatLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, "products"), where("featured", "==", true), limit(4));
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setFeatured(items);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setFeatLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <main>
      {/* HERO SECTION */}
      <section className="hero-full">
        <div className="hero-full-bg">
          <img src="/hero-banner.jpg" alt="JD Good Hair - Luxury Hair Extensions" />
        </div>
        <div className="hero-full-overlay" />
        <div className="hero-full-content">
          <motion.div
            className="hero-text-box"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="hero-eyebrow">Luxury for Less</span>
            <h1 className="hero-h1">PREMIUM HAIR EXTENSIONS</h1>
            <p className="hero-sub">
              Discover our curated collection of 100% virgin human hair bundles, wigs, closures &amp; frontals.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/products" className="hero-btn primary">Shop Now</a>
              <a href="/products?cat=Wigs" className="hero-btn secondary">Browse Wigs</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container" style={{ padding: '4rem 1rem 2rem' }}>
        <p className="section-eyebrow" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Browse</p>
        <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Shop by Category</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          {['Bundles', 'Wigs', 'Closures', 'Frontals'].map(cat => (
            <a
              key={cat}
              href={`/products?cat=${cat}`}
              className="cat-pill"
            >
              {cat}
            </a>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="featured-section container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="section-eyebrow">Curated Selection</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', margin: 0 }}>
              Featured Products
            </h2>
          </div>
          <a href="/products" className="view-all-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            View All <ArrowRight size={16} />
          </a>
        </div>

        {featLoading ? (
          <div className="featured-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="feat-card-skeleton" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="featured-grid">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                className="feat-product-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
              >
                <Link to={`/products/${p.id}`} className="feat-product-img-wrap">
                  <img src={p.img} alt={p.name} loading="lazy" decoding="async" />
                  {p.featured && <span className="feat-badge">Featured</span>}
                  {/* Hover overlay */}
                  <div className="feat-product-overlay">
                    <span className="feat-overlay-btn">
                      <Eye size={16} /> Quick View
                    </span>
                  </div>
                </Link>

                <div className="feat-product-info">
                  <Link to={`/products/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="feat-product-name">{p.name}</h3>
                  </Link>
                  {p.length && <p className="feat-product-length">{p.length}</p>}
                  <div className="feat-product-footer">
                    <span className="feat-product-price">₦{Number(p.price).toLocaleString()}</span>
                    <Link to={`/products/${p.id}`} className="feat-product-btn">
                      View
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-fg)' }}>
            <p>No featured products found.</p>
            <a href="/products" className="buy-once-btn" style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>Browse All Products</a>
          </div>
        )}
      </section>

      {/* FLEXIBLE PAYMENTS SECTION */}
      <section style={{ margin: '2rem 0', padding: '5rem 1rem', background: 'linear-gradient(135deg, hsl(340 100% 97%) 0%, hsl(260 100% 97%) 100%)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '3px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Flexible Payments</span>
          <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', fontFamily: 'var(--font-display)', marginBottom: '1.25rem', lineHeight: 1.2 }}>Pay in Installments</h2>
          <p style={{ color: 'var(--muted-fg)', fontSize: '1.05rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Get the hair you love now and pay over time. Choose from 2 to 6 month flexible payment plans with 0% interest on 2-month plans.
          </p>
          <a href="/products" className="buy-once-btn" style={{ display: 'inline-flex', fontSize: '1rem', padding: '0.85rem 2.5rem', height: 'auto', borderRadius: '999px', textDecoration: 'none' }}>
            Start Shopping
          </a>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="values-section">
        <div className="container values-grid">
          <div className="value-item">
            <Star size={32} />
            <h3>Premium Grade</h3>
            <p>Sourced from the finest donors. Double drawn, full to the ends, and built to last years with proper care.</p>
          </div>
          <div className="value-item">
            <ShieldCheck size={32} />
            <h3>Quality Guaranteed</h3>
            <p>Every bundle undergoes a rigorous 5-step quality inspection before it reaches your hands.</p>
          </div>
          <div className="value-item">
            <Heart size={32} />
            <h3>Pay Small Small</h3>
            <p>Can't pay all at once? We offer flexible installment plans up to 6 months to make luxury accessible.</p>
          </div>
        </div>
      </section>

      {/* CATEGORY BANNER */}
      <section className="categories-banner container">
        <a href="/products?cat=Bundles" className="cat-card bundles">
          <div className="overlay" />
          <div className="content">
            <h3>Virgin Bundles</h3>
            <span className="link-text">Shop Now <ArrowRight size={14} /></span>
          </div>
        </a>
        <a href="/products?cat=Wigs" className="cat-card wigs">
          <div className="overlay" />
          <div className="content">
            <h3>Ready to Wear Wigs</h3>
            <span className="link-text">Shop Now <ArrowRight size={14} /></span>
          </div>
        </a>
      </section>

      <Footer />
    </main>
  );
}
