import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Badge, Spinner, Alert, Modal, Card, Row, Col, Form } from 'react-bootstrap';

const PICKUP_FLOW = {
  pending:   { next: 'confirmed',  label: 'Confirm Order' },
  confirmed: { next: 'ready',      label: 'Mark Ready for Pickup' },
  ready:     { next: 'completed',  label: 'Mark Completed' },
  completed: null,
  cancelled: null,
};

const LBC_FLOW = {
  pending:    { next: 'confirmed',   label: 'Confirm Order' },
  confirmed:  null, // advance via tracking form instead
  handed_off: { next: 'completed',   label: 'Mark Completed' },
  completed:  null,
  cancelled:  null,
};

const STATUS_BADGE = {
  pending: 'warning', confirmed: 'primary', ready: 'info',
  handed_off: 'info', completed: 'success', cancelled: 'danger',
};

const PAYMENT_BADGE = { pending: 'secondary', paid: 'success', failed: 'danger' };

export default function OnlineOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updating, setUpdating] = useState(false);

  // LBC tracking state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('online_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setOrders(data);
    setLoading(false);
  };

  const openOrder = async (order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setReceiptUrl(order.receipt_url || '');
    setLoadingItems(true);
    const { data } = await supabase
      .from('online_order_items')
      .select('*, products(name)')
      .eq('order_id', order.id);
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  const getFlow = (order) =>
    order?.delivery_method === 'lbc' ? LBC_FLOW : PICKUP_FLOW;

  const advanceStatus = async () => {
    const next = getFlow(selectedOrder)[selectedOrder.status]?.next;
    if (!next) return;
    setUpdating(true);
    const { error } = await supabase
      .from('online_orders').update({ status: next }).eq('id', selectedOrder.id);
    if (!error) { setSelectedOrder(o => ({ ...o, status: next })); fetchOrders(); }
    setUpdating(false);
  };

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setUpdating(true);
    await supabase.from('online_orders').update({ status: 'cancelled' }).eq('id', selectedOrder.id);
    setSelectedOrder(o => ({ ...o, status: 'cancelled' }));
    fetchOrders();
    setUpdating(false);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReceipt(true);
    const fileName = `receipts/${selectedOrder.id}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('images').upload(fileName, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      setReceiptUrl(data.publicUrl);
    }
    setUploadingReceipt(false);
  };

  const saveTracking = async () => {
    if (!trackingNumber.trim()) return;
    setUpdating(true);
    await supabase.from('online_orders').update({
      tracking_number: trackingNumber,
      receipt_url: receiptUrl || null,
      status: 'handed_off',
    }).eq('id', selectedOrder.id);
    setSelectedOrder(o => ({ ...o, tracking_number: trackingNumber, receipt_url: receiptUrl, status: 'handed_off' }));
    fetchOrders();
    setUpdating(false);
  };

  const filtered = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;
  const pending   = orders.filter(o => o.status === 'pending').length;
  const confirmed = orders.filter(o => o.status === 'confirmed').length;
  const active    = orders.filter(o => ['confirmed', 'ready', 'handed_off'].includes(o.status)).length;

  const isLBC = selectedOrder?.delivery_method === 'lbc';
  const flow = getFlow(selectedOrder);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Online Orders</h4>
        <Button variant="outline-secondary" size="sm" onClick={fetchOrders}>Refresh</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        {[
          { label: 'Pending',     value: pending,          color: 'warning' },
          { label: 'Active',      value: active,           color: 'primary' },
          { label: 'Total Orders',value: orders.length,    color: 'secondary' },
          { label: 'Confirmed',   value: confirmed,        color: 'info' },
        ].map(s => (
          <Col md={3} key={s.label}>
            <Card className="border-0">
              <Card.Body>
                <div className="text-muted small">{s.label}</div>
                <div className={`fs-3 fw-bold text-${s.color}`}>{s.value}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mb-3">
        <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready for Pickup</option>
          <option value="handed_off">Handed Off (LBC)</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Card className="border-0">
          <Card.Body className="p-0">
            <Table className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Delivery</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="text-center text-muted py-4">No orders found.</td></tr>
                ) : filtered.map(order => (
                  <tr key={order.id}>
                    <td><code style={{ fontSize: '0.75rem' }}>{order.id.slice(0, 8).toUpperCase()}</code></td>
                    <td>
                      <div className="fw-semibold">{order.customer_name}</div>
                      <div className="text-muted small">{order.customer_email}</div>
                    </td>
                    <td className="fw-semibold">₱{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <Badge bg={order.delivery_method === 'lbc' ? 'info' : 'secondary'}>
                        {order.delivery_method === 'lbc' ? 'LBC' : 'Pickup'}
                      </Badge>
                    </td>
                    <td><Badge bg={PAYMENT_BADGE[order.payment_status] || 'secondary'}>{order.payment_status}</Badge></td>
                    <td><Badge bg={STATUS_BADGE[order.status] || 'secondary'}>{order.status}</Badge></td>
                    <td className="text-muted small">
                      {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <Button size="sm" variant="outline-secondary" onClick={() => openOrder(order)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Modal show={!!selectedOrder} onHide={() => setSelectedOrder(null)} centered size="lg">
        {selectedOrder && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                {' '}
                <Badge bg={STATUS_BADGE[selectedOrder.status] || 'secondary'}>{selectedOrder.status}</Badge>
                {' '}
                <Badge bg={isLBC ? 'info' : 'secondary'}>{isLBC ? 'LBC' : 'Pickup'}</Badge>
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Row className="mb-3">
                <Col>
                  <div className="text-muted small">Customer</div>
                  <div className="fw-semibold">{selectedOrder.customer_name}</div>
                  <div className="text-muted small">{selectedOrder.customer_email}</div>
                  {selectedOrder.customer_phone && <div className="text-muted small">{selectedOrder.customer_phone}</div>}
                </Col>
                <Col>
                  <div className="text-muted small">Total Amount</div>
                  <div className="fw-bold fs-5">₱{parseFloat(selectedOrder.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  <Badge bg={PAYMENT_BADGE[selectedOrder.payment_status] || 'secondary'}>{selectedOrder.payment_status}</Badge>
                </Col>
                <Col>
                  <div className="text-muted small">Date Placed</div>
                  <div>{new Date(selectedOrder.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </Col>
              </Row>

              {/* Delivery Address (LBC) */}
              {isLBC && selectedOrder.delivery_address && (
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="text-muted small mb-1">Delivery Address</div>
                  <div>{selectedOrder.delivery_address}</div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="text-muted small mb-1">Customer Notes</div>
                  <div>{selectedOrder.notes}</div>
                </div>
              )}

              {/* LBC Tracking Section */}
              {isLBC && selectedOrder.status === 'confirmed' && (
                <div className="mb-4 p-3 border rounded" style={{ borderColor: '#0dcaf0 !important' }}>
                  <h6 className="fw-bold mb-3">📦 LBC Shipping</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Tracking Number *</Form.Label>
                    <Form.Control
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="e.g. 1234567890"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>LBC Receipt <span className="text-muted">(optional)</span></Form.Label>
                    {receiptUrl && (
                      <div className="mb-2">
                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="small text-primary">
                          View uploaded receipt ↗
                        </a>
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptUpload}
                      disabled={uploadingReceipt}
                    />
                    {uploadingReceipt && <div className="text-muted small mt-1">Uploading...</div>}
                  </Form.Group>
                  <Button
                    onClick={saveTracking}
                    disabled={updating || !trackingNumber.trim() || uploadingReceipt}
                    style={{ backgroundColor: '#0dcaf0', border: 'none', color: '#000' }}
                  >
                    {updating ? 'Saving...' : 'Save Tracking & Mark Shipped'}
                  </Button>
                </div>
              )}

              {/* Show existing tracking info for handed_off / completed LBC */}
              {isLBC && ['handed_off', 'completed'].includes(selectedOrder.status) && (
                <div className="mb-3 p-3 bg-light rounded">
                  <div className="text-muted small mb-1">LBC Tracking</div>
                  <div className="fw-semibold">{selectedOrder.tracking_number || '—'}</div>
                  {selectedOrder.receipt_url && (
                    <a href={selectedOrder.receipt_url} target="_blank" rel="noopener noreferrer" className="small text-primary">
                      View receipt ↗
                    </a>
                  )}
                </div>
              )}

              <h6 className="fw-bold mb-2">Order Items</h6>
              {loadingItems ? (
                <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, i) => (
                      <tr key={i}>
                        <td>{item.products?.name || '—'}</td>
                        <td>{item.quantity}</td>
                        <td>₱{parseFloat(item.unit_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td>₱{parseFloat(item.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Modal.Body>

            <Modal.Footer>
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <Button variant="outline-danger" size="sm" onClick={cancelOrder} disabled={updating}>
                  Cancel Order
                </Button>
              )}
              {/* Only show advance button for non-LBC, or LBC statuses that aren't 'confirmed' */}
              {flow[selectedOrder.status] && !(isLBC && selectedOrder.status === 'confirmed') && (
                <Button style={{ backgroundColor: '#1a1a2e', border: 'none' }} onClick={advanceStatus} disabled={updating}>
                  {updating ? 'Updating...' : flow[selectedOrder.status].label}
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Layout>
  );
}
