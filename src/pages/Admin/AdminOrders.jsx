import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Package, CheckCircle, Clock } from 'lucide-react';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAmountPaid = async (orderId, newAmount, totalAmount) => {
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      const updates = { amountPaid: Number(newAmount) };
      
      // Auto-update status if fully paid
      if (Number(newAmount) >= totalAmount) {
        updates.status = 'Completed';
      } else if (Number(newAmount) > 0) {
        updates.status = 'Processing (Installments)';
      }
      
      await updateDoc(orderRef, updates);
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updates } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update payment amount");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Customer Orders</h1>
      
      {orders.length === 0 ? (
        <div style={{ padding: '3rem', background: 'white', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <Package size={48} color="var(--muted-fg)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--muted-fg)' }}>No orders have been placed yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block' }}>Order ID</span>
                  <strong style={{ fontFamily: 'monospace' }}>{order.id}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block' }}>Date</span>
                  <strong>{order.createdAt?.toDate().toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block' }}>Status</span>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    background: order.status === 'Completed' ? '#dcfce7' : '#fef3c7', 
                    color: order.status === 'Completed' ? '#166534' : '#92400e',
                    padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' 
                  }}>
                    {order.status === 'Completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {order.status}
                  </span>
                </div>
              </div>
              
              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Items */}
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Items Ordered</h3>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <img src={item.img} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                      <div>
                        <div style={{ fontWeight: '500' }}>{item.name} (x{item.quantity})</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted-fg)' }}>Length: {item.length}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                          {item.paymentChoice === 'installment' ? `${item.installments} Installments` : 'Full Payment'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Payment & User Info */}
                <div style={{ flex: '1 1 300px', background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Payment Tracker</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--muted-fg)' }}>Total Required:</span>
                    <strong style={{ fontSize: '1.1rem' }}>{fmt(order.totalAmount)}</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted-fg)' }}>Amount Paid:</span>
                    <input 
                      type="number" 
                      defaultValue={order.amountPaid}
                      onBlur={(e) => {
                        if(e.target.value !== String(order.amountPaid)) {
                          handleUpdateAmountPaid(order.id, e.target.value, order.totalAmount);
                        }
                      }}
                      disabled={updating}
                      style={{ padding: '0.5rem', width: '120px', borderRadius: '4px', border: '1px solid var(--border)', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}
                    />
                  </div>

                  <div style={{ width: '100%', background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      height: '100%', 
                      background: order.amountPaid >= order.totalAmount ? '#22c55e' : 'var(--primary)', 
                      width: `${Math.min(100, (order.amountPaid / order.totalAmount) * 100)}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', textAlign: 'center' }}>
                    {Math.round((order.amountPaid / order.totalAmount) * 100)}% Paid
                  </div>
                  
                  {order.amountPaid >= order.totalAmount && (
                    <div style={{ marginTop: '1rem', background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <CheckCircle size={16} /> Payment Complete - Ready to Ship!
                    </div>
                  )}

                  {order.paymentRef && (
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted-fg)' }}>
                      Korapay Ref: {order.paymentRef}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
