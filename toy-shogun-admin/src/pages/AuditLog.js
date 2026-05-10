// AuditLog.js
// This page is ADMIN ONLY — it displays a full history of all system actions.
// Each row shows who did what, on which table, and when.
// Admins can expand a row to see the full before/after data in JSON format.
// This is critical for data integrity and academic documentation of RBAC.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Table, Badge, Spinner, Alert, Card, Form, Modal, Button } from 'react-bootstrap';

export default function AuditLog() {
  // logs: all audit log entries fetched from Supabase
  const [logs, setLogs] = useState([]);

  // loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filter: allows filtering by action type (INSERT, UPDATE, DELETE)
  const [filter, setFilter] = useState('all');

  // selectedLog: the log entry currently being viewed in detail
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  // fetchLogs: retrieves all audit logs with the user's name
  const fetchLogs = async () => {
    setLoading(true);



    // Fetch all audit logs with joined user info
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);


    if (error) setError(error.message);
    else setLogs(data);
    setLoading(false);
  };

  // filteredLogs: filters the log list based on selected action type
  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.action === filter);

  // getActionBadge: returns a colored badge for each action type
  const getActionBadge = (action) => {
    const map = {
      INSERT: <Badge bg="success">INSERT</Badge>,
      UPDATE: <Badge bg="warning" text="dark">UPDATE</Badge>,
      DELETE: <Badge bg="danger">DELETE</Badge>,
      TEST: <Badge bg="info">TEST</Badge>,
    };
    return map[action] || <Badge bg="secondary">{action}</Badge>;
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Audit Log</h4>
          <p className="text-muted small mb-0">
            Admin only — full history of all system actions
          </p>
        </div>

        {/* Filter dropdown — filter by action type */}
        <Form.Select
          style={{ width: '160px' }}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <Card className="border-0">
          <Card.Body className="p-0">
            <Table className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      No audit logs yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td className="small text-muted">
                        {new Date(log.created_at).toLocaleString('en-PH')}
                      </td>
                      <td className="small">
                        {log.users?.full_name || log.users?.email || '—'}
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        <code style={{ fontSize: '12px' }}>{log.table_name}</code>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => setSelectedLog(log)}
                        >
                          View
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

      {/* Detail Modal — shows full old_data and new_data as formatted JSON */}
      <Modal
        show={!!selectedLog}
        onHide={() => setSelectedLog(null)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Audit Log Detail — {selectedLog && getActionBadge(selectedLog?.action)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <>
              <p className="text-muted small mb-3">
                <strong>Table:</strong> {selectedLog.table_name} &nbsp;|&nbsp;
                <strong>User:</strong> {selectedLog.users?.full_name || selectedLog.users?.email} &nbsp;|&nbsp;
                <strong>Time:</strong> {new Date(selectedLog.created_at).toLocaleString('en-PH')}
              </p>

              {/* Before state */}
              <h6 className="fw-bold">Before (old_data)</h6>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {selectedLog.old_data
                  ? JSON.stringify(selectedLog.old_data, null, 2)
                  : 'null (new record)'}
              </pre>

              {/* After state */}
              <h6 className="fw-bold mt-3">After (new_data)</h6>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {selectedLog.new_data
                  ? JSON.stringify(selectedLog.new_data, null, 2)
                  : 'null (record deleted)'}
              </pre>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedLog(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}