import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import { Package, Clock, CheckCircle, ShoppingBag } from 'lucide-react';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

function PaymentBadge({ paymentChoice, installments, paymentFrequency }) {
  const isInstallment = paymentChoice === 'installment';
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.72rem', fontWeight: '600',
      padding: '0.2rem 0.6rem', borderRadius: '4px',
      background: isInstallment ? 'hsl(210 100% 93%)' : 'hsl(340 100% 93%)',
      color: isInstallment ? '#1d4ed8' : 'var(--primary)',
    }}>
      {isInstallment ? `${paymentFrequency === 'weekly' ? installments * 4 + ' Weekly Payments' : installments + ' Monthly Payments'}` : 'Full Payment'}
    </span>
  );
}

export default function Profile() {
  const { user, isAdmin, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProfileData(docSnap.data());

        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const orderSnap = await getDocs(q);
        const ordersData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        ordersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setOrders(ordersData);
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('offline')) {
          setError('Please check your internet connection and try again.');
        } else {
          setError('We encountered an issue loading your profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <main>
        <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--muted-fg)' }}>
          <Clock size={32} style={{ margin: '0 auto 1rem' }} />
          <h2>Loading Profile...</h2>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const totalSpent = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const pendingBalance = orders.reduce((sum, o) => sum + Math.max(0, (o.totalAmount || 0) - (o.amountPaid || 0)), 0);

  return (
    <main>
      <div className="container" style={{ padding: '4rem 1rem 4rem', minHeight: '60vh' }}>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>My Account</h1>
        <p style={{ textAlign: 'center', color: 'var(--muted-fg)', marginBottom: '3rem', fontSize: '0.95rem' }}>
          Welcome back{profileData ? `, ${profileData.firstName}` : ''}!
        </p>

        {error && <div style={{ color: 'red', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Quick Stats - Hide for Admin */}
          {!isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Orders', value: orders.length, icon: <Package size={20} />, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Amount Paid', value: fmt(totalSpent), icon: <CheckCircle size={20} />, color: '#22c55e', bg: '#f0fdf4' },
                { label: 'Pending Balance', value: fmt(pendingBalance), icon: <Clock size={20} />, color: pendingBalance > 0 ? '#f59e0b' : '#22c55e', bg: pendingBalance > 0 ? '#fffbeb' : '#f0fdf4' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--card)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: stat.bg, color: stat.color, padding: '0.5rem', borderRadius: '8px', flexShrink: 0 }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)', marginBottom: '0.15rem' }}>{stat.label}</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--foreground)' }}>{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile Details Card */}
          <div style={{ background: 'var(--card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
              Personal Information
            </h2>
            {profileData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                {[
                  { label: 'Full Name', value: `${profileData.firstName || 'Admin'} ${profileData.lastName || ''}` },
                  { label: 'Email Address', value: profileData.email || user.email },
                  { label: 'Phone Number', value: profileData.phone || 'Not provided' },
                  !isAdmin ? { label: 'Account Status', value: profileData.isEmailVerified ? 'Verified ✓' : 'Unverified — check email', special: !profileData.isEmailVerified } : null,
                ].filter(Boolean).map(field => (
                  <div key={field.label}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--muted-fg)', display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>{field.label}</label>
                    <p style={{ fontWeight: '600', color: field.special ? 'orange' : 'var(--foreground)', fontSize: '0.95rem' }}>{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted-fg)' }}>No profile details found.</p>
            )}
          </div>

          {/* Order History - Hide for Admin */}
          {!isAdmin && (
            <div style={{ background: 'var(--card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
              Order History &amp; Payment Tracking
            </h2>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <ShoppingBag size={48} color="var(--muted-fg)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--muted-fg)', marginBottom: '1.25rem' }}>You haven't placed any orders yet.</p>
                <Link to="/products" className="buy-once-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => {
                  const pct = Math.min(100, Math.round((order.amountPaid / order.totalAmount) * 100));
                  const isComplete = order.amountPaid >= order.totalAmount;
                  return (
                    <div key={order.id} style={{ border: `1px solid ${isComplete ? '#86efac' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--background)' }}>

                      {/* Order header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem 1.25rem', background: isComplete ? '#f0fdf4' : 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', display: 'block' }}>
                            {order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <strong style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{order.id.slice(0, 14)}</strong>
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          background: isComplete ? '#dcfce7' : '#fef3c7',
                          color: isComplete ? '#166534' : '#92400e',
                          padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600'
                        }}>
                          {isComplete ? <CheckCircle size={13} /> : <Clock size={13} />}
                          {order.status}
                        </span>
                      </div>

                      {/* Order body */}
                      <div style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                        {/* Items */}
                        <div style={{ flex: '2 1 260px' }}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              <img src={item.img} alt={item.name} loading="lazy" decoding="async" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{item.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted-fg)', marginBottom: '0.25rem' }}>
                                  Qty: {item.quantity} {item.length && `· Length: ${item.length}`}
                                </div>
                                <PaymentBadge paymentChoice={item.paymentChoice} installments={item.installments} paymentFrequency={item.paymentFrequency} />
                                {item.paymentChoice === 'installment' && (item.periodPayment || item.monthlyPayment) && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)', marginTop: '0.2rem' }}>
                                    {fmt(item.periodPayment || item.monthlyPayment)}/{item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Payment summary */}
                        <div style={{ flex: '1 1 200px', background: 'var(--muted)', padding: '1rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--muted-fg)' }}>Order Total:</span>
                            <strong>{fmt(order.totalAmount)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--muted-fg)' }}>Paid So Far:</span>
                            <strong style={{ color: 'var(--primary)' }}>{fmt(order.amountPaid)}</strong>
                          </div>
                          <div style={{ width: '100%', background: '#e5e7eb', height: '6px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                            <div style={{ height: '100%', background: isComplete ? '#22c55e' : 'var(--primary)', width: `${pct}%`, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)', textAlign: 'center' }}>
                            {isComplete
                              ? '✅ Fully paid — preparing shipment!'
                              : `${pct}% paid · Balance: ${fmt(order.totalAmount - order.amountPaid)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

        </div>
      </div>
      <Footer />
    </main>
  );
}
