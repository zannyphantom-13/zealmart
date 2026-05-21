import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';

const CATEGORIES = ['All', 'Bundles', 'Wigs', 'Closures', 'Frontals'];

function pathToCategory(pathname) {
  if (pathname.includes('bundles')) return 'Bundles';
  if (pathname.includes('wigs'))    return 'Wigs';
  return null;
}

export default function Shop() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const urlCat =
    searchParams.get('category') ||
    searchParams.get('cat') ||
    pathToCategory(location.pathname);

  const initial = CATEGORIES.find(
    c => c.toLowerCase() === (urlCat || '').toLowerCase()
  ) || 'All';

  const [active, setActive] = useState(initial);
  const [search, setSearch] = useState('');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Sync category state with URL
  useEffect(() => {
    const cat =
      searchParams.get('category') ||
      searchParams.get('cat') ||
      pathToCategory(location.pathname);
    const match = CATEGORIES.find(c => c.toLowerCase() === (cat || '').toLowerCase());
    setActive(match || 'All');
  }, [location.search, location.pathname]);

  const filtered = products.filter(p => {
    const matchCat    = active === 'All' || p.category === active;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <h1>JD Good Hair</h1>
          <p className="tagline">Luxury for Less</p>
          <p>Shop premium hair and enjoy flexible "Pay Small Small" options.</p>
        </div>
      </div>

      <div className="container">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search hair bundles, wigs, closures..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`pill${active === cat ? ' active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--primary)' }}>Loading products...</div>
        ) : (
          <div className="products-grid">
            {filtered.length === 0 && (
              <p style={{ color: 'var(--muted-fg)', gridColumn: '1/-1', padding: '2rem 0' }}>
                No products found.
              </p>
            )}
            {filtered.map(p => (
              <div 
                key={p.id} 
                className="product-card" 
                onClick={() => navigate(`/products/${p.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Link to={`/products/${p.id}`} onClick={e => e.stopPropagation()} className="img-wrap">
                  <img src={p.img} alt={p.name} loading="lazy" decoding="async" />
                  {p.featured && <span className="feat-badge">Featured</span>}
                </Link>

                <div className="info">
                  <Link to={`/products/${p.id}`} onClick={e => e.stopPropagation()}>
                    <h3>{p.name}</h3>
                  </Link>
                  <p className="feat-length">{p.length}</p>
                  <div className="price">₦{Number(p.price).toLocaleString()}</div>

                  <div className="card-actions">
                    <button 
                      className="pss-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}
                    >
                      Pay Small Small
                    </button>
                    <button 
                      className="buy-once-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}
                    >
                      <ShoppingBag size={14} />
                      Buy Once
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


      </div>

      <Footer />
    </main>
  );
}
