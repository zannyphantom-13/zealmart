import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import Footer from '../components/Footer';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Sign them out immediately so they aren't logged in before verifying OTP
      await auth.signOut();

      // Save extra user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        isEmailVerified: false,
        otpCode: otpCode,
        otpExpiresAt: otpExpiresAt,
        createdAt: new Date()
      });

      if (formData.email === 'zenobianewworld@gmail.com') {
        navigate('/admin');
      } else {
        // Send OTP email via EmailJS
        try {
          await emailjs.send(
            'service_mcu3hnj',
            'template_643qpnq',
            {
              email: formData.email,
              name: formData.firstName,
              otp: otpCode,
              code: otpCode // Just in case the template uses {{code}} instead of {{otp}}
            },
            'A7Sq--0D6K2sijujF'
          );
        } catch (emailErr) {
          console.error("EmailJS error:", emailErr);
        }

        // Redirect to OTP verification page
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
        toast.error('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
        toast.error('Password is too weak.');
      } else if (err.message && err.message.toLowerCase().includes('offline')) {
        setError('Please check your internet connection and try again.');
        toast.error('Check your internet connection.');
      } else {
        setError('Failed to register. Please try again later.');
        toast.error('Failed to register. Please try again.');
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
          {error && <div style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem 1rem', borderRadius: '8px' }}>{error}</div>}

          {successMessage ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                border: '1px solid #86efac',
                borderRadius: '12px', padding: '2rem'
              }}>
                <CheckCircle size={48} color="#16a34a" strokeWidth={1.5} />
                <div>
                  <h3 style={{ color: '#15803d', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Account Created!</h3>
                  <p style={{ color: '#166534', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{successMessage}</p>
                  <p style={{ color: '#166534', fontSize: '0.85rem' }}>
                    A verification link has been sent to your email.<br />Please check your inbox (and spam folder).
                  </p>
                </div>
              </div>
              <Link to="/login" className="auth-submit" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '1.5rem' }}>
                Go to Login →
              </Link>
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      placeholder="Create a password"
                      minLength="6"
                      required
                      onChange={handleChange}
                      style={{ width: '100%', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: '#888',
                        display: 'flex', alignItems: 'center', padding: '2px'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      placeholder="Confirm your password"
                      minLength="6"
                      required
                      onChange={handleChange}
                      style={{ width: '100%', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: '#888',
                        display: 'flex', alignItems: 'center', padding: '2px'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
