// Dashboard.js
// This is the main dashboard page shown after login.
// It displays real-time summary stats pulled from Supabase:
//   - Total products in inventory
//   - Number of transactions processed today
//   - Total revenue generated today
//   - Number of low stock / out of stock items
// It also shows the 5 most recent transactions in a table.

import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../supabaseClient';
import { Card, Row, Col, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  // Stats shown in the summary cards at the top
  const [stats, setStats] = useState({
    totalProducts: 0,
    transactionsToday: 0,
    revenueToday: 0,
    lowStock: 0,
  });

  // recentTransactions: the 5 most recent transactions for the table
  const [recentTransactions, setRecentTransactions] = useState([]);

  // loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the logged-in user for the welcome message
  const { user } = useAuth();

  // Fetch all dashboard data on page load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Get today's date range in ISO format for filtering transactions
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // QUERY 1: Count total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true }); // head:true means don't return rows, just count

      // QUERY 2: Get today's transactions
      const { data: todayTx } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('created_at', todayStart.toISOString()) // gte = greater than or equal
        .lte('created_at', todayEnd.toISOString())   // lte = less than or equal
        .eq('status', 'completed');

      // QUERY 3: Count low stock and out of stock products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('stock_quantity, reorder_level')
        .or('stock_quantity.eq.0,stock_quantity.lte.reorder_level'); // either out of stock or below reorder level

      // QUERY 4: Get 5 most recent transactions with cashier info
      const { data: recent } = await supabase
        .from('transactions')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate revenue today by summing all completed transaction amounts
      const revenueToday = todayTx?.reduce((sum, tx) => sum + parseFloat(tx.total_amount), 0) || 0;

      // Update stats state with all fetched data
      setStats({
        totalProducts: totalProducts || 0,
        transactionsToday: todayTx?.length || 0,
        revenueToday,
        lowStock: lowStockProducts?.length || 0,
      });

      setRecentTransactions(recent || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // getStatusBadge: returns a colored badge for each transaction status
  const getStatusBadge = (status) => {
    const map = {
      completed: <Badge bg="success">Completed</Badge>,
      voided: <Badge bg="danger">Voided</Badge>,
      refunded: <Badge bg="warning" text="dark">Refunded</Badge>,
    };
    return map[status] || <Badge bg="secondary">{status}</Badge>;
  };

  // getPaymentLabel: returns a readable label for each payment method
  const getPaymentLabel = (method) => {
    const map = {
      cash: '💵 Cash',
      gcash: '📱 GCash',
      paymongo: '💳 PayMongo',
      manual_qr: '📷 Manual QR',
    };
    return map[method] || method;
  };

  return (
    <Layout>
      {/* Welcome header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-0">Dashboard</h4>
        <p className="text-muted small mb-0">
          Welcome back, {user?.email} 👋
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {/* Summary stat cards */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">Total Products</div>
                  <div className="fs-2 fw-bold">{stats.totalProducts}</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Items in inventory
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">Transactions Today</div>
                  <div className="fs-2 fw-bold">{stats.transactionsToday}</div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Completed sales
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">Revenue Today</div>
                  <div className="fs-2 fw-bold text-success">
                    ₱{stats.revenueToday.toFixed(2)}
                  </div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    From completed transactions
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small mb-1">Low / Out of Stock</div>
                  <div className={`fs-2 fw-bold ${stats.lowStock > 0 ? 'text-danger' : 'text-success'}`}>
                    {stats.lowStock}
                  </div>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Items needing restock
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent transactions table */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-3">Recent Transactions</h6>
              <Table hover responsive className="mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th>Date & Time</th>
                    <th>Cashier</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No transactions yet. Process a sale in the POS module.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td className="small">
                          {/* Format the timestamp for Philippine locale */}
                          {new Date(tx.created_at).toLocaleString('en-PH')}
                        </td>
                        <td className="small">
                          {/* Show cashier name or email as fallback */}
                          {tx.users?.full_name || tx.users?.email || '—'}
                        </td>
                        <td className="small">{getPaymentLabel(tx.payment_method)}</td>
                        <td className="fw-bold">₱{parseFloat(tx.total_amount).toFixed(2)}</td>
                        <td>{getStatusBadge(tx.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </Layout>
  );
}