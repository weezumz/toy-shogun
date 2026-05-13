// Login.js
// This is the login page — the first thing unauthenticated users see.
// It uses Supabase Auth to sign users in with email and password.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import logo from '../assets/shogunlogo.png';

export default function Login() {
  // Form field state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // error: displays auth error messages to the user (e.g. wrong password)
  const [error, setError] = useState('');

  // loading: disables the button and shows a spinner while the request is in flight
  const [loading, setLoading] = useState(false);

  // useNavigate lets us redirect the user programmatically after login
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async (e) => {
    // Prevent default form submission (page reload)
    e.preventDefault();
    setError('');
    setLoading(true);

    // Attempt to sign in using Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }} className="d-flex align-items-center">
      <Container style={{ maxWidth: '420px' }}>

        {/* App branding above the login card */}
        <div style={{ padding: '24px 20px', borderBottom:'0px', textAlign:'center'}}>
          <img
            src={logo}
            alt="Toy Shogun"
            style={{ width: '140px', objectFit:
              'contain', marginBottom: '0.1px'}}
          />
        </div>
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: '#1a1a2e' }}>Toy Shogun</h2>
          <p className="text-muted">Hobby Shop Admin</p>
        </div>

        <Card className="  border-0 rounded-4">
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-4 text-center">Sign in to your account</h5>

            {/* Show error alert if login fails */}
            {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-3"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-3"
                />
              </Form.Group>

              {/* Submit button — shows spinner while loading */}
              <Button
                type="submit"
                className="w-100 rounded-3 fw-semibold"
                style={{ backgroundColor: '#1a1a2e', border: 'none' }}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : 'Sign In'}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        <p className="text-center text-muted mt-3" style={{ fontSize: '12px' }}>
          Toy Shogun © 2026 — All rigts reserved  
        </p>
      </Container>
    </div>
  );
}