import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import { Package, Clock, CheckCircle } from 'lucide-react';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function Profile() {
  const { user, loading: authLoading } = useAuthStore();
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
        
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        }

        // Fetch Orders
        const q = query(
          collection(db, "orders"), 
          where("userId", "==", user.uid)
        );
        const orderSnap = await getDocs(q);
        const ordersData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        ordersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setOrders(ordersData);

      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <main>
        <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
          <h2>Loading Profile...</h2>
        </div>
      </main>
    );
  }

  if (!user) return null; // handled by redirect

  return (
    <main>
      <div className="container" style={{ padding: '6rem 1rem 4rem', minHeight: '60vh' }}>
        <h1 style={{ marginBottom: '2rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '2.5rem' }}>My Account</h1>
        
        {error && <div style={{ color: 'red', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Profile Details Card */}
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Personal Information</h2>
            
            {profileData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                  <p style={{ fontWeight: '600' }}>{profileData.firstName} {profileData.lastName}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                  <p style={{ fontWeight: '600' }}>{profileData.email}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                  <p style={{ fontWeight: '600' }}>{profileData.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'block', marginBottom: '0.25rem' }}>Account Status</label>
                  <p style={{ fontWeight: '600', color: user.emailVerified ? 'green' : 'orange' }}>
                    {user.emailVerified ? 'Verified ✓' : 'Unverified (Check your email)'}
                  </p>
                </div>
              </div>
            ) : (
              <p>No extra profile details found.</p>
            )}
          </div>

          {/* Order History */}
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Order History & Tracking</h2>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>
                <Package size={48} color="var(--muted-fg)" style={{ margin: '0 auto 1rem' }} />
                <p style={{ marginBottom: '1rem' }}>You haven't placed any orders yet.</p>
                <button 
                  onClick={() => navigate('/products')} 
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', background: 'var(--background)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', display: 'block' }}>Ordered on {order.createdAt?.toDate().toLocaleDateString()}</span>
                        <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>ID: {order.id}</strong>
                      </div>
                      <div>
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

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                      <div style={{ flex: '2 1 300px' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <img src={item.img} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div>
                              <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{item.name}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--muted-fg)' }}>Qty: {item.quantity} • Length: {item.length}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ flex: '1 1 200px', background: 'white', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--muted-fg)' }}>Total Amount:</span>
                          <strong>{fmt(order.totalAmount)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--muted-fg)' }}>Amount Paid:</span>
                          <strong style={{ color: 'var(--primary)' }}>{fmt(order.amountPaid)}</strong>
                        </div>
                        
                        <div style={{ width: '100%', background: '#e5e7eb', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            background: order.amountPaid >= order.totalAmount ? '#22c55e' : 'var(--primary)', 
                            width: `${Math.min(100, (order.amountPaid / order.totalAmount) * 100)}%` 
                          }} />
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--muted-fg)', textAlign: 'center' }}>
                          {order.amountPaid >= order.totalAmount 
                            ? "Fully Paid - Preparing for shipment!" 
                            : `Balance remaining: ${fmt(order.totalAmount - order.amountPaid)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
      <Footer />
    </main>
  );
}
