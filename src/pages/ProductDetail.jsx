import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ChevronDown } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';
import useCartStore from '../store/useCartStore';

const INTEREST = { 2: 0, 3: 10, 4: 10, 5: 20, 6: 20 };

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInstallment, setShowInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main>
        <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--primary)' }}>
          Loading Product Details...
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main>
        <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>{error || 'Product Not Found'}</h2>
          <Link to="/products" className="pd-back-link">← Back to Shop</Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Installment calculations
  const price = Number(product.price);
  const rate        = INTEREST[installments] / 100;
  const total       = price * (1 + rate);
  const monthly     = total / installments;
  const interestAmt = total - price;

  const handleBuyOnce = () => {
    addToCart(product, 1, 'full', 1, price);
    navigate('/cart');
  };

  const handleInstallment = () => {
    addToCart(product, 1, 'installment', installments, monthly);
    navigate('/cart');
  };

  return (
    <main>
      <div className="container pd-container">
        <Link to="/products" className="pd-back-link">
          <ArrowLeft size={16} /> Back to Products
        </Link>

        <div className="pd-layout">
          {/* Image */}
          <div className="pd-image-col">
            <div className="pd-img-wrap">
              <img src={product.img} alt={product.name} loading="lazy" decoding="async" />
              {product.featured && <span className="feat-badge">Featured</span>}
            </div>
          </div>

          {/* Info */}
          <div className="pd-info-col">
            <p className="pd-category">{product.category}</p>
            <h1 className="pd-title">{product.name}</h1>
            <span className="pd-length-badge">{product.length}</span>

            {/* Pricing card */}
            <div className="pd-pricing-card">
              <p className="pd-price-label">Full Payment</p>
              <p className="pd-price">{fmt(price)}</p>
              <p className="pd-pss-note" style={{ marginTop: '0.5rem' }}>
                Delivery is only made after full payment is completed.
              </p>
            </div>

            {/* Installment panel */}
            <div className="pd-installment-section">
              <button
                className="pd-installment-toggle"
                onClick={() => setShowInstallment(v => !v)}
              >
                Pay in Installments
                <ChevronDown
                  size={16}
                  style={{ transition: 'transform 0.2s', transform: showInstallment ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {showInstallment && (
                <div className="pd-installment-panel">
                  {/* Installment count selector */}
                  <div className="pd-select-group">
                    <label className="pd-select-label">Number of Monthly Installments</label>
                    <div className="pd-installment-pills">
                      {[2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          className={`pd-inst-pill${installments === n ? ' active' : ''}`}
                          onClick={() => setInstallments(n)}
                        >
                          {n}×
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="pd-breakdown">
                    <div className="pd-breakdown-row">
                      <span>Interest rate</span>
                      <span className={INTEREST[installments] > 0 ? 'pd-highlight' : 'pd-zero'}>
                        {INTEREST[installments]}%
                        {INTEREST[installments] === 0 && ' 🎉'}
                      </span>
                    </div>
                    {interestAmt > 0 && (
                      <div className="pd-breakdown-row">
                        <span>Interest added</span>
                        <span className="pd-highlight">{fmt(interestAmt)}</span>
                      </div>
                    )}
                    <div className="pd-breakdown-row">
                      <span>Total to pay</span>
                      <span><strong>{fmt(total)}</strong></span>
                    </div>
                    <div className="pd-breakdown-row pd-monthly-row">
                      <span>Monthly payment</span>
                      <span className="pd-monthly-amt">{fmt(monthly)} / month</span>
                    </div>
                    <p className="pd-inst-note">
                      × {installments} monthly payments of {fmt(monthly)}{' '}
                      {interestAmt > 0 ? `(includes ${INTEREST[installments]}% interest)` : '(0% interest)'}
                    </p>
                  </div>

                  <button className="pd-installment-btn" onClick={handleInstallment}>
                    Start Installment Plan — {fmt(monthly)}/mo
                  </button>
                </div>
              )}
            </div>

            {/* Buy once button */}
            <button className="pd-buy-btn" onClick={handleBuyOnce}>
              <ShoppingBag size={18} />
              Buy Once — {fmt(price)}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
