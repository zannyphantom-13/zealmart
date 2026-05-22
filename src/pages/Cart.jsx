import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

function fmt(n) {
  return '₦' + Math.ceil(n).toLocaleString('en-NG');
}

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, _hydrated, removeFromCart, updateQuantity, getInitialPaymentTotal, clearCart, unifyPaymentFrequency } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    city: '',
    state: '',
    phone: '',
    instructions: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [conflictDismissed, setConflictDismissed] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  // expandedItems: one entry per unit, each with a unique splitId
  const [expandedItems, setExpandedItems] = useState([]);
  // itemGroups: maps splitId -> groupNumber (1-5)
  const [itemGroups, setItemGroups] = useState({});

  const getPaymentSignature = (item) => {
    if (item.paymentChoice === 'full') return 'full';
    return `${item.paymentFrequency}-${item.installments}`;
  };

  // Validate that all non-full-payment items in a group share the same signature
  const getGroupConflicts = (groups) => {
    const conflicts = {};
    Object.entries(groups).forEach(([gId, groupItems]) => {
      const installmentSigs = groupItems
        .filter(i => i.paymentChoice !== 'full')
        .map(i => getPaymentSignature(i));
      const uniqueSigs = new Set(installmentSigs);
      if (uniqueSigs.size > 1) conflicts[gId] = [...uniqueSigs];
    });
    return conflicts;
  };

  const buildGroupMap = (expItems) => {
    return expItems.reduce((acc, item) => {
      const gId = itemGroups[item.splitId] || 1;
      if (!acc[gId]) acc[gId] = [];
      acc[gId].push(item);
      return acc;
    }, {});
  };

  const enterSplitMode = () => {
    // Expand items by quantity — each unit gets a unique splitId
    const expanded = [];
    let sigToGroup = {};
    let groupCounter = 1;
    items.forEach(item => {
      const sig = getPaymentSignature(item);
      if (!sigToGroup[sig]) sigToGroup[sig] = groupCounter++;
      for (let i = 0; i < item.quantity; i++) {
        expanded.push({ ...item, quantity: 1, splitId: `${item.cartItemId}_${i}` });
      }
    });
    setExpandedItems(expanded);
    const newGroups = {};
    sigToGroup = {};
    groupCounter = 1;
    expanded.forEach(unit => {
      const sig = getPaymentSignature(unit);
      if (!sigToGroup[sig]) sigToGroup[sig] = groupCounter++;
      newGroups[unit.splitId] = sigToGroup[sig];
    });
    setItemGroups(newGroups);
    setSplitMode(true);
  };

  const exitSplitMode = () => {
    setSplitMode(false);
    setExpandedItems([]);
    setItemGroups({});
  };

  // Recalculate periodPayment when installments or frequency changes after unification
  const recalcPeriodPayment = (item, targetFreq, targetDur) => {
    const INTEREST = { 2: 0, 3: 0.1, 4: 0.1, 5: 0.2, 6: 0.2 };
    const rate = INTEREST[targetDur] ?? 0.2;
    const fullAmount = item.price * (1 + rate);
    if (targetFreq === 'weekly') {
      return fullAmount / (targetDur * 4);
    }
    return fullAmount / targetDur;
  };

  // Korapay disabled temporarily

  // Wait for Zustand to hydrate from localStorage before rendering empty cart
  if (!_hydrated) {
    return (
      <main>
        <div className="container" style={{ padding: '6rem 1rem 4rem', minHeight: '60vh', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Your Cart</h1>
          <p style={{ color: 'var(--muted-fg)' }}>Loading cart...</p>
        </div>
        <Footer />
      </main>
    );
  }

  const totalToPayNow = getInitialPaymentTotal();

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (items.length === 0) return;
    setLoading(true);
    setError('');

    try {
      if (splitMode) {
        // Build groups from expandedItems (each unit is qty=1)
        const groups = buildGroupMap(expandedItems);

        // Merge identical items within each group back to quantity > 1
        for (const [gId, groupUnits] of Object.entries(groups)) {
          if (groupUnits.length === 0) continue;
          // Consolidate units with same cartItemId
          const merged = {};
          groupUnits.forEach(unit => {
            if (!merged[unit.cartItemId]) merged[unit.cartItemId] = { ...unit, quantity: 0 };
            merged[unit.cartItemId].quantity += 1;
          });
          const groupItems = Object.values(merged);
          const groupTotalAmount = groupItems.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : (i.price * (1 + (i.installments === 3 || i.installments === 4 ? 0.1 : i.installments > 4 ? 0.2 : 0))) * i.quantity), 0);
          const groupTotalToPayNow = groupItems.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : (i.periodPayment || i.monthlyPayment || 0) * i.quantity), 0);

          await addDoc(collection(db, "orders"), {
            userId: user.uid,
            items: groupItems,
            deliveryInfo: deliveryInfo,
            totalAmount: groupTotalAmount,
            amountPaid: groupTotalToPayNow,
            status: 'Processing',
            paymentRef: `MOCK_REF_${Date.now()}_G${gId}`,
            createdAt: new Date(),
          });
        }
      } else {
        // Single combined order
        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          items: items,
          deliveryInfo: deliveryInfo,
          totalAmount: items.reduce((acc, i) => acc + (i.paymentChoice === 'full' ? i.price * i.quantity : (i.price * (1 + (i.installments === 3 || i.installments === 4 ? 0.1 : i.installments > 4 ? 0.2 : 0))) * i.quantity), 0),
          amountPaid: totalToPayNow,
          status: 'Processing',
          paymentRef: `MOCK_REF_${Date.now()}`,
          createdAt: new Date(),
        });
      }

      clearCart();
      toast.success('Order placed successfully!');
      setShowPreview(false);
      navigate('/profile');
    } catch (err) {
      console.error("Error saving order:", err);
      setError("Payment successful but failed to save order. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main>
        <div className="container" style={{ padding: '6rem 1rem 4rem', minHeight: '60vh', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Your Cart</h1>
          <div style={{ padding: '4rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--muted-fg)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Your shopping bag is empty.</p>
            <Link to="/products" className="buy-once-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>Continue Shopping</Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <div className="container" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
        <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-fg)', marginBottom: '2rem', textDecoration: 'none', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)', fontSize: '2rem' }}>Shopping Bag</h1>

        {error && <div style={{ color: 'red', background: '#fee2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>{error}</div>}

        <div className="cart-layout">

          {/* Conflict Warning Banner */}
          {(() => {
            const hasWeekly = items.some(i => i.paymentChoice === 'installment' && i.paymentFrequency === 'weekly');
            const hasMonthly = items.some(i => i.paymentChoice === 'installment' && i.paymentFrequency === 'monthly');
            const hasInstallment = items.some(i => i.paymentChoice === 'installment');
            const hasMultipleInstallments = items.filter(i => i.paymentChoice === 'installment').length > 1;
            // Top blue banner removed as per user request to place it inside the product.
            return null;
          })()}

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {items.map((item) => (
              <div key={item.cartItemId} className="cart-item-card">
                <img src={item.img} alt={item.name} loading="lazy" decoding="async" className="cart-item-img" />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{item.name}</h3>
                      <p style={{ color: 'var(--muted-fg)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Length: {item.length}</p>
                    </div>

                    <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }} aria-label="Remove item">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {item.paymentChoice === 'installment' ? (
                        items.filter(i => i.paymentChoice === 'installment').length > 1 ? (
                          <div style={{ color: '#1e40af', fontSize: '0.75rem', background: '#eff6ff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #bfdbfe', maxWidth: '300px', lineHeight: '1.4' }}>
                            <span style={{ display: 'block', fontWeight: '700', marginBottom: '0.15rem' }}>ℹ️ Multiple Installment Items Detected</span>
                            Your installment payments will be combined into a single schedule and calculated together during order review.
                          </div>
                        ) : (
                          <div style={{ color: 'var(--muted-fg)', fontSize: '0.85rem', fontWeight: '500' }}>
                            Installment: {item.paymentFrequency === 'weekly' ? item.installments * 4 + ' Weeks' : item.installments + ' Months'}
                          </div>
                        )
                      ) : (
                        <div style={{ color: 'var(--muted-fg)', fontSize: '0.85rem', fontWeight: '500' }}>
                          Full Payment
                        </div>
                      )}
                      <div className="cart-qty-ctrl">
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} style={{ background: 'none', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                        <span style={{ fontWeight: '500' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} style={{ background: 'none', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {item.paymentChoice === 'installment' ? (
                        <>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{fmt((item.periodPayment || item.monthlyPayment || 0) * item.quantity)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted-fg)' }}>/ {item.paymentFrequency === 'weekly' ? 'wk' : 'mo'}</span></div>
                        </>
                      ) : (
                        <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{fmt(item.price * item.quantity)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div>
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Delivery Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" placeholder="Full Address" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="City" value={deliveryInfo.city} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })} style={{ flex: '1 1 120px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                  <input type="text" placeholder="State" value={deliveryInfo.state} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })} style={{ flex: '1 1 120px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                </div>
                <input type="tel" placeholder="Phone Number" value={deliveryInfo.phone} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }} />
                <textarea placeholder="Additional Instructions (Optional)" value={deliveryInfo.instructions} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', resize: 'vertical', minHeight: '80px' }}></textarea>
              </div>

              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Order Summary</h2>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--muted-fg)' }}>
                <span>Subtotal ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span>{fmt(totalToPayNow)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--muted-fg)' }}>
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1.5rem 0', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)', fontSize: '1.25rem', fontWeight: '700' }}>
                <span>Total Due Today</span>
                <span>{fmt(totalToPayNow)}</span>
              </div>

              {!user && (
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  You must be logged in to checkout.
                </div>
              )}

              <button
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  if (items.length === 0) return;
                  if (!deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.state || !deliveryInfo.phone) {
                    toast.error('Please fill out all required delivery fields.');
                    setError('Please fill out all required delivery fields.');
                    return;
                  }
                  setError('');
                  setShowPreview(true);
                }}
                disabled={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                Review & Confirm Order
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted-fg)' }}>
                Secure checkout (Test Mode).
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />

      {/* Confirm Order Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Confirm Your Order</h2>
            
            {(() => {
              return (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Info</h3>
                    <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{deliveryInfo.address}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{deliveryInfo.city}, {deliveryInfo.state}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Phone: {deliveryInfo.phone}</p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    {(() => {
                      // Detect conflicts in single-order (non-split) mode
                      const installmentSigs = items
                        .filter(i => i.paymentChoice !== 'full')
                        .map(i => `${i.paymentFrequency}-${i.installments}`);
                      const hasSingleOrderConflict = new Set(installmentSigs).size > 1;

                      return (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Items</h3>
                          <button
                            onClick={() => { splitMode ? exitSplitMode() : enterSplitMode(); }}
                            style={{
                              padding: '0.4rem 0.8rem', fontSize: '0.78rem',
                              background: splitMode ? 'var(--muted)' : hasSingleOrderConflict ? '#dc2626' : 'var(--primary)',
                              color: splitMode ? 'var(--foreground)' : 'white',
                              borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '700'
                            }}
                          >
                            {splitMode ? '← Merge into Single Order' : hasSingleOrderConflict ? '⚠️ Resolve Conflicting Orders' : 'Split into Multiple Orders'}
                          </button>
                        </div>
                      );
                    })()}

                    {splitMode ? (() => {
                      const groupMap = buildGroupMap(expandedItems);
                      const conflicts = getGroupConflicts(groupMap);
                      const hasAnyConflict = Object.keys(conflicts).length > 0;

                      return (
                        <>
                          {Object.entries(groupMap).sort(([a],[b]) => Number(a)-Number(b)).map(([gId, groupUnits]) => {
                            const conflict = conflicts[gId];
                            const hasConflict = !!conflicts[gId];
                            const borderColor = hasConflict ? '#f87171' : 'var(--border)';
                            return (
                              <div key={gId} style={{ marginBottom: '1rem', border: `1.5px solid ${borderColor}`, borderRadius: '8px' }}>
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: hasConflict ? '#fef2f2' : 'transparent' }}>
                                  <strong style={{ fontSize: '1rem', color: hasConflict ? '#991b1b' : 'var(--foreground)' }}>Order {gId}</strong>
                                  {groupUnits.some(u => u.paymentChoice !== 'full') && (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => {
                                          const firstSig = groupUnits.find(u => u.paymentChoice !== 'full');
                                          if (!firstSig) return;
                                          const targetFreq = firstSig.paymentFrequency;
                                          const targetDur = firstSig.installments;
                                          setExpandedItems(prev => prev.map(unit => {
                                            if ((itemGroups[unit.splitId] || 1) === Number(gId) && unit.paymentChoice !== 'full') {
                                              const newPeriodPayment = recalcPeriodPayment(unit, targetFreq, targetDur);
                                              return { ...unit, paymentFrequency: targetFreq, installments: targetDur, periodPayment: newPeriodPayment };
                                            }
                                            return unit;
                                          }));
                                        }}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: hasConflict ? '#ef4444' : 'var(--foreground)', color: hasConflict ? 'white' : 'var(--background)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                      >
                                        {hasConflict ? '⚠️ Unify Plans' : 'Unify Plans'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                {groupUnits.map(unit => (
                                  <div key={unit.splitId} style={{ marginBottom: '0.75rem', padding: '0.6rem', background: 'var(--muted)', borderRadius: '6px' }}>
                                    {/* Item name + price row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: unit.paymentChoice !== 'full' ? '0.4rem' : 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                        <span style={{ fontSize: '0.85rem' }}>1×</span>
                                        <span style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unit.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>({unit.paymentChoice === 'full' ? 'Full' : `${unit.installments} ${unit.paymentFrequency === 'weekly' ? 'Wks' : 'Mos'}`})</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{fmt(unit.paymentChoice === 'full' ? unit.price : unit.periodPayment || 0)}</span>
                                        <select
                                          value={itemGroups[unit.splitId] || 1}
                                          onChange={(e) => setItemGroups(prev => ({ ...prev, [unit.splitId]: Number(e.target.value) }))}
                                          style={{ padding: '0.2rem 0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                                        >
                                          {[1,2,3,4,5].map(n => <option key={n} value={n}>Order {n}</option>)}
                                        </select>
                                      </div>
                                    </div>
                                    {/* Frequency + Duration selectors for installment items */}
                                    {unit.paymentChoice !== 'full' && (
                                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <select
                                          value={unit.paymentFrequency}
                                          onChange={(e) => {
                                            const newFreq = e.target.value;
                                            const newPP = recalcPeriodPayment(unit, newFreq, unit.installments);
                                            setExpandedItems(prev => prev.map(u => u.splitId === unit.splitId ? { ...u, paymentFrequency: newFreq, periodPayment: newPP } : u));
                                          }}
                                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', flex: '1 1 80px' }}
                                        >
                                          <option value="weekly">Weekly</option>
                                          <option value="monthly">Monthly</option>
                                        </select>
                                        <select
                                          value={unit.installments}
                                          onChange={(e) => {
                                            const newDur = Number(e.target.value);
                                            const newPP = recalcPeriodPayment(unit, unit.paymentFrequency, newDur);
                                            setExpandedItems(prev => prev.map(u => u.splitId === unit.splitId ? { ...u, installments: newDur, periodPayment: newPP } : u));
                                          }}
                                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', flex: '1 1 80px' }}
                                        >
                                          {[2,3,4,5,6].map(n => (
                                            <option key={n} value={n}>{n} {unit.paymentFrequency === 'weekly' ? 'Weeks' : 'Months'}</option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                          {hasAnyConflict && (
                            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', marginBottom: '1rem' }}>
                              ⚠️ Resolve all conflicts above before proceeding.
                            </div>
                          )}

                          <div style={{ marginBottom: '2rem', background: 'var(--muted)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted-fg)' }}>
                              {Object.keys(groupMap).length} separate order{Object.keys(groupMap).length > 1 ? 's' : ''} will be created.
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setShowPreview(false)} disabled={loading}
                              style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', color: 'var(--foreground)' }}>
                              Cancel
                            </button>
                            <button onClick={handleCheckout} disabled={loading || hasAnyConflict}
                              style={{ flex: 1, padding: '0.85rem', background: hasAnyConflict ? '#9ca3af' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading || hasAnyConflict ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                              <CreditCard size={18} />
                              {loading ? 'Processing...' : `Place ${Object.keys(groupMap).length} Order${Object.keys(groupMap).length > 1 ? 's' : ''}`}
                            </button>
                          </div>
                        </>
                      );
                    })() : (
                      <>
                        {items.map(item => (
                          <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: '600' }}>{item.quantity}×</span>
                              <span>{item.name} <span style={{ fontSize: '0.8rem', color: 'var(--muted-fg)' }}>({item.paymentChoice === 'full' ? 'Full' : `${item.installments} ${item.paymentFrequency === 'weekly' ? 'Wks' : 'Mos'}`})</span></span>
                            </div>
                            <span style={{ fontWeight: '600' }}>{fmt((item.paymentChoice === 'full' ? item.price : item.periodPayment || item.monthlyPayment) * item.quantity)}</span>
                          </div>
                        ))}

                        <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', background: 'var(--muted)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                            <span>Total Due Today</span>
                            <span style={{ color: 'var(--primary)' }}>{fmt(totalToPayNow)}</span>
                          </div>
                          {items.some(i => i.paymentChoice === 'installment') && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Combined Installment:</span>
                              <span>{fmt(items.reduce((acc, i) => acc + (i.paymentChoice === 'installment' ? (i.periodPayment || i.monthlyPayment) * i.quantity : 0), 0))} / {items.some(i => i.paymentFrequency === 'weekly') ? 'wk' : 'mo'}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <button onClick={() => setShowPreview(false)} disabled={loading}
                            style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', color: 'var(--foreground)' }}>
                            Cancel
                          </button>
                          {(() => {
                            const installmentSigs = items
                              .filter(i => i.paymentChoice !== 'full')
                              .map(i => `${i.paymentFrequency}-${i.installments}`);
                            const hasSingleOrderConflict = new Set(installmentSigs).size > 1;
                            return (
                              <button onClick={hasSingleOrderConflict ? enterSplitMode : handleCheckout} disabled={loading}
                                style={{ flex: 1, padding: '0.85rem', background: hasSingleOrderConflict ? '#dc2626' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: hasSingleOrderConflict ? 'none' : '0 4px 12px rgba(236, 72, 153, 0.2)' }}>
                                <CreditCard size={18} />
                                {loading ? 'Processing...' : hasSingleOrderConflict ? '⚠️ Resolve Conflicts First' : 'Proceed to Pay'}
                              </button>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Conflict Popup Modal */}
      {(() => {
        const uniqueSignatures = new Set(items.map(i => i.paymentChoice === 'full' ? 'full' : `${i.paymentChoice}-${i.paymentFrequency}-${i.installments}`)).size;
        const conflict = uniqueSignatures > 1;

        if (conflict && !conflictDismissed) {
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '700', color: '#92400e' }}>Multiple Payment Plans Detected</h3>
                    <p style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: '1.5' }}>
                      Your cart contains a mix of different payment plans. During order review, you can choose to merge these into a single combined order, or split them into separate orders to maintain their distinct payment schedules.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setConflictDismissed(true)}
                  style={{ width: '100%', padding: '0.85rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                >
                  I Understand
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </main>
  );
}
