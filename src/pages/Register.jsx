import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import Footer from '../components/Footer';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Send email verification link
      await sendEmailVerification(user);

      // Save extra user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        createdAt: new Date()
      });

      if (formData.email === 'zenobianewworld@gmail.com') {
        navigate('/admin');
      } else {
        setSuccessMessage('Account created successfully! A verification link has been sent to your email.');
        // Clear form
        setFormData({ firstName: '', lastName: '', phone: '', email: '', password: '' });
      }
    } catch (err) {
      // Firebase throws specific errors, we can format them nicely
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Failed to register. Make sure email/password authentication is enabled in your Firebase console.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="sub">Join JD Good Hair today</p>
          {error && <div style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
          
          {successMessage ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: 'green', fontSize: '1.2rem', marginBottom: '1rem', background: '#dcfce7', padding: '1rem', borderRadius: '8px' }}>
                {successMessage}
              </div>
              <p style={{ marginBottom: '2rem' }}>Please check your inbox (and spam folder) for the verification link.</p>
              <Link to="/login" className="auth-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} placeholder="First name" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} placeholder="Last name" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} placeholder="Phone number" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} placeholder="you@example.com" required onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" value={formData.password} placeholder="Create a password" minLength="6" required onChange={handleChange} />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
              <div className="auth-link">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
