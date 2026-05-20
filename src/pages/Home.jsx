import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Heart, ShoppingBag } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';

export default function Home() {
  const [featured, setFeatured] = useState([]);
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
      }
    };
    fetchFeatured();
  }, []);

  return (
    <main>
      {/* HERO SECTION */}
      <section className="hero-full">
        <div className="hero-full-bg">
          {/* Default to the primary hero image */}
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
              Discover our curated collection of 100% virgin human hair bundles, wigs, closures & frontals.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="/products" className="hero-btn primary">
                Shop Now
              </a>
              <a href="/products?cat=Wigs" className="hero-btn secondary">
                Browse Wigs
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SHOP BY CATEGORY (Pill Buttons) */}
      <section className="container" style={{ padding: '4rem 1rem 1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Shop by Category</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {['Bundles', 'Wigs', 'Closures', 'Frontals'].map(cat => (
            <a 
              key={cat} 
              href={`/products?cat=${cat}`}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'var(--card-bg)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--foreground)'; e.currentTarget.style.color = 'var(--background)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.color = 'var(--foreground)'; }}
            >
              {cat}
            </a>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS (now dynamic) */}
      {featured.length > 0 && (
        <section className="featured-section container" style={{ paddingTop: '4rem' }}>
          <div className="feat-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold', color: 'var(--muted-fg)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CURATED SELECTION</span>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Featured Products</h2>
            <a href="/products" className="view-all" style={{ textDecoration: 'none', color: 'var(--foreground)', borderBottom: '1px solid var(--foreground)', paddingBottom: '2px' }}>View All →</a>
          </div>
          <div className="products-grid">
            {featured.map((p, i) => (
              <motion.div
                key={p.id}
                className="product-card"
                onClick={() => navigate(`/products/${p.id}`)}
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link to={`/products/${p.id}`} onClick={e => e.stopPropagation()} className="img-wrap">
                  <img src={p.img} alt={p.name} loading="lazy" />
                  {p.featured && <span className="feat-badge">Featured</span>}
                </Link>

                <div className="info">
                  <Link to={`/products/${p.id}`} onClick={e => e.stopPropagation()}>
                    <h3>{p.name}</h3>
                  </Link>
                  {p.length && <p className="feat-length">{p.length}</p>}
                  <div className="price">₦{Number(p.price).toLocaleString()}</div>

                  <div className="card-actions">
                    <button 
                      className="pss-btn" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}
                    >Pay Small Small</button>
                    <button 
                      className="buy-once-btn" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}
                    >
                      <ShoppingBag size={14} /> Buy Once
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* FLEXIBLE PAYMENTS SECTION */}
      <section style={{ margin: '6rem 0', padding: '6rem 1rem', background: 'linear-gradient(135deg, hsl(340 100% 98%) 0%, hsl(260 100% 98%) 100%)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <span style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>FLEXIBLE PAYMENTS</span>
          <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem', lineHeight: 1.2 }}>Pay in Installments</h2>
          <p style={{ color: 'var(--muted-fg)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Get the hair you love now and pay over time. Choose from 2 to 6 month flexible payment plans with 0% interest on 2-month plans.
          </p>
          <a href="/products" className="hero-btn primary" style={{ display: 'inline-flex', background: 'var(--primary)', color: 'white', padding: '1rem 2.5rem', borderRadius: '999px', textDecoration: 'none', fontWeight: '600', fontSize: '1.1rem', transition: 'opacity 0.3s' }}>
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
            <p>Can't pay all at once? We offer flexible installment plans up to 30 days to make luxury accessible.</p>
          </div>
        </div>
      </section>

      {/* CATEGORY BANNER */}
      <section className="categories-banner container">
        <a href="/products?cat=Bundles" className="cat-card bundles">
          <div className="overlay" />
          <div className="content">
            <h3>Virgin Bundles</h3>
            <span className="link-text">Shop Now <ArrowRight size={14}/></span>
          </div>
        </a>
        <a href="/products?cat=Wigs" className="cat-card wigs">
          <div className="overlay" />
          <div className="content">
            <h3>Ready to Wear Wigs</h3>
            <span className="link-text">Shop Now <ArrowRight size={14}/></span>
          </div>
        </a>
      </section>

      <Footer />
    </main>
  );
}
