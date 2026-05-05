// index.js
// Express server for Toy Shogun.
// Handles PayMongo API calls securely so the secret key
// is never exposed to the browser.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
}));
app.use(express.json());

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ status: 'Toy Shogun Server running' });
});

// ── Create PayMongo Payment Link ──
// Called by Checkout.js after order is saved to Supabase
app.post('/create-payment', async (req, res) => {
  const { amount, orderId, customerName } = req.body;

  if (!amount || !orderId || !customerName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const encoded = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64');

    const response = await axios.post(
      'https://api.paymongo.com/v1/links',
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos
            description: `Toy Shogun Wholesale Order #${orderId.slice(0, 8).toUpperCase()}`,
            remarks: `Order by ${customerName}`,
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encoded}`,
        }
      }
    );

    const paymentLink = response.data.data.attributes.checkout_url;
    const linkId = response.data.data.id;

    res.json({ paymentLink, linkId });

  } catch (err) {
    const errorDetail = err.response?.data?.errors?.[0]?.detail || err.message;
    console.error('PayMongo error:', errorDetail);
    res.status(500).json({ error: errorDetail });
  }
});

// ── PayMongo Webhook ──
// PayMongo calls this URL when a payment is completed
// Set this in your PayMongo dashboard:
// http://your-server-url/webhook/paymongo
app.post('/webhook/paymongo', async (req, res) => {
  const event = req.body;

  console.log('PayMongo webhook received:', event.data?.attributes?.type);

  // We only care about successful payments
  if (event.data?.attributes?.type === 'link.payment.paid') {
    const linkId = event.data?.attributes?.data?.attributes?.link_id;
    console.log('Payment confirmed for link:', linkId);

    // TODO: Update order payment_status to 'paid' in Supabase here
    // You'll need the Supabase service role key for server-side updates
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Toy Shogun Server running on http://localhost:${PORT}`);
});