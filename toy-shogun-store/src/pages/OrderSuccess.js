// OrderSuccess.js
// Landing page after successful PayMongo payment.
// PayMongo redirects here after the customer pays.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>
          Order Placed Successfully!
        </h2>
        <p style={{ color: '#666', maxWidth: '480px', margin: '0 auto 32px', lineHeight: '1.6' }}>
          Thank you for your wholesale order! We've received your payment and will
          reach out to confirm your order details and arrange delivery or pickup.
        </p>
        <div style={{
          backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '10px', padding: '16px 24px',
          display: 'inline-block', marginBottom: '32px',
          color: '#166534', fontSize: '0.9rem',
        }}>
          📧 A confirmation will be sent to your email.
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/shop')}
            style={{
              backgroundColor: '#1a1a2e', color: '#fff',
              border: 'none', borderRadius: '8px',
              padding: '12px 28px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/events')}
            style={{
              backgroundColor: '#fff', color: '#1a1a2e',
              border: '2px solid #1a1a2e', borderRadius: '8px',
              padding: '12px 28px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            View Events
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}