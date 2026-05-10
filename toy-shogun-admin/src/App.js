// App.js
// This is the root component of the entire React app.
// It sets up routing (which URL shows which page) and wraps everything in AuthProvider.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';


// Page imports — each of these is a full page component
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Events from './pages/Events';

// AuthProvider gives the whole app access to login state
import { AuthProvider, useAuth } from './context/AuthContext';

// PrivateRoute: a wrapper that protects pages from unauthenticated access
// If the user is not logged in, redirect them to /login automatically
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
// Add this below PrivateRoute in App.js
function AdminRoute({ children }) {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role !== 'admin') return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    // AuthProvider must wrap everything so auth state is available everywhere
    <AuthProvider>
      {/* BrowserRouter enables URL-based navigation */}
      <Router>
        <Routes>
          {/* Public route — anyone can access /login */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — only accessible when logged in */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
          <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;