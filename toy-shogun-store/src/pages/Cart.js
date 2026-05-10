// Cart.js
// Shows all items currently in the cart.
// Customer can update quantities, remove items, and proceed to checkout.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <PublicLayout>
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}></div>
          <h4 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Your cart is empty</h4>
          <p style={{ color: '#999', marginBottom: '24px' }}>Add some wholesale products to get started.</p>
          <button
            onClick={() => navigate('/shop')}
            style={{
              backgroundColor: '#1a1a2e', color: '#fff',
              border: 'none', borderRadius: '8px',
              padding: '12px 28px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Browse Shop
          </button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '32px' }}>Your Cart</h2>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Cart Items */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          {cartItems.map(item => (
            <div key={item.id} style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}>
              {/* Image */}
              <div style={{
                width: '80px', height: '80px',
                backgroundColor: '#f0f2f5', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2rem' }}>🎴</span>
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ color: '#e94560', fontWeight: 700 }}>
                  ₱{parseFloat(item.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Quantity Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= (item.min_order_qty || 1)}
                  style={qtyBtn}
                >−</button>
                <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                  {item.quantity}
                </span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={qtyBtn}>+</button>
              </div>

              {/* Subtotal */}
              <div style={{ fontWeight: 700, color: '#1a1a2e', minWidth: '80px', textAlign: 'right' }}>
                ₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: 'none', border: 'none', color: '#ccc',
                  cursor: 'pointer', fontSize: '1.2rem', padding: '4px',
                }}
              >✕</button>
            </div>
          ))}

          <button
            onClick={clearCart}
            style={{
              background: 'none', border: 'none', color: '#999',
              cursor: 'pointer', fontSize: '0.85rem', padding: 0,
            }}
          >
            Clear cart
          </button>
        </div>

        {/* Order Summary */}
        <div style={{
          width: '300px', backgroundColor: '#fff',
          borderRadius: '12px', padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <h5 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>Order Summary</h5>

          {cartItems.map(item => (
            <div key={item.id} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.88rem', color: '#555', marginBottom: '8px',
            }}>
              <span>{item.name} × {item.quantity}</span>
              <span>₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}

          <hr style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '24px' }}>
            <span>Total</span>
            <span style={{ color: '#e94560' }}>
              ₱{cartTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            style={{
              backgroundColor: '#e94560', color: '#fff',
              border: 'none', borderRadius: '10px',
              padding: '14px', width: '100%',
              fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
            }}
          >
            Proceed to Checkout 
          </button>

          <button
            onClick={() => navigate('/shop')}
            style={{
              background: 'none', border: 'none', color: '#999',
              cursor: 'pointer', width: '100%', marginTop: '12px',
              fontSize: '0.85rem',
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}

const qtyBtn = {
  width: '32px', height: '32px',
  border: '1px solid #ddd', borderRadius: '6px',
  backgroundColor: '#fff', cursor: 'pointer',
  fontWeight: 700,
};