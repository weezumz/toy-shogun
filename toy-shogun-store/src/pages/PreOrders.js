import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function PreOrders() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(null); // product being reserved
  const [delivery, setDelivery] = useState('pickup');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_published', true)
        .eq('is_preorder', true)
        .order('preorder_release_date', { ascending: true });
      if (data) setProducts(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const openReserve = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setReserving(product);
    setDelivery('pickup');
    setAddress('');
    setError('');
    setSuccess(false);
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (delivery === 'lbc' && !address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }
    setSubmitting(true);
    setError('');

    const { error: err } = await supabase.from('reservations').insert([{
      customer_id: user.id,
      customer_email: user.email,
      product_id: reserving.id,
      delivery_method: delivery,
      delivery_address: delivery === 'lbc' ? address.trim() : null,
      status: 'pending',
    }]);

    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  };

  const closeModal = () => { setReserving(null); setSuccess(false); };

  return (
    <PublicLayout>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e' }}>Pre-Orders</h2>
        <p style={{ color: '#666' }}>
          Reserve items before they arrive. We'll notify you when stock is ready and payment is due.
        </p>
      </div>

      {!user && (
        <div style={{
          backgroundColor: '#fff5f5', border: '1px solid #fecaca',
          borderRadius: '10px', padding: '14px 18px', marginBottom: '24px',
          fontSize: '0.9rem', color: '#991b1b',
        }}>
          You need to <span
            onClick={() => navigate('/login')}
            style={{ color: '#cc0000', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >sign in</span> or <span
            onClick={() => navigate('/signup')}
            style={{ color: '#cc0000', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >create an account</span> to reserve pre-orders.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
          No pre-orders available right now.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {products.map(product => (
            <div key={product.id} style={{
              backgroundColor: '#fff', borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              {/* Image — clickable to product detail */}
              <div
                onClick={() => navigate(`/shop/${product.id}`)}
                style={{
                  height: '180px', backgroundColor: '#f0f2f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', cursor: 'pointer',
                }}
              >
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3rem' }}>🎴</span>
                )}
                <span style={{
                  position: 'absolute', top: '8px', left: '8px',
                  backgroundColor: '#e94560', color: '#fff',
                  padding: '3px 8px', borderRadius: '4px',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>Pre-Order</span>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>
                  {product.categories?.name || 'Uncategorized'}
                </div>
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '8px' }}>
                  {product.name}
                </div>
                {product.preorder_release_date && (
                  <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '8px' }}>
                    📅 Expected: {new Date(product.preorder_release_date).toLocaleDateString('en-PH', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                    <span style={{ color: '#bbb', marginLeft: '6px' }}>(est.)</span>
                  </div>
                )}
                <div style={{ fontWeight: 700, color: '#e94560', marginBottom: '12px' }}>
                  ₱{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <button
                  onClick={() => openReserve(product)}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: '#1a1a2e', color: '#fff',
                    border: 'none', borderRadius: '8px',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >
                  Reserve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reserve Modal */}
      {reserving && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', borderRadius: '16px',
              maxWidth: '460px', width: '100%', padding: '32px',
            }}
          >
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                <h4 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Reservation Submitted!</h4>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '24px' }}>
                  We'll notify you when <strong>{reserving.name}</strong> arrives and payment is due.
                </p>
                <button onClick={closeModal} style={reserveBtnStyle}>Done</button>
              </div>
            ) : (
              <>
                <h4 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>Reserve Item</h4>
                <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: '24px' }}>
                  {reserving.name}
                </p>

                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: '8px', padding: '10px 14px',
                    color: '#dc2626', fontSize: '0.88rem', marginBottom: '16px',
                  }}>{error}</div>
                )}

                <form onSubmit={handleReserve}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={modalLabelStyle}>Delivery Preference</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                      {[
                        { value: 'pickup', label: 'Store Pickup', desc: 'Pick up when ready' },
                        { value: 'lbc', label: 'LBC Delivery', desc: 'COD shipping fee' },
                      ].map(opt => (
                        <div
                          key={opt.value}
                          onClick={() => setDelivery(opt.value)}
                          style={{
                            border: `2px solid ${delivery === opt.value ? '#cc0000' : '#e5e5e5'}`,
                            borderRadius: '8px', padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: delivery === opt.value ? '#fff5f5' : '#fff',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a2e' }}>
                            {delivery === opt.value ? '● ' : '○ '}{opt.label}
                          </div>
                          <div style={{ color: '#888', fontSize: '0.78rem', marginTop: '2px' }}>{opt.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {delivery === 'lbc' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={modalLabelStyle}>Delivery Address *</label>
                      <textarea
                        required
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%', marginTop: '8px', padding: '10px 14px',
                          border: '1px solid #ddd', borderRadius: '8px',
                          fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box',
                        }}
                        placeholder="House no., street, barangay, city, province"
                      />
                    </div>
                  )}

                  <div style={{
                    backgroundColor: '#f0f9ff', borderRadius: '8px',
                    padding: '10px 14px', fontSize: '0.82rem', color: '#0369a1', marginBottom: '20px',
                  }}>
                    No payment yet — we'll reach out when your item is ready.
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={closeModal} style={{
                      flex: 1, padding: '12px', border: '1px solid #ddd',
                      borderRadius: '8px', background: '#fff', cursor: 'pointer',
                      fontWeight: 600, color: '#666',
                    }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} style={{ ...reserveBtnStyle, flex: 1 }}>
                      {submitting ? 'Submitting...' : 'Confirm Reserve'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </PublicLayout>
  );
}

const reserveBtnStyle = {
  padding: '12px 24px', backgroundColor: '#cc0000',
  color: '#fff', border: 'none', borderRadius: '8px',
  fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', width: '100%',
};

const modalLabelStyle = {
  fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem',
};
