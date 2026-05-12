import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Badge, Spinner, Alert, Modal, Card, Row, Col, Form } from 'react-bootstrap';

const STATUS_BADGE = {
  pending: 'warning',
  confirmed: 'primary',
  cancelled: 'danger',
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reservations')
      .select('*, products(name, price, image_url)')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setReservations(data);
    setLoading(false);
  };

  const openReservation = (r) => {
    setSelected(r);
    setAdminNotes(r.admin_notes || '');
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    await supabase
      .from('reservations')
      .update({ status, admin_notes: adminNotes })
      .eq('id', selected.id);
    setSelected(s => ({ ...s, status, admin_notes: adminNotes }));
    fetchReservations();
    setUpdating(false);
  };

  const saveNotes = async () => {
    setUpdating(true);
    await supabase
      .from('reservations')
      .update({ admin_notes: adminNotes })
      .eq('id', selected.id);
    setSelected(s => ({ ...s, admin_notes: adminNotes }));
    fetchReservations();
    setUpdating(false);
  };

  const filtered = filterStatus ? reservations.filter(r => r.status === filterStatus) : reservations;

  const pending = reservations.filter(r => r.status === 'pending').length;
  const confirmed = reservations.filter(r => r.status === 'confirmed').length;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Reservations</h4>
        <Button variant="outline-secondary" size="sm" onClick={fetchReservations}>Refresh</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        {[
          { label: 'Pending', value: pending, color: 'warning' },
          { label: 'Confirmed', value: confirmed, color: 'primary' },
          { label: 'Total', value: reservations.length, color: 'secondary' },
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
        <Form.Select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
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
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">No reservations found.</td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="fw-semibold">{r.products?.name || '—'}</div>
                      <div className="text-muted small">
                        ₱{r.products?.price ? parseFloat(r.products.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
                      </div>
                    </td>
                    <td>
                      <div>{r.customer_email}</div>
                    </td>
                    <td>
                      <Badge bg={r.delivery_method === 'courier' ? 'info' : 'secondary'}>
                        {r.delivery_method === 'courier' ? 'Courier' : 'Pickup'}
                      </Badge>
                    </td>
                    <td><Badge bg={STATUS_BADGE[r.status] || 'secondary'}>{r.status}</Badge></td>
                    <td className="text-muted small">
                      {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <Button size="sm" variant="outline-secondary" onClick={() => openReservation(r)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal show={!!selected} onHide={() => setSelected(null)} centered size="lg">
        {selected && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                Reservation — {selected.products?.name}
                {' '}
                <Badge bg={STATUS_BADGE[selected.status] || 'secondary'}>{selected.status}</Badge>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="mb-3">
                <Col>
                  <div className="text-muted small">Customer</div>
                  <div className="fw-semibold">{selected.customer_email}</div>
                </Col>
                <Col>
                  <div className="text-muted small">Product Price</div>
                  <div className="fw-bold">
                    ₱{selected.products?.price ? parseFloat(selected.products.price).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—'}
                  </div>
                </Col>
                <Col>
                  <div className="text-muted small">Date Reserved</div>
                  <div>{new Date(selected.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </Col>
              </Row>

              <div className="mb-3">
                <div className="text-muted small">Delivery Method</div>
                <Badge bg={selected.delivery_method === 'courier' ? 'info' : 'secondary'} className="mt-1">
                  {selected.delivery_method === 'courier' ? 'Courier Delivery' : 'Store Pickup'}
                </Badge>
                {selected.delivery_address && (
                  <div className="mt-2 p-2 bg-light rounded small">{selected.delivery_address}</div>
                )}
              </div>

              <Form.Group>
                <Form.Label className="fw-semibold">Admin Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add notes for this reservation..."
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              {selected.status === 'pending' && (
                <>
                  <Button variant="outline-danger" onClick={() => updateStatus('cancelled')} disabled={updating}>
                    Cancel Reservation
                  </Button>
                  <Button style={{ backgroundColor: '#1a1a2e', border: 'none' }} onClick={() => updateStatus('confirmed')} disabled={updating}>
                    {updating ? 'Saving...' : 'Confirm Reservation'}
                  </Button>
                </>
              )}
              {selected.status === 'confirmed' && (
                <>
                  <Button variant="outline-danger" onClick={() => updateStatus('cancelled')} disabled={updating}>
                    Cancel
                  </Button>
                  <Button variant="outline-secondary" onClick={saveNotes} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Notes'}
                  </Button>
                </>
              )}
              {selected.status === 'cancelled' && (
                <Button variant="outline-secondary" onClick={saveNotes} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Notes'}
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Layout>
  );
}
