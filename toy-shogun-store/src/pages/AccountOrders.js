import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const STATUS_COLOR = {
  pending: '#f59e0b', confirmed: '#3b82f6',
  ready: '#06b6d4', completed: '#22c55e', cancelled: '#ef4444',
};

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function AccountOrders() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [orderItems, setOrderItems] = useState({});

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('online_orders')
      .select('*')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data || []); setFetching(false); });
  }, [user]);

  const toggleOrder = async (orderId) => {
    if (expanded === orderId) { setExpanded(null); return; }
    setExpanded(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase
        .from('online_order_items')
        .select('*, products(name)')
        .eq('order_id', orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    }
  };

  if (loading || !user) return null;

  return (
    <PublicLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link to="/account" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>← Account</Link>
          <h2 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0 }}>My Orders</h2>
        </div>

        {fetching ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
            <p style={{ color: '#aaa', marginBottom: '16px' }}>You haven't placed any orders yet.</p>
            <Link to="/shop" style={{
              backgroundColor: '#cc0000', color: '#fff', textDecoration: 'none',
              padding: '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem',
            }}>Browse Shop</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(order => (
              <div key={order.id} style={{
                backgroundColor: '#fff', borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
              }}>
                {/* Order Header — clickable to expand */}
                <div
                  onClick={() => toggleOrder(order.id)}
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
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#1a1a2e' }}>
                      ₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{
                      backgroundColor: (STATUS_COLOR[order.status] || '#888') + '22',
                      color: STATUS_COLOR[order.status] || '#888',
                      padding: '3px 12px', borderRadius: '999px',
                      fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                </div>

                {/* Expanded Items */}
                {expanded === order.id && (
                  <div style={{ borderTop: '1px solid #f5f5f5', padding: '16px 20px', backgroundColor: '#fafafa' }}>
                    {!orderItems[order.id] ? (
                      <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Loading items...</p>
                    ) : (
                      <>
                        {orderItems[order.id].map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '0.88rem', color: '#555', marginBottom: '8px',
                          }}>
                            <span>{item.products?.name || '—'} × {item.quantity}</span>
                            <span style={{ fontWeight: 600 }}>
                              ₱{parseFloat(item.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        {order.notes && (
                          <div style={{ marginTop: '12px', color: '#888', fontSize: '0.82rem' }}>
                            Note: {order.notes}
                          </div>
                        )}
                      </>
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
