import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';

export default function Profile() {
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        } else {
          setError('Profile not found.');
        }
      } catch (err) {
        setError('Failed to fetch profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>My Account</h1>
        
        {error && <div style={{ color: 'red', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'center' }}>{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Profile Details Card */}
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Personal Information</h2>
            
            {profileData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                  <p style={{ fontWeight: '500' }}>{profileData.firstName} {profileData.lastName}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                  <p style={{ fontWeight: '500' }}>{profileData.email}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
                  <p style={{ fontWeight: '500' }}>{profileData.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>Account Status</label>
                  <p style={{ fontWeight: '500', color: user.emailVerified ? 'green' : 'orange' }}>
                    {user.emailVerified ? 'Verified ✓' : 'Unverified (Check your email)'}
                  </p>
                </div>
              </div>
            ) : (
              <p>No extra profile details found.</p>
            )}
          </div>

          {/* Order History Card Placeholder */}
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Order History</h2>
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#666' }}>
              <p style={{ marginBottom: '1rem' }}>You haven't placed any orders yet.</p>
              <button 
                onClick={() => navigate('/products')} 
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
              >
                Start Shopping
              </button>
            </div>
          </div>
          
        </div>
      </div>
      <Footer />
    </main>
  );
}
