import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ChevronDown, CheckCircle, ShieldCheck } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';
import useCartStore from '../store/useCartStore';

const INTEREST = { 2: 0, 3: 10, 4: 10, 5: 20, 6: 20 };

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInstallment, setShowInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
          <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-brandLime"></i>
          <h2 className="text-xl font-black uppercase tracking-widest text-brandDark">Loading Product...</h2>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-grow flex flex-col items-center justify-center px-4 text-center">
          <h2 className="text-3xl font-black text-brandDark mb-4">{error || 'Product Not Found'}</h2>
          <Link to="/products" className="text-brandDark font-bold flex items-center gap-2 hover:text-brandLime transition-colors">
            <ArrowLeft size={16} /> Back to Shop
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Installment calculations
  const price = Number(product.price);
  const rate        = INTEREST[installments] / 100;
  const total       = price * (1 + rate);
  
  const totalPeriods = paymentFrequency === 'weekly' ? installments * 4 : installments;
  const periodPayment = total / totalPeriods;
  const interestAmt = total - price;

  const handleBuyOnce = () => {
    addToCart(product, 1, 'full', 1, price);
    navigate('/cart');
  };

  const handleInstallment = () => {
    addToCart(product, 1, 'installment', installments, periodPayment, paymentFrequency);
    navigate('/cart');
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        
        {/* Breadcrumb / Back */}
        <div className="mb-6">
          <Link to="/products" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brandDark uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} /> Back to Products
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Image Column */}
          <div className="w-full lg:w-1/2 flex-shrink-0 relative">
            <div className="sticky top-8 bg-gradient-to-br from-brandDark to-brandBlack border border-gray-800 rounded-2xl p-8 flex items-center justify-center min-h-[400px] lg:min-h-[500px] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1000&q=80')] mix-blend-overlay bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
              <img src={product.img || product.images?.[0]} alt={product.name} loading="lazy" decoding="async" className="relative z-10 max-w-full max-h-[450px] object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
              {product.featured && (
                <span className="absolute top-4 left-4 z-20 bg-brandLime text-brandBlack text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Info Column */}
          <div className="w-full lg:w-1/2 py-2">
            <div className="mb-6">
              <p className="text-[10px] font-black text-brandLime uppercase tracking-widest mb-3 bg-brandLime/10 inline-block px-3 py-1 rounded-full border border-brandLime/20">{product.brand || product.category || 'MAYJAY'}</p>
              <h1 className="text-4xl md:text-5xl font-black text-brandDark leading-tight mb-4 tracking-tight uppercase">{product.name}</h1>
              {product.length && (
                <span className="inline-block bg-brandDark text-brandLime text-[11px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider mb-4 shadow-md">
                  {product.length}
                </span>
              )}
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-brandGreen">
                <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-brandLime" /> In Stock</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-brandLime" /> Official Warranty</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mb-8">
              <div className="flex items-end gap-4 mb-2">
                <span className="text-5xl font-black text-brandDark tracking-tighter">{fmt(price)}</span>
                {product.oldPrice && (
                  <span className="text-xl text-gray-400 line-through font-bold mb-1.5">{fmt(product.oldPrice)}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium tracking-wide">Delivery is processed after full payment is completed.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mb-8">
              <button 
                onClick={handleBuyOnce}
                className="w-full bg-brandLime hover:bg-brandBlack text-brandBlack hover:text-brandLime border border-transparent hover:border-brandLime font-black py-4 rounded-xl text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
              >
                <ShoppingBag size={18} /> Buy Once Now — {fmt(price)}
              </button>
            </div>

            {/* Installment Payment Section */}
            <div className="bg-brandBlack border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <button
                className="w-full px-6 py-5 flex justify-between items-center bg-brandDark hover:bg-brandBlack transition-colors"
                onClick={() => setShowInstallment(v => !v)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brandLime/20 border border-brandLime/40 text-brandLime flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-sm"></i>
                  </div>
                  <span className="font-black text-white uppercase tracking-widest text-sm">Pay in Installments</span>
                </div>
                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${showInstallment ? 'rotate-180' : ''}`} />
              </button>

              {showInstallment && (
                <div className="p-6 border-t border-gray-800">
                  
                  {/* Frequency Toggle */}
                  <div className="flex bg-brandDark p-1.5 rounded-lg mb-6 w-full max-w-xs mx-auto shadow-inner border border-gray-800">
                    <button
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${paymentFrequency === 'monthly' ? 'bg-brandLime text-brandBlack shadow-md' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setPaymentFrequency('monthly')}
                    >
                      Monthly
                    </button>
                    <button
                      className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${paymentFrequency === 'weekly' ? 'bg-brandLime text-brandBlack shadow-md' : 'text-gray-400 hover:text-white'}`}
                      onClick={() => setPaymentFrequency('weekly')}
                    >
                      Weekly
                    </button>
                  </div>

                  {/* Duration Selector */}
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Select Duration ({paymentFrequency === 'weekly' ? 'Weeks' : 'Months'})</label>
                    <div className="flex flex-wrap justify-center gap-3">
                      {[2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          className={`w-12 h-12 rounded-lg font-black text-lg transition-all ${installments === n ? 'bg-brandLime text-brandBlack shadow-lg transform -translate-y-1' : 'bg-brandDark border border-gray-700 text-gray-300 hover:border-brandLime hover:text-white'}`}
                          onClick={() => setInstallments(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="bg-brandDark border border-gray-800 rounded-xl p-6 mb-6 shadow-inner">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Interest rate</span>
                      <span className={`text-xs font-black uppercase tracking-widest ${INTEREST[installments] > 0 ? 'text-white' : 'text-brandLime'}`}>
                        {INTEREST[installments]}% {INTEREST[installments] === 0 && '🎉'}
                      </span>
                    </div>
                    {interestAmt > 0 && (
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Interest added</span>
                        <span className="text-sm font-black text-white">{fmt(interestAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Total to pay</span>
                      <span className="text-sm font-black text-white">{fmt(total)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{paymentFrequency === 'monthly' ? 'Monthly payment' : 'Weekly payment'}</span>
                      <span className="text-xl font-black text-brandLime">{fmt(periodPayment)} <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">/{paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-brandDark/50 border border-gray-800 rounded-xl p-4 mb-6 flex gap-3">
                    <i className="fas fa-info-circle text-brandLime mt-0.5"></i>
                    <p className="text-[11px] text-gray-300 font-medium leading-relaxed">
                      <strong className="text-white uppercase tracking-wider text-[10px]">How multi-item orders work:</strong> Items with the exact same payment plan are processed together. Mixes of different plans require you to unify them or split them at checkout.
                    </p>
                  </div>

                  <button 
                    className="w-full bg-brandDark border border-gray-700 text-white hover:bg-brandLime hover:text-brandBlack hover:border-brandLime font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2" 
                    onClick={handleInstallment}
                  >
                    Start {paymentFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Plan
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
