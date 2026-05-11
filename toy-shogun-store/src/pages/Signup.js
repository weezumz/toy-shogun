import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/account');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    const { error } = await signUp(form.email, form.password, form.full_name);
    if (error) { setError(error.message); setLoading(false); }
    else navigate('/account');
  };

  return (
    <PublicLayout>
      <div style={{ maxWidth: '420px', margin: '0 auto', paddingTop: '40px' }}>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Create Account</h2>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '0.95rem' }}>
          Sign up to place pre-orders and track your orders.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" required
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              style={inputStyle}
              placeholder="Juan dela Cruz"
            />
          </div>
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
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
              placeholder="At least 6 characters"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password" required
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#888', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#cc0000', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
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
