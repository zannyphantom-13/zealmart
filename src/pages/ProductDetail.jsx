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
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');

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
  
  const totalPeriods = paymentFrequency === 'weekly' ? installments * 4 : installments;
  const periodPayment = total / totalPeriods;
  const interestAmt = total - price;

  const handleBuyOnce = () => {
    addToCart(product, 1, 'full', 1, price);
    navigate('/cart');
  };

  const handleInstallment = () => {
    addToCart(product, 1, 'installment', installments, periodPayment, paymentFrequency);
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="pd-select-label">Duration (Months)</label>
                      <div style={{ display: 'flex', background: 'var(--muted)', borderRadius: '999px', padding: '0.2rem' }}>
                        <button
                          className={`pss-btn ${paymentFrequency === 'monthly' ? 'active' : ''}`}
                          style={{ border: 'none', background: paymentFrequency === 'monthly' ? 'white' : 'transparent', boxShadow: paymentFrequency === 'monthly' ? 'var(--shadow-card)' : 'none', padding: '0.3rem 0.8rem', borderRadius: '999px', transition: 'all 0.2s' }}
                          onClick={() => setPaymentFrequency('monthly')}
                        >
                          Monthly
                        </button>
                        <button
                          className={`pss-btn ${paymentFrequency === 'weekly' ? 'active' : ''}`}
                          style={{ border: 'none', background: paymentFrequency === 'weekly' ? 'white' : 'transparent', boxShadow: paymentFrequency === 'weekly' ? 'var(--shadow-card)' : 'none', padding: '0.3rem 0.8rem', borderRadius: '999px', transition: 'all 0.2s' }}
                          onClick={() => setPaymentFrequency('weekly')}
                        >
                          Weekly
                        </button>
                      </div>
                    </div>
                    <div className="pd-installment-pills" style={{ marginTop: '0.5rem' }}>
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
                      <span>{paymentFrequency === 'monthly' ? 'Monthly payment' : 'Weekly payment'}</span>
                      <span className="pd-monthly-amt">{fmt(periodPayment)} / {paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span>
                    </div>
                    <p className="pd-inst-note">
                      × {totalPeriods} {paymentFrequency} payments of {fmt(periodPayment)}{' '}
                      {interestAmt > 0 ? `(includes ${INTEREST[installments]}% interest)` : '(0% interest)'}
                    </p>
                  </div>
                  
                  <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--muted-fg)', lineHeight: '1.4' }}>
                    <strong style={{ color: 'var(--foreground)' }}>How multi-item orders work:</strong> Items with the exact same payment plan are processed together. If you mix items with different installment durations or frequencies (e.g. 4 Weeks vs 5 Weeks), you will be asked to either merge them into one plan or check out as separate orders.
                  </div>

                  <button className="pd-installment-btn" style={{ width: '100%', height: '3rem', background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', marginTop: '1rem' }} onClick={handleInstallment}>
                    Start {paymentFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Plan — {fmt(periodPayment)}/{paymentFrequency === 'weekly' ? 'wk' : 'mo'}
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
