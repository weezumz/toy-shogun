// Categories.js
// This page allows admins to manage product categories.
// Admins can add, edit, and delete categories.
// Categories are used in the Inventory module to classify products.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Modal, Form, Alert, Spinner, Card, Badge } from 'react-bootstrap';
import { useAuditLog } from '../hooks/useAuditLog';

export default function Categories() {
  // categories: full list fetched from Supabase
  const [categories, setCategories] = useState([]);

  // productCounts: maps category_id to how many products are in it
  const [productCounts, setProductCounts] = useState({});

  // loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // form fields
  const [form, setForm] = useState({ name: '', description: '' });

  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchCategories();
  }, []);

  // fetchCategories: gets all categories and counts products in each
  const fetchCategories = async () => {
    setLoading(true);

    // Fetch categories
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) { setError(error.message); setLoading(false); return; }
    setCategories(data);

    // Fetch product counts per category
    const { data: products } = await supabase
      .from('products')
      .select('category_id');

    if (products) {
      // Count how many products belong to each category
      const counts = {};
      products.forEach(p => {
        if (p.category_id) {
          counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        }
      });
      setProductCounts(counts);
    }

    setLoading(false);
  };

  // openAddModal: resets form and opens modal in add mode
  const openAddModal = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  // openEditModal: populates form with existing category data
  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || '',
    });
    setShowModal(true);
  };

  // handleSubmit: handles both add and edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description || null,
    };

    if (editingCategory) {
      // UPDATE existing category
      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editingCategory.id);

      if (error) { setError(error.message); setSubmitting(false); return; }
      await logAction('UPDATE', 'categories', editingCategory, payload);

    } else {
      // INSERT new category
      const { data, error } = await supabase
        .from('categories')
        .insert([payload])
        .select()
        .single();

      if (error) { setError(error.message); setSubmitting(false); return; }
      await logAction('INSERT', 'categories', null, data);
    }

    setShowModal(false);
    setSubmitting(false);
    fetchCategories();
  };

  // handleDelete: deletes a category after confirmation
  const handleDelete = async (category) => {
    // Warn if category has products assigned to it
    const count = productCounts[category.id] || 0;
    const message = count > 0
      ? `This category has ${count} product(s). Deleting it will unassign those products. Continue?`
      : 'Delete this category?';

    if (!window.confirm(message)) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) { setError(error.message); return; }
    await logAction('DELETE', 'categories', category, null);
    fetchCategories();
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Categories</h4>
          <p className="text-muted small mb-0">Manage product categories</p>
        </div>
        <Button
          onClick={openAddModal}
          style={{ backgroundColor: '#1a1a2e', border: 'none' }}
        >
          + Add Category
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary card */}
      <div className="mb-4">
        <Card className="border-0 shadow-sm" style={{ maxWidth: '160px' }}>
          <Card.Body>
            <div className="text-muted small">Total Categories</div>
            <div className="fs-3 fw-bold">{categories.length}</div>
          </Card.Body>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No categories yet. Click "Add Category" to get started.
                    </td>
                  </tr>
                ) : (
                  categories.map(category => (
                    <tr key={category.id}>
                      <td className="fw-semibold">{category.name}</td>
                      <td className="text-muted small">
                        {category.description || '—'}
                      </td>
                      <td>
                        {/* Show how many products are in this category */}
                        <Badge bg="secondary">
                          {productCounts[category.id] || 0} product(s)
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="me-2"
                          onClick={() => openEditModal(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(category)}
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

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>

            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Gundam"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description <small className="text-muted">(optional)</small></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Gundam model kits and accessories"
              />
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
                {submitting
                  ? <Spinner size="sm" animation="border" />
                  : editingCategory ? 'Save Changes' : 'Add Category'
                }
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
}