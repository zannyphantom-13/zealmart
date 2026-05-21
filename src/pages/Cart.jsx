import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, _hydrated, removeFromCart, updateQuantity, getInitialPaymentTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    city: '',
    state: '',
    phone: '',
    instructions: ''
  });

  // Load Korapay SDK on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Wait for Zustand to hydrate from localStorage before rendering empty cart
  if (!_hydrated) {
    return (
      <main>
        <div className="container" style={{ padding: '6rem 1rem 4rem', minHeight: '60vh', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Your Cart</h1>
          <p style={{ color: 'var(--muted-fg)' }}>Loading cart...</p>
        </div>
        <Footer />
      </main>
    );
  }

  const totalToPayNow = getInitialPaymentTotal();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (items.length === 0) return;
    setLoading(true);
    setError('');

    if (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.state || !deliveryInfo.phone) {
      toast.error('Please fill out all required delivery fields.');
      setError('Please fill out all required delivery fields.');
      setLoading(false);
      return;
    }

    // Korapay Initialization
    try {
      if (window.Korapay) {
        window.Korapay.initialize({
          key: "pk_test_PRPabwReqFtVxH472nitLVfuUbFskvZQBxsmAaiA",
          reference: `JDGH_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          amount: Math.ceil(totalToPayNow),
          currency: "NGN",
          customer: {
            name: user.displayName || "JD Good Hair Customer",
            email: user.email || "customer@jdgoodhair.com",
          },
          onClose: () => {
            setLoading(false);
          },
          onSuccess: async (data) => {
            try {
              // Save Order to Firestore
              await addDoc(collection(db, "orders"), {
                userId: user.uid,
                items: items,
                deliveryInfo: deliveryInfo,
                totalAmount: items.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : (i.price * (1 + (i.installments === 3 || i.installments === 4 ? 0.1 : i.installments > 4 ? 0.2 : 0))) * i.quantity), 0),
                amountPaid: totalToPayNow,
                status: 'Processing',
                paymentRef: data.reference || data.transaction_reference,
                createdAt: new Date(),
              });
              clearCart();
              toast.success('Order placed successfully!');
              navigate('/profile'); // Redirect to profile to see order
            } catch (err) {
              console.error("Error saving order:", err);
              setError("Payment successful but failed to save order. Please contact support.");
            } finally {
              setLoading(false);
            }
          },
          onFailed: () => {
            setError("Payment failed. Please try again.");
            setLoading(false);
          }
        });
      } else {
        setError("Payment gateway is loading. Please refresh and try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error initializing payment:", err);
      setError("Failed to start payment. Please check your network and try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main>
        <div className="container" style={{ padding: '6rem 1rem 4rem', minHeight: '60vh', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Your Cart</h1>
          <div style={{ padding: '4rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--muted-fg)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Your shopping bag is empty.</p>
            <Link to="/products" className="buy-once-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>Continue Shopping</Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <div className="container" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-fg)', marginBottom: '2rem', textDecoration: 'none', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Shopping Bag</h1>

        {error && <div style={{ color: 'red', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', lg: { gridTemplateColumns: '2fr 1fr' } }}>

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {items.map((item) => (
              <div key={item.cartItemId} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <img src={item.img} alt={item.name} loading="lazy" decoding="async" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{item.name}</h3>
                      <p style={{ color: 'var(--muted-fg)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Length: {item.length}</p>

                      {item.paymentChoice === 'installment' ? (
                        <div style={{ display: 'inline-block', background: 'var(--muted)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                          Installment: {item.paymentFrequency === 'weekly' ? item.installments * 4 + ' Weeks' : item.installments + ' Months'}
                        </div>
                      ) : (
                        <div style={{ display: 'inline-block', background: 'hsl(340 100% 95%)', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                          Full Payment
                        </div>
                      )}
                    </div>

                    <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }} aria-label="Remove item">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem' }}>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} style={{ background: 'none', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                      <span style={{ fontWeight: '500' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} style={{ background: 'none', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {item.paymentChoice === 'installment' ? (
                        <>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{fmt((item.periodPayment || item.monthlyPayment || 0) * item.quantity)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted-fg)' }}>/ {item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span></div>
                        </>
                      ) : (
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{fmt(item.price * item.quantity)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Delivery Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" placeholder="Full Address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="text" placeholder="City" value={deliveryInfo.city} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })} style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                  <input type="text" placeholder="State" value={deliveryInfo.state} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })} style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                </div>
                <input type="tel" placeholder="Phone Number" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                <textarea placeholder="Additional Instructions (Optional)" value={deliveryInfo.instructions} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', minHeight: '80px' }}></textarea>
              </div>

              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Order Summary</h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--muted-fg)' }}>
                <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span>{fmt(totalToPayNow)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--muted-fg)' }}>
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1.5rem 0', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)', fontSize: '1.25rem', fontWeight: '700' }}>
                <span>Total Due Today</span>
                <span>{fmt(totalToPayNow)}</span>
              </div>

              {!user && (
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  You must be logged in to checkout.
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                <CreditCard size={20} />
                {loading ? 'Processing...' : 'Confirm Order'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted-fg)' }}>
                Secure checkout powered by Korapay.
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
}
