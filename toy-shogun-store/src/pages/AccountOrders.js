import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  ready: '#06b6d4',
  handed_off: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const PAYMENT_COLOR = {
  pending: '#f59e0b',
  paid: '#22c55e',
  failed: '#ef4444',
};

export default function AccountOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (!user) return;

    supabase
      .from('online_orders')
      .select('*, online_order_items(quantity, unit_price, subtotal, products(name))')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  return (
    <PublicLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <Link to="/account" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← My Account
          </Link>
        </div>

        <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '24px' }}>My Orders</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', padding: '48px',
            textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
            <div style={{ color: '#888', marginBottom: '16px' }}>No orders yet.</div>
            <Link to="/shop" style={{
              backgroundColor: '#cc0000', color: '#fff', textDecoration: 'none',
              padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
            }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(order => (
              <div key={order.id} style={{
                backgroundColor: '#fff', borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                {/* Order Header */}
                <div
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: '2px' }}>
                      {new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' · '}{order.delivery_method === 'courier' ? 'Courier Delivery' : 'Store Pickup'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1a1a2e' }}>
                        ₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <StatusPill color={STATUS_COLOR[order.status]}>{order.status}</StatusPill>
                        <StatusPill color={PAYMENT_COLOR[order.payment_status]}>{order.payment_status}</StatusPill>
                      </div>
                    </div>
                    <span style={{ color: '#bbb', fontSize: '0.8rem' }}>
                      {expanded === order.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded Items */}
                {expanded === order.id && (
                  <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 20px', backgroundColor: '#fafafa' }}>
                    {order.delivery_address && (
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 600 }}>Deliver to: </span>{order.delivery_address}
                      </div>
                    )}
                    {order.tracking_number && (
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 600 }}>Tracking #: </span>{order.tracking_number}
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ color: '#aaa', textAlign: 'left' }}>
                          <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Item</th>
                          <th style={{ paddingBottom: '8px', fontWeight: 600, textAlign: 'center' }}>Qty</th>
                          <th style={{ paddingBottom: '8px', fontWeight: 600, textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.online_order_items || []).map((item, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '8px 0', color: '#1a1a2e' }}>{item.products?.name || '—'}</td>
                            <td style={{ padding: '8px 0', textAlign: 'center', color: '#666' }}>×{item.quantity}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: '#1a1a2e' }}>
                              ₱{parseFloat(item.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #f0f0f0' }}>
                          <td colSpan={2} style={{ padding: '10px 0', fontWeight: 700, color: '#1a1a2e' }}>Total</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: '#cc0000', fontSize: '1rem' }}>
                            ₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                    {order.notes && (
                      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#888' }}>
                        <span style={{ fontWeight: 600 }}>Notes: </span>{order.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function StatusPill({ color, children }) {
  return (
    <span style={{
      backgroundColor: color + '22',
      color,
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {children}
    </span>
  );
}
