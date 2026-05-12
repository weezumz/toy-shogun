require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  const type = event.data?.attributes?.type;
  console.log('PayMongo webhook received:', type);

  if (type === 'link.payment.paid') {
    const linkId = event.data?.attributes?.data?.id;
    console.log('Payment confirmed for link:', linkId);

    try {
      const { data: order, error: findError } = await supabase
        .from('online_orders')
        .select('id, status')
        .eq('paymongo_link_id', linkId)
        .single();

      if (findError || !order) {
        console.error('Order not found for link:', linkId);
        return res.sendStatus(200);
      }

      if (order.status !== 'pending') {
        return res.sendStatus(200);
      }

      await supabase
        .from('online_orders')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', order.id);

      const { data: items } = await supabase
        .from('online_order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      if (items?.length) {
        await Promise.all(items.map(item =>
          supabase.rpc('decrement_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          })
        ));
      }

      await supabase
        .from('notifications')
        .insert([{
          type: 'payment_confirmed',
          message: `Payment received — Order #${order.id.slice(0, 8).toUpperCase()}`,
          order_id: order.id,
        }]);

      console.log('Order updated and stock decremented for order:', order.id);
    } catch (err) {
      console.error('Webhook processing error:', err.message);
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Toy Shogun Server running on https://toy-shogun-server.vercel.app/`);
});