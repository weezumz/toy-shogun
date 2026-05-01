// Inventory.js
// This page handles full CRUD (Create, Read, Update, Delete) for products.
// Admins can add new products, edit existing ones, and delete them.
// Products are fetched from the Supabase 'products' table and displayed in a table.
// Stock status badges are automatically calculated based on reorder levels.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Modal, Form, Alert, Badge, Spinner, Row, Col, Card } from 'react-bootstrap';
import { useAuditLog } from '../hooks/useAuditLog';

export default function Inventory() {
  // products: the full list of products fetched from Supabase
  const [products, setProducts] = useState([]);

  // categories: used to populate the category dropdown in the add/edit form
  const [categories, setCategories] = useState([]);

  // loading: shows a spinner while products are being fetched
  const [loading, setLoading] = useState(true);

  // error: displays any database or validation errors to the user
  const [error, setError] = useState('');

  // showModal: controls whether the add/edit modal is visible
  const [showModal, setShowModal] = useState(false);

  // editingProduct: holds the product being edited, or null if adding a new one
  const [editingProduct, setEditingProduct] = useState(null);

  // form: tracks the values of all input fields in the add/edit modal
  const [form, setForm] = useState({
    name: '', category_id: '', price: '', stock_quantity: '', reorder_level: '5', sku: ''
  });

  // logAction: from useAuditLog hook — records all CRUD actions to audit_logs table
  const { logAction } = useAuditLog();

  // On component mount, fetch products and categories from Supabase
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // fetchProducts: retrieves all products from Supabase, including their category name
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)') // Join with categories table to get category name
      .order('created_at', { ascending: false }); // Newest products first
    if (error) setError(error.message);
    else setProducts(data);
    setLoading(false);
  };

  // fetchCategories: retrieves all categories for the dropdown in the form
  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  // openAddModal: resets the form and opens the modal in "add" mode
  const openAddModal = () => {
    setEditingProduct(null); // No product being edited
    setForm({ name: '', category_id: '', price: '', stock_quantity: '', reorder_level: '5', sku: '' });
    setShowModal(true);
  };

  // openEditModal: populates the form with the selected product's data and opens in "edit" mode
  const openEditModal = (product) => {
    setEditingProduct(product); // Store the product being edited
    setForm({
      name: product.name,
      category_id: product.category_id || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
      sku: product.sku,
    });
    setShowModal(true);
  };

  // handleSubmit: handles both adding a new product and updating an existing one
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setError('');

    // Build the payload to send to Supabase
    // parseFloat and parseInt ensure correct data types for the database
    const payload = {
      name: form.name,
      category_id: form.category_id || null, // null if no category selected
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      reorder_level: parseInt(form.reorder_level),
      sku: form.sku || '', // Empty string triggers auto-SKU generation via database trigger
    };

    if (editingProduct) {
      // UPDATE: modify the existing product record in Supabase
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id); // Only update the row matching this ID
      if (error) { setError(error.message); return; }

      // Log the update — record old and new state for comparison
      await logAction('UPDATE', 'products', editingProduct, payload);

    } else {
      // INSERT: add a new product record to Supabase
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();
      if (error) { setError(error.message); return; }

      // Log the insert — no old data, new data is the inserted product
      await logAction('INSERT', 'products', null, data);
    }

    setShowModal(false);
    fetchProducts(); // Refresh the product list after save
  };

  // handleDelete: removes a product from the database after confirmation
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return; // Ask user to confirm first

    // Store the product before deleting so we can log it
    const productToDelete = products.find(p => p.id === id);

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { setError(error.message); return; }

    // Log the deletion — old data is the deleted product, no new data
    await logAction('DELETE', 'products', productToDelete, null);
    fetchProducts(); // Refresh list after deletion
  };

  // getStockBadge: returns a colored badge based on current stock vs reorder level
  // Out of Stock = red, Low Stock = yellow, In Stock = green
  const getStockBadge = (qty, reorder) => {
    if (qty === 0) return <Badge bg="danger">Out of Stock</Badge>;
    if (qty <= reorder) return <Badge bg="warning" text="dark">Low Stock</Badge>;
    return <Badge bg="success">In Stock</Badge>;
  };

  return (
    <Layout>
      {/* Page header with title and Add Product button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Inventory Management</h4>
        <Button
          onClick={openAddModal}
          style={{ backgroundColor: '#1a1a2e', border: 'none' }}
        >
          + Add Product
        </Button>
      </div>

      {/* Show error message if any operation fails */}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary cards — quick stats at the top of the page */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Total Products</div>
              <div className="fs-3 fw-bold">{products.length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Out of Stock</div>
              <div className="fs-3 fw-bold text-danger">
                {/* Count products where stock is exactly 0 */}
                {products.filter(p => p.stock_quantity === 0).length}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Low Stock</div>
              <div className="fs-3 fw-bold text-warning">
                {/* Count products above 0 but at or below their reorder level */}
                {products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level).length}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Categories</div>
              <div className="fs-3 fw-bold">{categories.length}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product table — shows spinner while loading, table when ready */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  // Empty state — shown when no products exist yet
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No products yet. Click "Add Product" to get started.
                    </td>
                  </tr>
                ) : (
                  // Map over products array and render a row for each
                  products.map(product => (
                    <tr key={product.id}>
                      <td><code>{product.sku}</code></td>
                      <td>{product.name}</td>
                      {/* categories(name) comes from the join in fetchProducts */}
                      <td>{product.categories?.name || '—'}</td>
                      <td>₱{parseFloat(product.price).toFixed(2)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>{getStockBadge(product.stock_quantity, product.reorder_level)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="me-2"
                          onClick={() => openEditModal(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(product.id)}
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

      {/* Add/Edit Modal — reused for both adding and editing products */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          {/* Title changes based on whether we're adding or editing */}
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>

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

            <Form.Group className="mb-3">
              {/* SKU can be left blank — the database trigger will auto-generate it */}
              <Form.Label>SKU <small className="text-muted">(leave blank to auto-generate)</small></Form.Label>
              <Form.Control
                type="text"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. SKU-GUN-1234"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">— Select Category —</option>
                {/* Dynamically render options from the categories fetched from Supabase */}
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
                    type="number"
                    min="0"
                    step="0.01" // Allows decimal values for pesos and centavos
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
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Reorder Level</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={form.reorder_level}
                onChange={e => setForm({ ...form, reorder_level: e.target.value })}
              />
              {/* Helper text explaining what this field does */}
              <Form.Text className="text-muted">
                System will flag as low stock below this quantity.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#1a1a2e', border: 'none' }}
              >
                {/* Button label changes based on add vs edit mode */}
                {editingProduct ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
}