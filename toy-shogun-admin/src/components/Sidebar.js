// Sidebar.js
// This is the main navigation sidebar shown on all protected pages.
// It displays the app name, navigation links, the logged-in user's email, and a sign out button.

import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/shogunlogo.png';

export default function Sidebar() {
  // Get the logout function and current user from global auth context
  const { logout, user, role } = useAuth();

  // useLocation gives us the current URL path so we can highlight the active link
  const location = useLocation();

  // Navigation links — add new pages here as the app grows
    const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/pos', label: 'Point of Sale' },
    { path: '/events', label: 'Events' },

    //Admin only:
    ...(role === 'admin' ? [
    { path: '/users', label: 'User Management' },
    { path: '/audit', label: 'Audit Log' },
    ] : [])
  ];
console.log('Current role:', role);
  return (
    <div style={{
      width: '300px',
      minHeight: '100vh',
      backgroundColor: '#1a1a2e', // Dark navy — Toy Shogun brand color
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      position: 'fixed', // Stays in place while content scrolls
      top: 0,
      left: 0,
    }}>

      {/* App branding at the top of the sidebar */}
      <div style={{ padding: '24px 20px', borderBottom: '2px solid #ffffff20', textAlign: 'center' }}>
        <img
          src={logo}
          alt="Toy Shogun"
          style={{ width: '140px', objectFit: 'contain', marginBottom: '8px' }}
        />
       <div>
        <h5 className="fw-bold mb-0">Toy Shogun</h5>
        <small style={{ color: '#ffffff80' }}>Hobby Shop Admin System</small>
       </div>
      </div>

      {/* Navigation links — loops through the links array above */}
      <Nav className="flex-column mt-3" style={{ flex: 1 }}>
        {links.map(link => (
          <Nav.Link
            key={link.path}
            as={Link}        // Use React Router's Link instead of a plain <a> tag
            to={link.path}
            style={{
              // Highlight the active link based on current URL
              color: location.pathname === link.path ? '#fff' : '#ffffff80',
              backgroundColor: location.pathname === link.path ? '#ffffff15' : 'transparent',
              padding: '12px 20px',
              // White left border indicates the active page
              borderLeft: location.pathname === link.path ? '3px solid #fff' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {link.label}
          </Nav.Link>
        ))}
      </Nav>

      {/* Bottom section: shows current user's email and sign out button */}
      <div style={{ padding: '20px', borderTop: '1px solid #ffffff20' }}>
        {/* Display the logged-in user's email */}
        <small style={{ color: '#ffffff60', display: 'block', marginBottom: '8px' }}>
          {user?.email}
        </small>

        {/* Sign out button — calls logout() from AuthContext */}
        <button
          onClick={logout}
          style={{
            background: 'none',
            border: '1px solid #ffffff40',
            color: '#ffffff80',
            padding: '6px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}