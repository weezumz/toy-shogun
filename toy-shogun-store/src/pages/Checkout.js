import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [delivery, setDelivery] = useState('pickup');
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
    address: '',
    city: '',
    province: '',
    zip: '',
  });

  useEffect(() => {
    if (cartItems.length === 0) navigate('/cart');
  }, [cartItems, navigate]);

  if (cartItems.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (delivery === 'lbc' && !form.address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const deliveryAddress = delivery === 'lbc'
        ? [form.address, form.city, form.province, form.zip].filter(Boolean).join(', ')
        : null;

      const { data: order, error: orderError } = await supabase
        .from('online_orders')
        .insert([{
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          notes: form.notes,
          total_amount: cartTotal,
          delivery_method: delivery,
          delivery_address: deliveryAddress,
          payment_method: 'paymongo',
          payment_status: 'pending',
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      const items = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        subtotal: parseFloat(item.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('online_order_items')
        .insert(items);

      if (itemsError) throw new Error(itemsError.message);

      const serverRes = await fetch('https://toy-shogun-server.onrender.com/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          orderId: order.id,
          customerName: form.customer_name,
        }),
      });

      const serverData = await serverRes.json();
      if (!serverRes.ok) throw new Error(serverData.error);

      const { paymentLink, linkId } = serverData;

      await supabase
        .from('online_orders')
        .update({ paymongo_link_id: linkId })
        .eq('id', order.id);

      clearCart();
      window.location.href = paymentLink;

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <button onClick={() => navigate('/cart')} style={{
        background: 'none', border: 'none', color: '#666',
        cursor: 'pointer', marginBottom: '24px', padding: 0,
      }}>
        ← Back to Cart
      </button>

      <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '32px' }}>Checkout</h2>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: '300px' }}>

          {/* Delivery Method */}
          <div style={cardStyle}>
            <h5 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>Delivery Method</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { value: 'pickup', label: 'Store Pickup', desc: 'Pick up at our store. Free.' },
                { value: 'lbc', label: 'LBC Delivery', desc: 'Shipping fee paid COD to rider.' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setDelivery(opt.value)}
                  style={{
                    border: `2px solid ${delivery === opt.value ? '#cc0000' : '#e5e5e5'}`,
                    borderRadius: '10px', padding: '14px 16px', cursor: 'pointer',
                    backgroundColor: delivery === opt.value ? '#fff5f5' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '4px', fontSize: '0.95rem' }}>
                    {delivery === opt.value ? '● ' : '○ '}{opt.label}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.82rem' }}>{opt.desc}</div>
                </div>
              ))}
            </div>

            {/* LBC address fields */}
            {delivery === 'lbc' && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
                <div style={{
                  backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: '8px', padding: '10px 14px',
                  color: '#92400e', fontSize: '0.84rem', marginBottom: '16px',
                }}>
                  📦 Product price paid via PayMongo. LBC shipping fee paid separately to the rider upon delivery.
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Street Address *</label>
                  <input required value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    style={inputStyle} placeholder="House no., street, barangay" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>City / Municipality *</label>
                    <input required value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      style={inputStyle} placeholder="Quezon City" />
                  </div>
                  <div>
                    <label style={labelStyle}>Province</label>
                    <input value={form.province}
                      onChange={e => setForm({ ...form, province: e.target.value })}
                      style={inputStyle} placeholder="Metro Manila" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>ZIP Code</label>
                  <input value={form.zip}
                    onChange={e => setForm({ ...form, zip: e.target.value })}
                    style={inputStyle} placeholder="1105" />
                </div>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div style={{ ...cardStyle, marginTop: '16px' }}>
            <h5 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>Contact Details</h5>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', padding: '12px 16px',
                color: '#dc2626', marginBottom: '16px', fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" required value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                style={inputStyle} placeholder="Juan dela Cruz" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email Address *</label>
              <input type="email" required value={form.customer_email}
                onChange={e => setForm({ ...form, customer_email: e.target.value })}
                style={inputStyle} placeholder="juan@email.com" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Phone Number</label>
              <input type="tel" value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                style={inputStyle} placeholder="09xxxxxxxxx" />
            </div>
            <div>
              <label style={labelStyle}>Order Notes <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                placeholder="Any special instructions..." />
            </div>
          </div>

          <div style={{
            backgroundColor: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: '10px', padding: '14px 16px', marginTop: '16px',
            fontSize: '0.88rem', color: '#0369a1',
          }}>
            💳 You will be redirected to <strong>PayMongo</strong> to complete payment.
            Accepted: GCash, Maya, credit/debit cards.
          </div>

          <button type="submit" disabled={loading} style={{
            backgroundColor: loading ? '#ccc' : '#e94560',
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '16px', width: '100%', marginTop: '16px',
            fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Processing...' : `Pay ₱${cartTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} via PayMongo`}
          </button>
        </form>

        {/* Order Summary */}
        <div style={{ width: '300px', ...cardStyle }}>
          <h5 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>Order Summary</h5>
          {cartItems.map(item => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.88rem', color: '#555', marginBottom: '10px',
              paddingBottom: '10px', borderBottom: '1px solid #f0f0f0',
            }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{item.name}</div>
                <div style={{ color: '#999' }}>× {item.quantity} @ ₱{parseFloat(item.price).toLocaleString('en-PH')}</div>
              </div>
              <div style={{ fontWeight: 600 }}>
                ₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: '8px' }}>
            <span>Products Total</span>
            <span style={{ color: '#e94560' }}>₱{cartTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
          </div>
          {delivery === 'lbc' && (
            <div style={{
              marginTop: '12px', padding: '10px 12px',
              backgroundColor: '#fffbeb', borderRadius: '8px',
              fontSize: '0.82rem', color: '#92400e',
            }}>
              + LBC shipping fee paid COD to rider
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

const cardStyle = {
  backgroundColor: '#fff', borderRadius: '12px',
  padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};
const labelStyle = {
  display: 'block', fontWeight: 600,
  color: '#1a1a2e', marginBottom: '6px', fontSize: '0.9rem',
};
const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #ddd', borderRadius: '8px',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
};
