const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const status = subscription.status === 'active' ? 'active' : subscription.status;
        const periodEnd = new Date(subscription.current_period_end * 1000);

        await pool.query(
          `UPDATE users
           SET stripe_subscription_id = $1, status = $2, subscription_ends_at = $3, updated_at = NOW()
           WHERE stripe_customer_id = $4`,
          [subscription.id, status, periodEnd, customerId]
        );

        console.log(`Suscripción ${status} para customer ${customerId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await pool.query(
          `UPDATE users
           SET status = 'cancelled', stripe_subscription_id = NULL, updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [subscription.customer]
        );
        console.log(`Suscripción cancelada para customer ${subscription.customer}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Pago fallido para customer ${invoice.customer}`);
        // Aquí podrías enviar un email al usuario
        break;
      }
    }
  } catch (err) {
    console.error('Error procesando webhook:', err);
  }

  res.json({ received: true });
});

module.exports = router;
