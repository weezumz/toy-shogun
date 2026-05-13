import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import logo from '../assets/shogunlogo.png';

export default function Sidebar() {
  const { logout, user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/orders', label: 'Online Orders' },
    { path: '/reservations', label: 'Reservations' },
    { path: '/events', label: 'Events' },
    ...(role === 'admin' ? [{ path: '/users', label: 'User Management' }] : [])
  ];

  const toggleNotifs = () => {
    setShowNotifs(v => !v);
    if (!showNotifs && unreadCount > 0) markAllRead();
  };

  const TYPE_ICON = {
    new_order: '📦',
    payment_confirmed: '💳',
    pickup_ready: '🏪',
    lbc_shipped: '🚚',
    reservation_confirmed: '📋',
    reservation_cancelled: '❌',
    preorder_available: '🎴',
  };
  const timeAgo = (ts) => {
    const mins = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <div style={{
        width: '300px', minHeight: '100vh',
        backgroundColor: '#1a1a2e', color: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '0', position: 'fixed', top: 0, left: 0, zIndex: 200,
      }}>

        {/* Branding + Bell */}
        <div style={{ padding: '24px 20px', borderBottom: '2px solid #ffffff20', textAlign: 'center', position: 'relative' }}>
          {/* Notification Bell */}
          <button
            onClick={toggleNotifs}
            style={{
              position: 'absolute', top: '20px', right: '16px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: '1.2rem', padding: '4px',
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                backgroundColor: '#cc0000', color: '#fff',
                borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                minWidth: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <img src={logo} alt="Toy Shogun" style={{ width: '140px', objectFit: 'contain', marginBottom: '8px' }} />
          <div>
            <h5 className="fw-bold mb-0">Toy Shogun</h5>
            <small style={{ color: '#ffffff80' }}>Hobby Shop Admin System</small>
          </div>
        </div>

        {/* Nav Links */}
        <Nav className="flex-column mt-3" style={{ flex: 1 }}>
          {links.map(link => (
            <Nav.Link
              key={link.path}
              as={Link}
              to={link.path}
              style={{
                color: location.pathname === link.path ? '#fff' : '#ffffff80',
                backgroundColor: location.pathname === link.path ? '#ffffff15' : 'transparent',
                padding: '12px 20px',
                borderLeft: location.pathname === link.path ? '3px solid #fff' : '3px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {link.label}
            </Nav.Link>
          ))}
        </Nav>

        {/* User Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid #ffffff20' }}>
          <small style={{ color: '#ffffff60', display: 'block', marginBottom: '8px' }}>
            {user?.email}
          </small>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            style={{
              background: 'none', border: '1px solid #ffffff40',
              color: '#ffffff80', padding: '6px 16px',
              borderRadius: '6px', cursor: 'pointer', width: '100%',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifs && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowNotifs(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, left: '300px', width: '340px',
            height: '100vh', backgroundColor: '#fff',
            boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
            zIndex: 201, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '20px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h6 style={{ fontWeight: 700, margin: 0, color: '#1a1a2e' }}>Notifications</h6>
              <button
                onClick={() => setShowNotifs(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#aaa' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</div>
                  <div style={{ fontSize: '0.9rem' }}>No notifications yet</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f5f5f5',
                      backgroundColor: n.is_read ? '#fff' : '#fff8f8',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                        {TYPE_ICON[n.type] || '🔔'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.is_read ? 500 : 700, color: '#1a1a2e', fontSize: '0.88rem', marginBottom: '2px' }}>
                          {n.message}
                        </div>
                        <div style={{ color: '#bbb', fontSize: '0.75rem', marginTop: '4px' }}>
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                      {!n.is_read && (
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: '#cc0000', flexShrink: 0, marginTop: '4px',
                        }} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
