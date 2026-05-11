require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://toy-shogun.vercel.app',
    'https://toy-shogun-admin.vercel.app',
  ],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Toy Shogun Server running' });
});

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
            amount: Math.round(amount * 100),
            description: `Toy Shogun Wholesale Order #${orderId.slice(0, 8).toUpperCase()}`,
            remarks: `Order by ${customerName}`,
            redirect: {
              success: 'https://toy-shogun.vercel.app/', 
              failed: 'https://toy-shogun.vercel.app/checkout',
            }
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

app.post('/webhook/paymongo', async (req, res) => {
  const event = req.body;
  console.log('PayMongo webhook received:', event.data?.attributes?.type);
  if (event.data?.attributes?.type === 'link.payment.paid') {
    const linkId = event.data?.attributes?.data?.attributes?.link_id;
    console.log('Payment confirmed for link:', linkId);
  }
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Toy Shogun Server running on https://toy-shogun-server.vercel.app/`);
});