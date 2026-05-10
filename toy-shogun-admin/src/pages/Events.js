// Events.js (Admin)
// Admins can create, edit, publish/unpublish, and delete events.
// Events are displayed on the public store's Events page.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Button, Modal, Form, Alert, Badge, Spinner, Row, Col, Card } from 'react-bootstrap';
import { useAuditLog } from '../hooks/useAuditLog';
import ImageUpload from '../components/ImageUpload';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    title: '',
    game_type: '',
    description: '',
    event_date: '',
    venue: '',
    entry_fee: '0',
    prize_pool: '',
    image_url: '',
    is_published: false,
  });

  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });
    if (error) setError(error.message);
    else setEvents(data);
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setForm({
      title: '',
      game_type: '',
      description: '',
      event_date: '',
      venue: '',
      entry_fee: '0',
      prize_pool: '',
      image_url: '',
      is_published: false,
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      game_type: event.game_type,
      description: event.description || '',
      // Format datetime for the input field
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      venue: event.venue || '',
      entry_fee: event.entry_fee || '0',
      prize_pool: event.prize_pool || '',
      image_url: event.image_url || '',
      is_published: event.is_published,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      title: form.title,
      game_type: form.game_type,
      description: form.description,
      event_date: form.event_date,
      venue: form.venue,
      entry_fee: parseFloat(form.entry_fee) || 0,
      prize_pool: form.prize_pool,
      image_url: form.image_url,
      is_published: form.is_published,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editingEvent.id);
      if (error) { setError(error.message); return; }
      await logAction('UPDATE', 'events', editingEvent, payload);
    } else {
      const { data, error } = await supabase
        .from('events')
        .insert([payload])
        .select()
        .single();
      if (error) { setError(error.message); return; }
      await logAction('INSERT', 'events', null, data);
    }

    setShowModal(false);
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    const eventToDelete = events.find(e => e.id === id);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    await logAction('DELETE', 'events', eventToDelete, null);
    fetchEvents();
  };


  const upcoming = events.filter(e => new Date(e.event_date) >= new Date()).length;
  const published = events.filter(e => e.is_published).length;

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Events Management</h4>
        <Button onClick={openAddModal} style={{ backgroundColor: '#1a1a2e', border: 'none' }}>
          + Add Event
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Total Events</div>
              <div className="fs-3 fw-bold">{events.length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Upcoming</div>
              <div className="fs-3 fw-bold text-primary">{upcoming}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Published</div>
              <div className="fs-3 fw-bold text-success">{published}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0  ">
            <Card.Body>
              <div className="text-muted small">Unpublshed</div>
              <div className="fs-3 fw-bold text-warning">{events.length - published}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Events Table */}
      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Card className="border-0  ">
          <Card.Body className="p-0">
            <Table   className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>Title</th>
                  <th>Game</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Entry Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No events yet. Click "Add Event" to get started.
                    </td>
                  </tr>
                ) : (
                  events.map(event => (
                    <tr key={event.id}>
                      <td className="fw-semibold">{event.title}</td>
                      <td>
                        <Badge bg="secondary">{event.game_type}</Badge>
                      </td>
                      <td>
                        {new Date(event.event_date).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td>{event.venue || '—'}</td>
                      <td>{event.entry_fee > 0 ? `₱${parseFloat(event.entry_fee).toLocaleString('en-PH')}` : 'Free'}</td>
                      <td>
                        {/* Clickable badge to quickly toggle publish status */}
                        <Badge
                          bg={event.is_published ? 'success' : 'warning'}>
                          {event.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="me-2"
                          onClick={() => openEditModal(event)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(event.id)}
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
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingEvent ? 'Edit Event' : 'Add Event'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="e.g. Yu-Gi-Oh! Tournament"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Game Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.game_type}
                    onChange={e => setForm({ ...form, game_type: e.target.value })} required
                    placeholder="e.g. Pokemon"
                  >
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Event details, rules, format..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Event Date & Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={form.event_date}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Venue</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. Toy Shogun Main Branch"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Entry Fee (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.entry_fee}
                    onChange={e => setForm({ ...form, entry_fee: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prize Pool</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.prize_pool}
                    onChange={e => setForm({ ...form, prize_pool: e.target.value })}
                    placeholder="e.g. ₱10,000 + Trophies"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <ImageUpload
                currentUrl={form.image_url}
                onUpload={(url) => setForm({ ...form, image_url: url })}
                folder="events"
              />
            </Form.Group>

            <Form.Check
              type="switch"
              label="Publish this event (visible on public store)"
              checked={form.is_published}
              onChange={e => setForm({ ...form, is_published: e.target.checked })}
              className="mb-4"
            />

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#1a1a2e', border: 'none' }}>
                {editingEvent ? 'Save Changes' : 'Add Event'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
}