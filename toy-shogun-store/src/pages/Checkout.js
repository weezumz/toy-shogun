// Checkout.js
// Customer fills in contact details, reviews their order, and pays via PayMongo.
// On submit: creates online_order + online_order_items in Supabase,
// then creates a PayMongo payment link and redirects the customer.

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
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
  });

  // Redirect to cart if empty
 useEffect(() => {
  if (cartItems.length === 0) {
    navigate('/cart');
  }
}, [cartItems, navigate]);

if (cartItems.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Insert the order into Supabase
      const { data: order, error: orderError } = await supabase
        .from('online_orders')
        .insert([{
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          notes: form.notes,
          total_amount: cartTotal,
          payment_method: 'paymongo',
          payment_status: 'pending',
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // 2. Insert all order items
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

      // 3. Create PayMongo payment link via server
      const serverRes = await fetch('https://toy-shogun-server.onrender.com/', {
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

      // 4. Save the PayMongo link ID to the order
      await supabase
        .from('online_orders')
        .update({ paymongo_link_id: linkId })
        .eq('id', order.id);

      // 5. Clear cart and redirect to PayMongo payment page
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
        Back to Cart
      </button>

      <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '32px' }}>Checkout</h2>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: '300px' }}>
          <div style={cardStyle}>
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
              <input
                type="text"
                required
                value={form.customer_name}
                onChange={e => setForm({ ...form, customer_name: e.target.value })}
                style={inputStyle}
                placeholder="Juan dela Cruz"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email"
                required
                value={form.customer_email}
                onChange={e => setForm({ ...form, customer_email: e.target.value })}
                style={inputStyle}
                placeholder="juan@email.com"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                style={inputStyle}
                placeholder="09xxxxxxxxx"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Order Notes <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                placeholder="Any special instructions..."
              />
            </div>
          </div>

          {/* Payment Note */}
          <div style={{
            backgroundColor: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: '10px', padding: '16px', marginTop: '16px',
            fontSize: '0.88rem', color: '#0369a1',
          }}>
            💳 You will be redirected to <strong>PayMongo</strong> to complete payment securely.
            Accepted: GCash, Maya, credit/debit cards.
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : '#e94560',
              color: '#fff', border: 'none', borderRadius: '10px',
              padding: '16px', width: '100%', marginTop: '20px',
              fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
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
            <span>Total</span>
            <span style={{ color: '#e94560' }}>
              ₱{cartTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
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
  fontSize: '0.95rem', outline: 'none',
  boxSizing: 'border-box',
};