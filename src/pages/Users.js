// Users.js
// This page is ADMIN ONLY — it allows the admin to manage staff accounts.
// Admins can:
//   - View all users in the system
//   - Create new staff or admin accounts
//   - Delete existing accounts
// It uses Supabase Auth to create users and public.users to assign roles.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Modal, Form, Alert, Badge, Spinner, Card } from 'react-bootstrap';

export default function Users() {
  // users: list of all users fetched from public.users
  const [users, setUsers] = useState([]);

  // loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // showModal: controls the add user modal visibility
  const [showModal, setShowModal] = useState(false);

  // form: tracks input fields for creating a new user
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  // submitting: disables button while request is in flight
  const [submitting, setSubmitting] = useState(false);

  // Fetch users on page load
  useEffect(() => {
    fetchUsers();
  }, []);

  // fetchUsers: retrieves all users from public.users table
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setUsers(data);
    setLoading(false);
  };

  // handleCreateUser: creates a new user in Supabase Auth + public.users
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // STEP 1: Create the user in Supabase Auth
      // signUp creates the auth.users record
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      // STEP 2: Insert the user into public.users with their role
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id, // Must match the auth.users id
          full_name: form.full_name,
          email: form.email,
          role: form.role,
        }]);

      if (profileError) throw profileError;

      // Success — close modal and refresh list
      setShowModal(false);
      setForm({ full_name: '', email: '', password: '', role: 'staff' });
      fetchUsers();

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // handleDelete: removes a user from public.users
  // Note: this does not delete from auth.users (requires service_role key)
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? They will lose access to the system.')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) setError(error.message);
    else fetchUsers();
  };

  // getRoleBadge: returns a colored badge for admin vs staff
  const getRoleBadge = (role) => {
    return role === 'admin'
      ? <Badge bg="danger">Admin</Badge>
      : <Badge bg="secondary">Staff</Badge>;
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">User Management</h4>
          <p className="text-muted small mb-0">Admin only — manage staff accounts</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#1a1a2e', border: 'none' }}
        >
          + Add User
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary cards */}
      <div className="d-flex gap-3 mb-4">
        <Card className="border-0 shadow-sm" style={{ minWidth: '140px' }}>
          <Card.Body>
            <div className="text-muted small">Total Users</div>
            <div className="fs-3 fw-bold">{users.length}</div>
          </Card.Body>
        </Card>
        <Card className="border-0 shadow-sm" style={{ minWidth: '140px' }}>
          <Card.Body>
            <div className="text-muted small">Admins</div>
            <div className="fs-3 fw-bold text-danger">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </Card.Body>
        </Card>
        <Card className="border-0 shadow-sm" style={{ minWidth: '140px' }}>
          <Card.Body>
            <div className="text-muted small">Staff</div>
            <div className="fs-3 fw-bold">
              {users.filter(u => u.role === 'staff').length}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td className="small text-muted">
                        {new Date(u.created_at).toLocaleDateString('en-PH')}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(u.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleCreateUser}>

            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                required
                placeholder="e.g. Juan dela Cruz"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                placeholder="staff@toyshogun.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {/* Staff is default — admin should be assigned carefully */}
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#1a1a2e', border: 'none' }}
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" animation="border" /> : 'Create User'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
}