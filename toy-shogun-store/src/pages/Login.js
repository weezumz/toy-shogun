import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/account');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(form.email, form.password);
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/account');
  };

  return (
    <PublicLayout>
      <div style={{ maxWidth: '420px', margin: '0 auto', paddingTop: '40px' }}>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Sign In</h2>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '0.95rem' }}>
          Access your orders and reservations.
        </p>

        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              placeholder="juan@email.com"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#888', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#cc0000', fontWeight: 600, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}

const labelStyle = {
  display: 'block', fontWeight: 600,
  color: '#1a1a2e', marginBottom: '6px', fontSize: '0.9rem',
};

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid #ddd', borderRadius: '8px',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
};

const btnStyle = (disabled) => ({
  width: '100%', padding: '14px',
  backgroundColor: disabled ? '#ccc' : '#cc0000',
  color: '#fff', border: 'none', borderRadius: '8px',
  fontWeight: 700, fontSize: '1rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const errorStyle = {
  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: '8px', padding: '12px 16px',
  color: '#dc2626', marginBottom: '16px', fontSize: '0.9rem',
};
