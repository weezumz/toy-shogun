// POS.js
// This is the Point of Sale page — where staff process customer transactions.
// It has two panels:
//   LEFT: product catalog (search + click to add to cart)
//   RIGHT: cart (review items, set quantities, choose payment, checkout)
// On checkout, it:
//   1. Inserts a transaction record
//   2. Inserts transaction_items for each cart item
//   3. Deducts stock from the products table
//   4. Generates a receipt record

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Row, Col, Card, Form, Button, Alert, Badge, Spinner, Table, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useAuditLog } from '../hooks/useAuditLog';

export default function POS() {
  // products: full product catalog fetched from Supabase
  const [products, setProducts] = useState([]);

  // cart: array of items the customer is buying
  // each item = { ...product, cartQty: number }
  const [cart, setCart] = useState([]);

  // search: filters the product catalog by name or SKU
  const [search, setSearch] = useState('');

  // paymentMethod: selected payment type for the transaction
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // loading states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // error and success messages
  const [error, setError] = useState('');
  const [success, ] = useState('');

  // showReceipt: controls whether the receipt modal is visible
  const [showReceipt, setShowReceipt] = useState(false);

  // lastReceipt: stores the completed transaction data for the receipt modal
  const [lastReceipt, setLastReceipt] = useState(null);

  // Get the currently logged-in user (used as cashier_id in the transaction)
  const { user } = useAuth();

  const { logAction } = useAuditLog();

  // Fetch products on page load
  useEffect(() => {
    fetchProducts();
  }, []);

  // fetchProducts: gets all products with stock > 0 from Supabase
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .gt('stock_quantity', 0) // Only show products that are in stock
      .order('name');
    if (error) setError(error.message);
    else setProducts(data);
    setLoadingProducts(false);
  };

  // addToCart: adds a product to the cart, or increments qty if already there
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Product already in cart — increment quantity if stock allows
        if (existing.cartQty >= product.stock_quantity) return prev; // Can't exceed stock
        return prev.map(item =>
          item.id === product.id
            ? { ...item, cartQty: item.cartQty + 1 }
            : item
        );
      }
      // Product not in cart yet — add it with quantity of 1
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  // removeFromCart: removes a product from the cart entirely
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // updateCartQty: sets a specific quantity for a cart item
  const updateCartQty = (productId, qty) => {
    const numQty = parseInt(qty);
    if (numQty <= 0) {
      removeFromCart(productId); // Remove if qty set to 0 or below
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, cartQty: numQty } : item
      )
    );
  };

  // cartTotal: calculates the total price of all items in the cart
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);

  // filteredProducts: filters the product list based on the search input
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // generateReceiptNumber: creates a unique receipt number based on timestamp
  const generateReceiptNumber = () => {
    const now = new Date();
    return `RCP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
  };

  // handleCheckout: processes the full transaction
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }
    setError('');
    setCheckingOut(true);

    try {
      // STEP 1: Insert the transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          cashier_id: user.id,           // Who processed this sale
          total_amount: cartTotal,
          payment_method: paymentMethod,
          status: 'completed',
        }])
        .select()
        .single(); // Return the inserted row

      if (txError) throw txError;

      // STEP 2: Insert transaction_items — one row per cart item
      const items = cart.map(item => ({
        transaction_id: transaction.id,
        product_id: item.id,
        quantity: item.cartQty,
        unit_price: item.price,
        subtotal: item.price * item.cartQty,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // STEP 3: Deduct stock for each product in the cart
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: item.stock_quantity - item.cartQty })
          .eq('id', item.id);
        if (stockError) throw stockError;
      }

      // STEP 4: Generate and insert a receipt record
      const receiptNumber = generateReceiptNumber();
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert([{
          transaction_id: transaction.id,
          receipt_number: receiptNumber,
        }]);

      if (receiptError) throw receiptError;
      
      // Log the completed transaction
await logAction('INSERT', 'transactions', null, {
  total_amount: cartTotal,
  payment_method: paymentMethod,
  items: cart.map(i => ({ name: i.name, qty: i.cartQty, subtotal: i.price * i.cartQty })),
});

      // STEP 5: Show receipt modal with transaction summary
      setLastReceipt({
        receiptNumber,
        items: [...cart],
        total: cartTotal,
        paymentMethod,
        date: new Date().toLocaleString('en-PH'),
        cashier: user.email,
      });
      setShowReceipt(true);

      // STEP 6: Clear cart and refresh product list (to reflect new stock levels)
      setCart([]);
      fetchProducts();

    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <Layout>
      <h4 className="fw-bold mb-4">Point of Sale</h4>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="g-3">
        {/* LEFT PANEL: Product Catalog */}
        <Col md={7}>
          <Card className="border-0  ">
            <Card.Body>
              <h6 className="fw-bold mb-3">Product Catalog</h6>

              {/* Search bar to filter products */}
              <Form.Control
                type="text"
                placeholder="Search by name or Product ID"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mb-3"
              />

              {loadingProducts ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div style={{ maxHeight: '1000px', overflowY: 'auto' }}>
                  <Row className="g-2">
                    {filteredProducts.length === 0 ? (
                      <p className="text-muted text-center py-3">No products found.</p>
                    ) : (
                      filteredProducts.map(product => (
                        <Col md={4} key={product.id}>
                          {/* Product card — click to add to cart */}
                          <Card
                            className="h-100 border"
                            style={{ cursor: 'pointer' }}
                            onClick={() => addToCart(product)}
                          > 
                            {/* Product Image */}
                            <div style={{
                              height: '250px',
                              backgroundColor: '#f0f2f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              borderRadius: '4px 4px 0 0',
                            }}>
                              {product.image_url ? (
                               <img
                                  src={product.image_url}
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                               />
                              ) : (
                                 <span style={{ fontSize: '1.8rem' }}>🎴</span>
                              )}
                            </div>
                            <Card.Body className="p-2">
                              <div className="fw-semibold small">{product.name}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                {product.sku}
                              </div>
                              <div className="fw-bold text-success mt-1">
                                ₱{parseFloat(product.price).toFixed(2)}
                              </div>
                              <Badge
                                bg={product.stock_quantity <= product.reorder_level ? 'warning' : 'secondary'}
                                text="dark"
                                style={{ fontSize: '10px' }}
                              >
                                Stock: {product.stock_quantity}
                              </Badge>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    )}
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT PANEL: Cart & Checkout */}
        <Col md={5}>
          <Card className="border-0  ">
            <Card.Body>
              <h6 className="fw-bold mb-3">
                Cart
                {cart.length > 0 && (
                  // Show item count badge on the Cart heading
                  <Badge bg="dark" className="ms-2">{cart.length} item(s)</Badge>
                )}
              </h6>

              {cart.length === 0 ? (
                <p className="text-muted text-center py-4">
                  Click a product to add it to the cart.
                </p>
              ) : (
                <>
                  {/* Cart items table */}
                  <Table size="sm" className="mb-3">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: '13px' }}>
                              {item.name}
                            </div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>
                              ₱{parseFloat(item.price).toFixed(2)} each
                            </div>
                          </td>
                          <td style={{ width: '70px' }}>
                            {/* Quantity input — updates cart qty on change */}
                            <Form.Control
                              type="number"
                              size="sm"
                              min="1"
                              max={item.stock_quantity}
                              value={item.cartQty}
                              onChange={e => updateCartQty(item.id, e.target.value)}
                            />
                          </td>
                          <td className="fw-bold">
                            ₱{(item.price * item.cartQty).toFixed(2)}
                          </td>
                          <td>
                            {/* Remove item from cart */}
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => removeFromCart(item.id)}
                            >
                              ✕
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Order total */}
                  <div className="d-flex justify-content-between fw-bold fs-5 mb-3 border-top pt-2">
                    <span>Total</span>
                    <span>₱{cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment method selector */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">Payment Method</Form.Label>
                    <Form.Select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">
                         Cash</option>
                      <option value="gcash"> GCash</option>
                    </Form.Select>
                  </Form.Group>

                  {/* Checkout button */}
                  <Button
                    className="w-100 fw-bold"
                    style={{ backgroundColor: '#1a1a2e', border: 'none' }}
                    onClick={handleCheckout}
                    disabled={checkingOut}
                  >
                    {checkingOut
                      ? <Spinner size="sm" animation="border" />
                      : `Checkout — ₱${cartTotal.toFixed(2)}`
                    }
                  </Button>

                  {/* Clear cart button */}
                  <Button
                    variant="outline-secondary"
                    className="w-100 mt-2"
                    onClick={() => setCart([])}
                  >
                    Clear Cart
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Receipt Modal — shown after a successful checkout */}
      <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>✅ Transaction Complete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lastReceipt && (
            <>
              {/* Receipt header */}
              <div className="text-center mb-3">
                <h5 className="fw-bold">⚔️ Toy Shogun</h5>
                <div className="text-muted small">Hobby Shop</div>
                <div className="text-muted small">{lastReceipt.date}</div>
                <div className="fw-semibold">Receipt # {lastReceipt.receiptNumber}</div>
              </div>

              {/* Itemized list of purchased products */}
              <Table size="sm" bordered>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lastReceipt.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.cartQty}</td>
                      <td>₱{(item.price * item.cartQty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Receipt footer */}
              <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-2">
                <span>Total</span>
                <span>₱{lastReceipt.total.toFixed(2)}</span>
              </div>
              <div className="text-muted small mt-2">
                Payment: {lastReceipt.paymentMethod.toUpperCase()}
              </div>
              <div className="text-muted small">
                Cashier: {lastReceipt.cashier}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            style={{ backgroundColor: '#1a1a2e', border: 'none' }}
            onClick={() => setShowReceipt(false)}
          >
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}