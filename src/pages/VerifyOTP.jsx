import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    let interval;
    const fetchTimer = async () => {
      try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          if (userData.otpExpiresAt) {
            const expiresAt = userData.otpExpiresAt.toDate().getTime();
            
            const updateTimer = () => {
              const now = Date.now();
              const difference = expiresAt - now;
              if (difference > 0) {
                setTimeLeft(Math.floor(difference / 1000));
              } else {
                setTimeLeft(0);
                clearInterval(interval);
              }
            };
            
            updateTimer();
            interval = setInterval(updateTimer, 1000);
          }
        }
      } catch (err) {
        console.error("Failed to fetch timer:", err);
      }
    };

    fetchTimer();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [email, navigate]);

  const formatTime = (seconds) => {
    if (seconds === null) return '';
    if (seconds === 0) return 'Code Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      toast.error('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found.');
        toast.error('User not found.');
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.otpCode !== enteredCode) {
        setError('Invalid OTP code.');
        toast.error('Invalid OTP code.');
        setLoading(false);
        return;
      }

      const now = new Date();
      const expiresAt = userData.otpExpiresAt?.toDate();

      if (!expiresAt || now > expiresAt) {
        setError('OTP has expired. Please request a new one.');
        toast.error('OTP has expired.');
        setLoading(false);
        return;
      }

      // Valid OTP
      await updateDoc(doc(db, 'users', userDoc.id), {
        isEmailVerified: true,
        otpCode: null,
        otpExpiresAt: null
      });

      toast.success('Email successfully verified!');
      navigate('/login');

    } catch (err) {
      console.error(err);
      setError('Failed to verify OTP. Please try again.');
      toast.error('Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found.');
        toast.error('User not found.');
        setResending(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isEmailVerified) {
        toast.success('Email is already verified.');
        navigate('/login');
        return;
      }

      const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await updateDoc(doc(db, 'users', userDoc.id), {
        otpCode: newOtpCode,
        otpExpiresAt: newExpiresAt
      });

      await emailjs.send(
        'service_mcu3hnj',
        'template_643qpnq',
        {
          email: email,
          name: userData.firstName || 'Customer',
          otp: newOtpCode,
          code: newOtpCode
        },
        'A7Sq--0D6K2sijujF'
      );

      toast.success('A new OTP has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(15 * 60); // Reset timer to 15 mins locally
    } catch (err) {
      console.error(err);
      setError('Failed to resend OTP. Please try again later.');
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main>
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Verify Your Email</h1>
          <p className="sub" style={{ marginBottom: '2rem' }}>
            We sent a 6-digit code to <strong>{email}</strong>. <br />
            Enter it below to confirm your email address.
          </p>

          {error && <div style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1.5rem', background: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

          {timeLeft !== null && (
            <div style={{ marginBottom: '1.5rem', fontWeight: 'bold', color: timeLeft === 0 ? 'red' : 'var(--primary)', fontSize: '1.2rem' }}>
              {formatTime(timeLeft)}
            </div>
          )}

          <form onSubmit={verifyOTP}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  style={{
                    width: '3rem',
                    height: '3.5rem',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--fg)',
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--muted-fg)' }}>
            Didn't receive the code?{' '}
            <button 
              onClick={handleResend} 
              disabled={resending}
              style={{ 
                background: 'none', border: 'none', color: 'var(--primary)', 
                fontWeight: '600', cursor: resending ? 'not-allowed' : 'pointer',
                textDecoration: 'underline'
              }}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
