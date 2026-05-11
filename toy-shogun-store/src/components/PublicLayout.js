// PublicLayout.js
// Shared layout for all public-facing e-commerce pages.
// Red and black theme per client request.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/shogunlogo.png';

export default function PublicLayout({ children, noPadding = false }) {
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#e6e3e3', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ── */}
      <nav style={{
        backgroundColor: '#1a1a1a',
        padding: '0 40px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '2px solid #cc0000',
      }}>
        {/* Logo + Text side by side */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="Toy Shogun" style={{ height: '62px', objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2 }}>
              Toy Shogun
            </div>
            <div style={{ color: '#cc0000', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1.5px' }}>
              HOBBY SHOP
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/preorders">Pre-Order</NavLink>
          <NavLink to="/events">Events</NavLink>

          {/* Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <NavLink to="/account">My Account</NavLink>
              <button onClick={handleSignOut} style={{
                background: 'none', border: '1px solid #555',
                color: '#aaa', padding: '6px 14px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.85rem',
              }}>Sign Out</button>
            </div>
          ) : (
            <NavLink to="/login">Sign In</NavLink>
          )}

          {/* Cart */}
          <button onClick={() => navigate('/cart')} style={{
            backgroundColor: '#cc0000',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            padding: '8px 20px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem',
          }}>
            Cart
            {cartCount > 0 && (
              <span style={{
                backgroundColor: '#fff',
                color: '#cc0000',
                borderRadius: '999px',
                padding: '1px 8px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Page Content with padding ── */}
      <main style={{
  flex: 1,
  ...(noPadding ? {} : { padding: '40px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box', width: '100%' })
}}>
  {children}
</main>

      {/* ── Footer ── */}
      <footer style={{
        backgroundColor: '#1a1a1a',
        borderTop: '2px solid #cc0000',
        padding: '48px 40px 24px',
        color: '#aaa',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '48px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: '32px',
        }}>
          {/* Brand */}
          <div>
            <img src={logo} alt="Toy Shogun" style={{ height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
            <p style={{ color: '#888', fontSize: '0.88rem', maxWidth: '240px', lineHeight: '1.6' }}>
              Your local TCG & hobby shop. Specializing in wholesale trading card games and collectibles.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '16px', fontSize: '0.95rem' }}>
              Quick Links
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FooterLink to="/shop">Shop</FooterLink>
              <FooterLink to="/preorders">Pre-Orders</FooterLink>
              <FooterLink to="/events">Events</FooterLink>
              <FooterLink to="/cart">Cart</FooterLink>
              <FooterLink to="/account">My Account</FooterLink>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '16px', fontSize: '0.95rem' }}>
              Contact Us
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12', color: '#888', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <div>
                <div style={{ color: '#aaa', fontWeight: 500 }}>Address</div>
                <div>#6 Temple St., Forest Hill Subdivision, 
                  Gulod Novaliches, QC</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontWeight: 500 }}>Phone</div>
                <div>[_Contact_Number_]</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontWeight: 500 }}>Follow Us</div>
                <a href="https://www.facebook.com/TheToyShogun" target="_blank" rel="noopener noreferrer" style={{
                  color: '#cc0000',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block',
                  marginTop: '4px',
                }}>
                  Facebook
                </a>
              </div>
            </div>
          </div>

         
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid #333',
          paddingTop: '20px',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#555',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          © {new Date().getFullYear()} Toy Shogun — All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{
      color: '#ccc',
      textDecoration: 'none',
      fontWeight: 500,
      fontSize: '0.95rem',
      transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.target.style.color = '#cc0000'}
      onMouseLeave={e => e.target.style.color = '#ccc'}
    >
      {children}
    </Link>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} style={{
      color: '#888',
      textDecoration: 'none',
      fontSize: '0.88rem',
      transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.target.style.color = '#cc0000'}
      onMouseLeave={e => e.target.style.color = '#888'}
    >
      {children}
    </Link>
  );
}