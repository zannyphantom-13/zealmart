import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Package, CheckCircle, Clock, Bell, Users, AlertCircle, Search, Filter, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newlyCompleted, setNewlyCompleted] = useState(new Set());
  const [userCache, setUserCache] = useState({});

  const fetchOrders = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(ordersData);

      // Fetch user info for each unique userId
      const uniqueUserIds = [...new Set(ordersData.map(o => o.userId).filter(Boolean))];
      const cache = {};
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          try {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              cache[uid] = userSnap.data();
            }
          } catch {
            // silently skip if user doc missing
          }
        })
      );
      setUserCache(cache);
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('offline')) {
        setError("Please check your internet connection and try again.");
      } else {
        setError("Failed to fetch orders");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const handleUpdateAmountPaid = async (orderId, newAmount, totalAmount) => {
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates = { amountPaid: Number(newAmount) };

      const wasComplete = Number(newAmount) >= totalAmount;
      if (wasComplete) {
        updates.status = 'Completed';
        setNewlyCompleted(prev => new Set([...prev, orderId]));
      } else if (Number(newAmount) > 0) {
        updates.status = 'Processing (Installments)';
      }

      await updateDoc(orderRef, updates);
      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updates } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update payment amount");
    } finally {
      setUpdating(false);
    }
  };

  // Summary stats
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const pendingOrders = orders.filter(o => o.status !== 'Completed').length;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Orders');
  const [sortBy, setSortBy] = useState('Date (Newest First)');
  const [expandedOrders, setExpandedOrders] = useState(new Set());

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
      const customer = userCache[o.userId];
      if (customer) {
        if (`${customer.firstName} ${customer.lastName}`.toLowerCase().includes(term)) return true;
        if (customer.email?.toLowerCase().includes(term)) return true;
        if (customer.phone?.includes(term)) return true;
      }
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--muted-fg)' }}>
      <Clock size={24} /> Loading orders...
    </div>
  );
  if (error) return <div style={{ color: 'red', padding: '2rem' }}>{error}</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Customer Orders</h1>

      {/* Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Orders', value: totalOrders, icon: <Package size={20} />, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Pending Payment', value: pendingOrders, icon: <AlertCircle size={20} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Completed', value: completedOrders, icon: <CheckCircle size={20} />, color: '#22c55e', bg: '#f0fdf4' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'white', borderRadius: '10px', padding: '1.25rem',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <div style={{ background: stat.bg, color: stat.color, padding: '0.6rem', borderRadius: '8px' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', marginBottom: '0.2rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--foreground)' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Newly completed notifications */}
      {newlyCompleted.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#dcfce7', border: '1px solid #86efac',
          borderRadius: '10px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
          color: '#166534', fontWeight: '500'
        }}>
          <Bell size={20} />
          🎉 {newlyCompleted.size} order{newlyCompleted.size > 1 ? 's' : ''} just marked as fully paid and ready to ship!
        </div>
      )}

      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted-fg)' }} />
            <input
              type="text"
              placeholder="Search by Order ID, Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--card-bg)' }}
          >
            <option>All Orders</option>
            <option>Completed</option>
            <option>Processing (Installments)</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--muted-fg)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--card-bg)' }}
            >
              <option>Date (Newest First)</option>
              <option>Date (Oldest First)</option>
              <option>Total Amount (High to Low)</option>
              <option>Total Amount (Low to High)</option>
            </select>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div style={{ padding: '3rem', background: 'white', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <Package size={48} color="var(--muted-fg)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--muted-fg)' }}>No orders match your criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredOrders.map((order) => {
            const customer = userCache[order.userId];
            const isNewlyComplete = newlyCompleted.has(order.id);

            const isComplete = order.amountPaid >= order.totalAmount;
            const combinedPeriodPayment = order.items?.reduce((acc, i) => acc + (i.paymentChoice === 'installment' ? (i.periodPayment || i.monthlyPayment) * i.quantity : 0), 0) || 0;
            const isWeekly = order.items?.some(i => i.paymentFrequency === 'weekly');
            const periodsPaid = combinedPeriodPayment > 0 ? Math.floor(order.amountPaid / combinedPeriodPayment) : 0;
            const excessPaid = combinedPeriodPayment > 0 ? (order.amountPaid % combinedPeriodPayment) : 0;
            
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

            return (
              <div key={order.id} style={{
                background: 'white', borderRadius: '12px',
                border: `1px solid ${isNewlyComplete ? '#86efac' : 'var(--border)'}`,
                overflow: 'hidden',
                boxShadow: isNewlyComplete ? '0 0 0 3px #bbf7d0' : 'none'
              }}>
                {/* Payment complete banner */}
                {isNewlyComplete && (
                  <div style={{ background: '#dcfce7', color: '#166534', padding: '0.6rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={14} /> Payment complete — ready to ship!
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: 'var(--muted)', borderBottom: expandedOrders.has(order.id) ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => toggleOrderExpand(order.id)}>
                  <div style={{ flex: '1 1 100px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', display: 'block' }}>Order ID</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>#{order.id}</strong>
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', display: 'block' }}>Date</span>
                    <strong>{order.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  {/* Customer info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 200px' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '600', flexShrink: 0 }}>
                      {customer ? customer.firstName?.[0]?.toUpperCase() : <Users size={14} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                        {customer ? `${customer.firstName} ${customer.lastName}` : 'Customer'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', wordBreak: 'break-all' }}>
                        {customer?.email || order.userId}
                      </div>
                      {customer?.phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', wordBreak: 'break-word' }}>
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 100px', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', display: 'block' }}>Status</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          background: order.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                          color: order.status === 'Completed' ? '#166534' : '#92400e',
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600'
                        }}>
                          {order.status === 'Completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {order.status}
                        </span>
                      </div>
                      <div style={{ background: 'white', padding: '0.3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        {expandedOrders.has(order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                {/* Body */}
                {expandedOrders.has(order.id) && (
                  <div style={{ padding: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Items */}
                  <div style={{ flex: '1 1 100%' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Ordered</h3>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <img src={item.img} alt={item.name} loading="lazy" decoding="async" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name} <span style={{ color: 'var(--muted-fg)', fontWeight: 'normal' }}>×{item.quantity}</span></div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)' }}>Length: {item.length}</div>
                          <div style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.72rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '4px', background: item.paymentChoice === 'installment' ? 'hsl(210 100% 95%)' : 'hsl(340 100% 95%)', color: item.paymentChoice === 'installment' ? '#1d4ed8' : 'var(--primary)' }}>
                            {item.paymentChoice === 'installment' ? `${item.paymentFrequency === 'weekly' ? item.installments * 4 + ' Weekly Payments' : item.installments + ' Monthly Payments'}` : 'Full Payment'}
                          </div>
                          {item.paymentChoice === 'installment' && (item.periodPayment || item.monthlyPayment) ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', marginTop: '0.25rem' }}>
                              {fmt((item.periodPayment || item.monthlyPayment) * item.quantity)}/{item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}
                            </div>
                          ) : item.paymentChoice === 'full' ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', marginTop: '0.25rem', fontWeight: '600', color: 'var(--foreground)' }}>
                              {fmt(item.price * item.quantity)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Info */}
                  {order.deliveryInfo && (
                    <div style={{ flex: '1 1 100%', minWidth: '200px', background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Info</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: '1.6' }}>
                        <p style={{ fontWeight: '600' }}>{order.deliveryInfo.address}</p>
                        <p>{order.deliveryInfo.city}, {order.deliveryInfo.state}</p>
                        <p style={{ marginTop: '0.5rem' }}>📞 {order.deliveryInfo.phone}</p>
                        {order.deliveryInfo.instructions && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--muted)', borderRadius: '6px', color: 'var(--muted-fg)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                            {order.deliveryInfo.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Tracker */}
                  <div style={{ flex: '1 1 100%', minWidth: '260px', background: 'var(--muted)', padding: '1.25rem', borderRadius: '10px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Tracker</h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--muted-fg)' }}>Total Required:</span>
                      <strong>{fmt(order.totalAmount)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--muted-fg)' }}>Amount Paid:</span>
                      <input
                        type="number"
                        defaultValue={order.amountPaid}
                        onBlur={(e) => {
                          if (e.target.value !== String(order.amountPaid)) {
                            handleUpdateAmountPaid(order.id, e.target.value, order.totalAmount);
                          }
                        }}
                        disabled={updating}
                        style={{
                          padding: '0.4rem 0.75rem', width: '130px', borderRadius: '6px',
                          border: '1px solid var(--border)', textAlign: 'right',
                          fontWeight: 'bold', color: 'var(--primary)', background: 'white',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    
                    {!isComplete && nextPaymentDate && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', textAlign: 'center', marginBottom: '0.75rem', background: '#eff6ff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                        Next Payment Due: <strong style={{ color: '#1d4ed8' }}>{nextPaymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        <div style={{ display: 'inline-block', padding: '0.15rem 0.4rem', background: isOverdue ? '#fee2e2' : '#dcfce7', color: isOverdue ? '#b11a1a' : '#166534', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                          {timerText}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: '600' }}>Expected Amount: {fmt(defaultCustomAmount)}</div>
                        {excessPaid > 0 && <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '0.15rem' }}>(Customer already paid {fmt(excessPaid)} towards this period)</div>}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div style={{ width: '100%', background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.35rem' }}>
                      <div style={{
                        height: '100%',
                        background: order.amountPaid >= order.totalAmount ? '#22c55e' : 'var(--primary)',
                        width: `${Math.min(100, (order.amountPaid / order.totalAmount) * 100)}%`,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', textAlign: 'center', marginBottom: '0.75rem' }}>
                      {Math.round((order.amountPaid / order.totalAmount) * 100)}% paid
                      {order.amountPaid < order.totalAmount && (
                        <span> · Balance: <strong style={{ color: 'var(--foreground)' }}>{fmt(order.totalAmount - order.amountPaid)}</strong></span>
                      )}
                    </div>

                    {order.amountPaid >= order.totalAmount && (
                      <div style={{ background: '#dcfce7', color: '#166534', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontWeight: '600' }}>
                        <CheckCircle size={16} /> Payment Complete — Ready to Ship!
                      </div>
                    )}

                    {order.paymentRef && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted-fg)', wordBreak: 'break-all' }}>
                        Ref: {order.paymentRef}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
