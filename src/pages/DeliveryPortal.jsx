import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyDeliveryOTP } from '../utils/otpService';
import { confirmDelivery, validateDeliveryToken } from '../utils/orderTrackingService';
import { uploadProofOfDeliveryImage } from '../utils/mediaUploadService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DeliveryPortal() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const token = searchParams.get('token');

  const [order, setOrder] = useState(null);
  const [otp, setOtp] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');

  // Validate token and fetch order
  useEffect(() => {
    const validateAndFetch = async () => {
      try {
        if (!orderId || !token) {
          setError('Invalid delivery portal link');
          return;
        }

        // Validate token
        const isValid = await validateDeliveryToken(orderId, token);
        if (!isValid) {
          setError('This delivery link is expired or invalid');
          return;
        }

        // Fetch order
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError('Order not found');
          return;
        }

        setOrder(orderSnap.data());
      } catch (err) {
        setError(`Error loading delivery: ${err.message}`);
      }
    };

    validateAndFetch();
  }, [orderId, token]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otp.trim()) {
        throw new Error('Please enter the OTP');
      }

      await verifyDeliveryOTP(orderId, otp);
      setOtpVerified(true);
      toast.success('OTP verified! Now upload proof of delivery.');
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setProofImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDeliveryConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!proofImage) {
        throw new Error('Please upload a proof of delivery image');
      }

      // Upload image
      toast.loading('Uploading proof of delivery...');
      const imageUrl = await uploadProofOfDeliveryImage(proofImage, orderId);

      // Confirm delivery
      await confirmDelivery(orderId, imageUrl, 'rider_' + Date.now());
      toast.dismiss();
      toast.success('Delivery confirmed! Thank you.');

      // Reset form
      setProofImage(null);
      setPreviewUrl('');
      setOtp('');
      setOtpVerified(false);
    } catch (err) {
      setError(err.message || 'Failed to confirm delivery');
      toast.error('Error confirming delivery');
    } finally {
      setLoading(false);
    }
  };

  if (error && !order) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="text-blue-600 hover:underline">Return to home</a>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Delivery Verification</h1>

        {/* Order Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600"><strong>Order ID:</strong> {orderId}</p>
          <p className="text-sm text-gray-600"><strong>Amount:</strong> ₦{order.total?.toLocaleString()}</p>
          <p className="text-sm text-gray-600"><strong>Status:</strong> {order.tracking_status}</p>
        </div>

        {!otpVerified ? (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Sent to customer via SMS/Email
              </p>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleDeliveryConfirm} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-sm">✓ OTP verified successfully</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proof of Delivery
              </label>
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="text-gray-600">
                  <p className="font-medium">Click to upload image</p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                </div>
              </label>
            </div>

            {previewUrl && (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setProofImage(null);
                    setPreviewUrl('');
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>}

            <button
              type="submit"
              disabled={loading || !proofImage}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
