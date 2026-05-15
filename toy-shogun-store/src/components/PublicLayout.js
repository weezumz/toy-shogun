import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/shogunlogo.png';

export default function PublicLayout({ children, noPadding = false }) {
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { to: '/shop', label: 'Shop' },
    { to: '/preorders', label: 'Pre-Order' },
    { to: '/events', label: 'Events' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#e6e3e3', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ── */}
      <nav style={{
        backgroundColor: '#1a1a1a',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '2px solid #cc0000',
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Toy Shogun" style={{ height: '48px', objectFit: 'contain' }} />
          {!isMobile && (
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>Toy Shogun</div>
              <div style={{ color: '#cc0000', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1.5px' }}>HOBBY SHOP</div>
            </div>
          )}
        </Link>

        {/* Desktop Nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            {navLinks.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
            {user ? (
              <>
                <NavLink to="/account">My Account</NavLink>
                <button onClick={handleSignOut} style={ghostBtnStyle}>Sign Out</button>
              </>
            ) : (
              <NavLink to="/login">Sign In</NavLink>
            )}
            <CartButton cartCount={cartCount} onClick={() => navigate('/cart')} />
          </div>
        )}

        {/* Mobile: cart + hamburger */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CartButton cartCount={cartCount} onClick={() => navigate('/cart')} />
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#fff', fontSize: '1.6rem', padding: '4px 8px',
                lineHeight: 1,
              }}
              aria-label="Menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobile && menuOpen && (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderBottom: '2px solid #cc0000',
          position: 'sticky',
          top: '70px',
          zIndex: 99,
        }}>
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                display: 'block',
                color: location.pathname === l.to ? '#fff' : '#ccc',
                backgroundColor: location.pathname === l.to ? '#ffffff10' : 'transparent',
                padding: '14px 24px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                borderBottom: '1px solid #ffffff10',
              }}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/account" style={{
                display: 'block', color: '#ccc', padding: '14px 24px',
                textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem',
                borderBottom: '1px solid #ffffff10',
              }}>
                My Account
              </Link>
              <button onClick={handleSignOut} style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'none', border: 'none', color: '#aaa',
                padding: '14px 24px', fontSize: '0.95rem', cursor: 'pointer',
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              display: 'block', color: '#ccc', padding: '14px 24px',
              textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem',
            }}>
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* Page Content */}
      <main style={{
        flex: 1,
        ...(noPadding ? {} : { padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box', width: '100%' })
      }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1a1a1a',
        borderTop: '2px solid #cc0000',
        padding: '40px 24px 20px',
        color: '#aaa',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', gap: '40px', flexWrap: 'wrap',
          justifyContent: 'space-between', marginBottom: '28px',
        }}>
          <div>
            <img src={logo} alt="Toy Shogun" style={{ height: '44px', objectFit: 'contain', marginBottom: '10px' }} />
            <p style={{ color: '#888', fontSize: '0.88rem', maxWidth: '240px', lineHeight: '1.6' }}>
              Your local TCG & hobby shop. Specializing in trading card games and collectibles.
            </p>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '14px', fontSize: '0.9rem' }}>Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <FooterLink to="/shop">Shop</FooterLink>
              <FooterLink to="/preorders">Pre-Orders</FooterLink>
              <FooterLink to="/events">Events</FooterLink>
              <FooterLink to="/cart">Cart</FooterLink>
              <FooterLink to="/account">My Account</FooterLink>
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '14px', fontSize: '0.9rem' }}>Contact Us</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#888', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <div>
                <div style={{ color: '#aaa', fontWeight: 500 }}>Address</div>
                <div>#6 Temple St., Forest Hill Subdivision, Gulod Novaliches, QC</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontWeight: 500 }}>Phone</div>
                <div>[09090909090]</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontWeight: 500 }}>Follow Us</div>
                <a href="https://www.facebook.com/TheToyShogun" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#cc0000', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #333', paddingTop: '18px',
          textAlign: 'center', fontSize: '0.82rem', color: '#555',
          maxWidth: '1200px', margin: '0 auto',
        }}>
          © {new Date().getFullYear()} Toy Shogun — All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function CartButton({ cartCount, onClick }) {
  return (
    <button onClick={onClick} style={{
      backgroundColor: '#cc0000', border: 'none', borderRadius: '8px',
      color: '#fff', padding: '8px 16px', fontWeight: 700,
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      gap: '6px', fontSize: '0.9rem',
    }}>
      Cart
      {cartCount > 0 && (
        <span style={{
          backgroundColor: '#fff', color: '#cc0000',
          borderRadius: '999px', padding: '1px 7px',
          fontSize: '0.72rem', fontWeight: 700,
        }}>
          {cartCount}
        </span>
      )}
    </button>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{ color: '#ccc', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}
      onMouseEnter={e => e.currentTarget.style.color = '#cc0000'}
      onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
    >
      {children}
    </Link>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} style={{ color: '#888', textDecoration: 'none', fontSize: '0.88rem' }}
      onMouseEnter={e => e.currentTarget.style.color = '#cc0000'}
      onMouseLeave={e => e.currentTarget.style.color = '#888'}
    >
      {children}
    </Link>
  );
}

const ghostBtnStyle = {
  background: 'none', border: '1px solid #555', color: '#aaa',
  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
};
