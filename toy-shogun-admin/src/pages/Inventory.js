// Inventory.js
// Full CRUD for products + category management built-in.
// Admins can set pre-order and published status directly.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Modal, Form, Alert, Badge, Spinner, Row, Col, Card } from 'react-bootstrap';
import ImageUpload from '../components/ImageUpload';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const [form, setForm] = useState({
    name: '', category_id: '', price: '', stock_quantity: '',
    reorder_level: '5', sku: '', image_url: '',
    is_published: false,
    is_preorder: false, preorder_release_date: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setProducts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '', category_id: '', price: '', stock_quantity: '',
      reorder_level: '5', sku: '', image_url: '',
      is_published: false,
      is_preorder: false, preorder_release_date: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category_id: product.category_id || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
      sku: product.sku,
      image_url: product.image_url || '',
      is_published: product.is_published || false,
      is_preorder: product.is_preorder || false,
      preorder_release_date: product.preorder_release_date || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      reorder_level: parseInt(form.reorder_level),
      sku: form.sku || '',
      image_url: form.image_url || null,
      is_published: form.is_published,
      is_preorder: form.is_preorder,
      preorder_release_date: form.is_preorder && form.preorder_release_date
        ? form.preorder_release_date : null,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products').update(payload).eq('id', editingProduct.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase
        .from('products').insert([payload]);
      if (error) { setError(error.message); return; }
    }

    setShowModal(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    fetchProducts();
  };

  // ── Category Management ──
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const payload = { name: categoryForm.name, description: categoryForm.description || null };

    if (editingCategory) {
      const { error } = await supabase
        .from('categories').update(payload).eq('id', editingCategory.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase
        .from('categories').insert([payload]);
      if (error) { setError(error.message); return; }
    }

    setShowCategoryModal(false);
    fetchCategories();
  };

  const handleDeleteCategory = async () => {
    if (!window.confirm(`Delete category "${editingCategory.name}"?`)) return;
    const { error } = await supabase
      .from('categories').delete().eq('id', editingCategory.id);
    if (error) { setError(error.message); return; }
    setShowCategoryModal(false);
    fetchCategories();
  };

  const getStockBadge = (qty, reorder) => {
    if (qty === 0) return <Badge bg="danger">Out of Stock</Badge>;
    if (qty <= reorder) return <Badge bg="warning" text="dark">Low Stock</Badge>;
    return <Badge bg="success">In Stock</Badge>;
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Inventory Management</h4>
        <Button onClick={openAddModal} style={{ backgroundColor: '#1a1a2e', border: 'none' }}>
          + Add Product
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Total Products</div>
              <div className="fs-3 fw-bold">{products.length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Out of Stock</div>
              <div className="fs-3 fw-bold text-danger">
                {products.filter(p => p.stock_quantity === 0).length}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Low Stock</div>
              <div className="fs-3 fw-bold text-warning">
                {products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level).length}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Pre-Orders</div>
              <div className="fs-3 fw-bold text-primary">
                {products.filter(p => p.is_preorder).length}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Categories Section ── */}
      <Card className="border-0   mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Categories</h6>
            <Button
              size="sm"
              onClick={openAddCategory}
              style={{ backgroundColor: '#1a1a2e', border: 'none' }}
            >
              + Add Category
            </Button>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <span className="text-muted small">No categories yet.</span>
            ) : (
              categories.map(cat => (
                <div key={cat.id} style={{
                  backgroundColor: '#f0f2f5', borderRadius: '8px',
                  padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{cat.name}</span>
                  <button
                    onClick={() => openEditCategory(cat)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#666', fontSize: '0.75rem', padding: '0 2px',
                    }}
                  >   Edit</button>
                </div>
              ))
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Card className="border-0  ">
          <Card.Body className="p-0">
            <Table   className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Pre-Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No products yet. Click "Add Product" to get started.
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id}>
                      <td><code>{product.sku}</code></td>
                      <td>{product.name}</td>
                      <td>{product.categories?.name || '—'}</td>
                      <td>₱{parseFloat(product.price).toFixed(2)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>{getStockBadge(product.stock_quantity, product.reorder_level)}</td>
                      <td>
                        <Badge
                          bg={product.is_published ? 'success' : 'secondary'}>
                          {product.is_published ? 'Published' : 'Unpublished'}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={product.is_preorder ? 'warning' : 'secondary'}>
                          {product.is_preorder ? 'Pre-Order' : 'Available'}
                        </Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-secondary" className="me-2"
                          onClick={() => openEditModal(product)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline-danger"
                          onClick={() => handleDelete(product.id)}>
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

      {/* ── Add/Edit Product Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Gundam RX-78"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Product ID <small className="text-muted">(auto generate ifblank)</small></Form.Label>
                  <Form.Control
                    type="text"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    placeholder="ID"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">— Select Category —</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₱)</Form.Label>
                  <Form.Control
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Quantity</Form.Label>
                  <Form.Control
                    type="number" min="0"
                    value={form.stock_quantity}
                    onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Reorder Level</Form.Label>
                  <Form.Control
                    type="number" min="0"
                    value={form.reorder_level}
                    onChange={e => setForm({ ...form, reorder_level: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* ── Store Settings ── */}
            <Card className="border-0 bg-light p-3 mb-3">
              <div className="fw-semibold mb-2 small text-muted">STORE SETTINGS</div>
              <Row>
                <Col>
                  <Form.Check
                    type="switch"
                    label="Published (visible on store)"
                    checked={form.is_published}
                    onChange={e => setForm({ ...form, is_published: e.target.checked })}
                  />
                </Col>
                <Col>
                  <Form.Check
                    type="switch"
                    label="Pre-Order"
                    checked={form.is_preorder}
                    onChange={e => setForm({ ...form, is_preorder: e.target.checked })}
                  />
                </Col>
              </Row>

              {form.is_preorder && (
                <Form.Group className="mt-3">
                  <Form.Label>Expected Release Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.preorder_release_date}
                    onChange={e => setForm({ ...form, preorder_release_date: e.target.value })}
                  />
                </Form.Group>
              )}
            </Card>

            <Form.Group className="mb-3">
              <Form.Label>Product Image</Form.Label>
              <ImageUpload
                currentUrl={form.image_url}
                onUpload={(url) => setForm({ ...form, image_url: url })}
                folder="products"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#1a1a2e', border: 'none' }}>
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ── Add/Edit Category Modal ── */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? 'Edit Category' : 'Add Category'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCategorySubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                placeholder="e.g. Pokémon"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description <small className="text-muted">(optional)</small></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={categoryForm.description}
                onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="e.g. Pokémon TCG products"
              />
            </Form.Group>
            <div className="d-flex justify-content-between gap-2 mt-3">
              {/* Delete only shows when editing an existing category */}
              {editingCategory && (
                <Button
                  variant="outline-danger"
                  onClick={handleDeleteCategory}
                >
                  Delete Category
                </Button>
              )}
              <div className="d-flex gap-2 ms-auto">
                <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" style={{ backgroundColor: '#1a1a2e', border: 'none' }}>
                  {editingCategory ? 'Save Changes' : 'Add Category'}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
}