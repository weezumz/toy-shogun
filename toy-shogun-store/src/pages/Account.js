import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function Account() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));

    supabase
      .from('online_orders')
      .select('*')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecentOrders(data || []));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !user) return null;

  const STATUS_COLOR = {
    pending: '#f59e0b', confirmed: '#3b82f6',
    ready: '#06b6d4', completed: '#22c55e', cancelled: '#ef4444',
  };

  return (
    <PublicLayout>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>
              Hi, {profile?.full_name || user.email.split('@')[0]}!
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>{user.email}</p>
          </div>
          <button onClick={handleSignOut} style={{
            background: 'none', border: '1px solid #ddd', color: '#888',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
          }}>
            Sign Out
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'My Orders', desc: 'View all your past orders', to: '/account/orders', icon: '📦' },
            { label: 'Browse Shop', desc: 'Continue shopping', to: '/shop', icon: '🛍️' },
          ].map(card => (
            <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0', cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{card.icon}</div>
                <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>{card.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h5 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Recent Orders</h5>
            <Link to="/account/orders" style={{ color: '#cc0000', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '24px 0', fontSize: '0.9rem' }}>
              No orders yet. <Link to="/shop" style={{ color: '#cc0000', textDecoration: 'none', fontWeight: 600 }}>Start shopping</Link>
            </p>
          ) : (
            recentOrders.map(order => (
              <div key={order.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid #f5f5f5',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' }}>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
                    {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.9rem' }}>
                    ₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{
                    backgroundColor: STATUS_COLOR[order.status] + '22',
                    color: STATUS_COLOR[order.status],
                    padding: '2px 10px', borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
