import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import { Package, Clock, CheckCircle, ShoppingBag, Search, Filter, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [customAmounts, setCustomAmounts] = useState({});

  // Filtering, Sorting & Collapse State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Orders');
  const [sortBy, setSortBy] = useState('Date (Newest First)');
  const [expandedOrders, setExpandedOrders] = useState(new Set());

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

  const handleContinuePayment = async (order, amountToPay) => {
    if (!user) return;
    setLoading(true);

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        amountPaid: order.amountPaid + amountToPay,
        status: (order.amountPaid + amountToPay >= order.totalAmount) ? 'Completed' : 'Processing (Installments)'
      });
      
      setOrders(orders.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            amountPaid: o.amountPaid + amountToPay,
            status: (o.amountPaid + amountToPay >= o.totalAmount) ? 'Completed' : 'Processing (Installments)'
          };
        }
        return o;
      }));
      
      toast.success('Payment recorded successfully!');
      
      setCustomAmounts(prev => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Payment successful but failed to update order record.");
    } finally {
      setLoading(false);
    }
  };

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

  const toggleOrderExpand = (id) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'Completed' && o.status !== 'Completed') return false;
    if (statusFilter === 'Processing (Installments)' && o.status === 'Completed') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (o.id.toLowerCase().includes(term)) return true;
      if (o.items?.some(i => i.name.toLowerCase().includes(term))) return true;
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Date (Newest First)') return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    if (sortBy === 'Date (Oldest First)') return a.createdAt?.toMillis() - b.createdAt?.toMillis();
    if (sortBy === 'Total Amount (High to Low)') return b.totalAmount - a.totalAmount;
    if (sortBy === 'Total Amount (Low to High)') return a.totalAmount - b.totalAmount;
    return 0;
  });

  return (
    <main>
      <div className="container" style={{ padding: '4rem 1rem 4rem', minHeight: '60vh' }}>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>My Account</h1>
        <p style={{ textAlign: 'center', color: 'var(--muted-fg)', marginBottom: '3rem', fontSize: '0.95rem' }}>
          Welcome back{profileData ? `, ${profileData.firstName}` : ''}!
        </p>

        {error && <div style={{ color: 'red', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

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

          {!isAdmin && (
            <div style={{ background: 'var(--card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                Order History &amp; Payment Tracking
              </h2>
              {orders.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.6rem', color: 'var(--muted-fg)' }} />
                    <input
                      type="text"
                      placeholder="Search orders or items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '0.4rem 0.6rem 0.4rem 1.8rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', minWidth: '200px' }}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', background: 'var(--card-bg)' }}
                  >
                    <option>All Orders</option>
                    <option>Completed</option>
                    <option>Processing (Installments)</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <SlidersHorizontal size={14} style={{ color: 'var(--muted-fg)' }} />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem', background: 'var(--card-bg)' }}
                    >
                      <option>Date (Newest First)</option>
                      <option>Date (Oldest First)</option>
                      <option>Total Amount (High to Low)</option>
                      <option>Total Amount (Low to High)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <ShoppingBag size={48} color="var(--muted-fg)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--muted-fg)', marginBottom: '1.25rem' }}>You haven't placed any orders yet.</p>
                <Link to="/products" className="buy-once-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredOrders.map(order => {
                  const pct = Math.min(100, Math.round((order.amountPaid / order.totalAmount) * 100));
                  const isComplete = order.amountPaid >= order.totalAmount;
                  
                  const combinedPeriodPayment = order.items?.reduce((acc, i) => acc + (i.paymentChoice === 'installment' ? (i.periodPayment || i.monthlyPayment) * i.quantity : 0), 0) || 0;
                  const isWeekly = order.items?.some(i => i.paymentFrequency === 'weekly');
                  const maxPeriods = Math.max(...(order.items?.map(i => i.paymentChoice === 'installment' ? (isWeekly ? i.installments * 4 : i.installments) : 0) || [0]));
                  
                  // Calculate how much of the paid amount was for installments vs full payments
                  const totalFullPayments = order.items?.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : 0), 0) || 0;
                  const amountPaidTowardsInstallments = Math.max(0, order.amountPaid - totalFullPayments);

                  const periodsPaid = combinedPeriodPayment > 0 ? Math.floor(amountPaidTowardsInstallments / combinedPeriodPayment) : 0;
                  const excessPaid = combinedPeriodPayment > 0 ? (amountPaidTowardsInstallments % combinedPeriodPayment) : 0;
                  
                  let nextPaymentDate = null;
                  let timerText = '';
                  let isOverdue = false;

                  if (!isComplete && order.createdAt) {
                    nextPaymentDate = new Date(order.createdAt.toMillis());
                    if (isWeekly) {
                      nextPaymentDate.setDate(nextPaymentDate.getDate() + (periodsPaid + 1) * 7);
                    } else {
                      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + (periodsPaid + 1));
                    }

                    const diffTime = nextPaymentDate.getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      isOverdue = true;
                      timerText = `Overdue by ${Math.abs(diffDays)} days`;
                    } else if (diffDays === 0) {
                      timerText = `Due today!`;
                      isOverdue = true;
                    } else {
                      timerText = `Due in ${diffDays} days`;
                    }
                  }
                  
                  const balance = order.totalAmount - order.amountPaid;
                  
                  let defaultCustomAmount = combinedPeriodPayment;
                  if (excessPaid > 0 && combinedPeriodPayment > 0) {
                    defaultCustomAmount = combinedPeriodPayment - excessPaid;
                  }
                  defaultCustomAmount = Math.min(balance, defaultCustomAmount);
                  
                  const currentCustomAmount = customAmounts[order.id] !== undefined ? customAmounts[order.id] : defaultCustomAmount;

                  return (
                    <div key={order.id} style={{ border: `1px solid ${isComplete ? '#86efac' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--background)' }}>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem 1.25rem', background: isComplete ? '#f0fdf4' : 'var(--muted)', borderBottom: expandedOrders.has(order.id) ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => toggleOrderExpand(order.id)}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', display: 'block' }}>
                            {order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <strong style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{order.id.slice(0, 14)}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: isComplete ? '#dcfce7' : '#fef3c7',
                            color: isComplete ? '#166534' : '#92400e',
                            padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600'
                          }}>
                            {isComplete ? <CheckCircle size={13} /> : <Clock size={13} />}
                            {order.status}
                          </span>
                          <div style={{ background: 'white', padding: '0.3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            {expandedOrders.has(order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>

                      {expandedOrders.has(order.id) && (
                        <>
                          <div style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
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
                                {item.paymentChoice === 'installment' && (item.periodPayment || item.monthlyPayment) ? (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)', marginTop: '0.2rem' }}>
                                    {fmt((item.periodPayment || item.monthlyPayment) * item.quantity)}/{item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}
                                  </div>
                                ) : item.paymentChoice === 'full' ? (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)', marginTop: '0.2rem', fontWeight: '600', color: 'var(--foreground)' }}>
                                    {fmt(item.price * item.quantity)}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>

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
                              : `${pct}% paid · Balance: ${fmt(balance)}`}
                          </div>
                          {!isComplete && nextPaymentDate && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', textAlign: 'center', marginTop: '0.65rem' }}>
                              Next Payment Due: <strong style={{ color: 'var(--foreground)' }}>{nextPaymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                              <div style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: isOverdue ? '#fee2e2' : '#dcfce7', color: isOverdue ? '#b11a1a' : '#166534', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                                {timerText}
                              </div>
                            </div>
                          )}
                          {!isComplete && (
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <button
                                onClick={() => handleContinuePayment(order, defaultCustomAmount)}
                                disabled={loading}
                                style={{ width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
                              >
                                {loading ? 'Processing...' : `Pay Next Installment (${fmt(defaultCustomAmount)})`}
                              </button>
                              
                              <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />

                              <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted-fg)', marginBottom: '0.35rem', display: 'block' }}>Custom Payment Amount (₦):</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input
                                    type="number"
                                    value={currentCustomAmount}
                                    onChange={(e) => setCustomAmounts(prev => ({ ...prev, [order.id]: Number(e.target.value) }))}
                                    max={balance}
                                    min={1}
                                    style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', outline: 'none', minWidth: 0 }}
                                  />
                                  <button
                                    onClick={() => handleContinuePayment(order, currentCustomAmount)}
                                    disabled={loading || currentCustomAmount <= 0 || currentCustomAmount > balance}
                                    style={{ padding: '0.6rem 1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', cursor: (loading || currentCustomAmount <= 0 || currentCustomAmount > balance) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600', opacity: (loading || currentCustomAmount <= 0 || currentCustomAmount > balance) ? 0.7 : 1 }}
                                  >
                                    Custom Pay
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {combinedPeriodPayment > 0 && (
                        <div style={{ padding: '0 1.25rem 1.25rem' }}>
                          <div style={{ background: 'var(--muted)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <div style={{ padding: '0.75rem 1rem', background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-fg)' }}>
                                Payment Schedule — {maxPeriods} {isWeekly ? 'Weeks' : 'Months'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)' }}>
                                {periodsPaid} of {maxPeriods} paid · {fmt(combinedPeriodPayment)}/{isWeekly ? 'wk' : 'mo'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {Array.from({ length: maxPeriods }).map((_, idx) => {
                                const periodNum = idx + 1;
                                let status = 'unpaid';
                                if (periodsPaid >= periodNum) status = 'paid';
                                else if (periodsPaid + 1 === periodNum && excessPaid > 0) status = 'partial';

                                let periodDate = null;
                                if (order.createdAt) {
                                  periodDate = new Date(order.createdAt.toMillis());
                                  if (isWeekly) periodDate.setDate(periodDate.getDate() + periodNum * 7);
                                  else periodDate.setMonth(periodDate.getMonth() + periodNum);
                                }

                                const rowBg = status === 'paid' ? '#f0fdf4' : status === 'partial' ? '#fffbeb' : 'transparent';
                                const dotColor = status === 'paid' ? '#22c55e' : status === 'partial' ? '#f59e0b' : '#cbd5e1';
                                const statusLabel = status === 'paid' ? '✓ Paid' : status === 'partial' ? '⏳ Partial' : '○ Pending';
                                const statusColor = status === 'paid' ? '#166534' : status === 'partial' ? '#92400e' : 'var(--muted-fg)';

                                return (
                                  <div key={idx} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2rem 1fr auto auto',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.6rem 1rem',
                                    background: rowBg,
                                    borderBottom: idx < maxPeriods - 1 ? '1px solid var(--border)' : 'none',
                                  }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', color: status === 'unpaid' ? '#94a3b8' : 'white', flexShrink: 0 }}>
                                      {periodNum}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                        {isWeekly ? 'Week' : 'Month'} {periodNum}
                                        {status === 'partial' && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#92400e', fontWeight: 'normal' }}>— remaining: {fmt(combinedPeriodPayment - excessPaid)}</span>}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--muted-fg)' }}>
                                        Due: {periodDate ? periodDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: '600' }}>
                                      {status === 'paid' ? fmt(combinedPeriodPayment) : status === 'partial' ? <span style={{ color: '#92400e' }}>{fmt(excessPaid)} <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>of {fmt(combinedPeriodPayment)}</span></span> : fmt(combinedPeriodPayment)}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: statusColor, minWidth: '56px', textAlign: 'right' }}>
                                      {statusLabel}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      </>
                    )}
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
