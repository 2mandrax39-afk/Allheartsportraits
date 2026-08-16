/**
 * AllHeartsPortraits – Stripe backend + e-mailbekræftelse
 *
 * Kør: npm install && node server.js
 */

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4242;

// Stripe webhook skal have raw body – derfor denne rækkefølge
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Uden webhook secret (kun til lokal test uden Stripe CLI)
        event = JSON.parse(req.body.toString());
        console.warn('⚠️  Ingen STRIPE_WEBHOOK_SECRET – webhook er ikke verificeret');
      }
    } catch (err) {
      console.error('Webhook signature fejl:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Betaling gennemført:', session.id);
      try {
        await sendOrderConfirmation(session);
      } catch (emailErr) {
        console.error('E-mail fejl:', emailErr.message);
      }
    }

    res.json({ received: true });
  }
);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ---------- E-mail transporter ----------
function createTransporter() {
  // Understøtter både SMTP og Gmail
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Gmail (kræver "App-adgangskode")
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return null;
}

// ---------- HTML e-mail skabelon ----------
function buildOrderEmail(session, lineItems) {
  const customerName = session.customer_details?.name || 'Kære kunde';
  const customerEmail = session.customer_details?.email || '';
  const amount = ((session.amount_total || 0) / 100).toLocaleString('da-DK');
  const orderId = session.id.slice(-8).toUpperCase();

  const itemsHtml = (lineItems || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:15px;">
          ${item.description || item.price?.product?.name || 'Værk'}
          ${item.quantity > 1 ? ` × ${item.quantity}` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:15px;">
          ${((item.amount_total || 0) / 100).toLocaleString('da-DK')} kr.
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="da">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background:#1a1a1a;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#f0eeea;font-size:22px;font-weight:400;letter-spacing:0.02em;">
        AllHeartsPortraits
      </h1>
      <p style="margin:8px 0 0;color:#a8a49c;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">
        Portrætkunst med hjerte
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="font-size:18px;color:#1a1a1a;margin:0 0 16px;">
        Tak for din bestilling, ${customerName}
      </p>
      <p style="font-size:15px;color:#5c5c5c;line-height:1.6;margin:0 0 28px;">
        Din betaling er modtaget. Jeg pakker dit værk med omhu og kontakter dig snart angående forsendelse.
      </p>

      <p style="font-size:13px;color:#999;margin:0 0 8px;letter-spacing:0.05em;">
        ORDRE #${orderId}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        ${itemsHtml || '<tr><td style="padding:10px 0;color:#5c5c5c;">Dine varer</td></tr>'}
        <tr>
          <td style="padding:14px 0 0;font-size:16px;font-weight:600;">Total</td>
          <td style="padding:14px 0 0;text-align:right;font-size:16px;font-weight:600;">
            ${amount} kr.
          </td>
        </tr>
      </table>

      <p style="font-size:14px;color:#5c5c5c;line-height:1.6;margin:0;">
        Har du spørgsmål? Svar blot på denne e-mail eller skriv til mig via hjemmesiden.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f5f3f0;padding:24px 40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">
        © ${new Date().getFullYear()} AllHeartsPortraits<br>
        Denne e-mail er sendt til ${customerEmail}
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ---------- Send bekræftelse ----------
async function sendOrderConfirmation(session) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('⚠️  Ingen e-mail-konfiguration fundet (SMTP/Gmail). Springer e-mail over.');
    return;
  }

  // Hent line items for flot oversigt
  let lineItems = [];
  try {
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });
    lineItems = fullSession.line_items?.data || [];
  } catch (e) {
    console.warn('Kunne ikke hente line items:', e.message);
  }

  const customerEmail = session.customer_details?.email;
  if (!customerEmail) {
    console.warn('Ingen e-mail på session – springer over');
    return;
  }

  const html = buildOrderEmail(session, lineItems);
  const amount = ((session.amount_total || 0) / 100).toLocaleString('da-DK');

  // E-mail til kunden
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER,
    to: customerEmail,
    subject: `Tak for din bestilling – AllHeartsPortraits (${amount} kr.)`,
    html,
  });
  console.log(`📧 Bekræftelse sendt til ${customerEmail}`);

  // Notifikation til dig (kunstneren)
  const artistEmail = process.env.ARTIST_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER;
  if (artistEmail && artistEmail !== customerEmail) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER || process.env.SMTP_USER,
      to: artistEmail,
      subject: `Ny ordre – AllHeartsPortraits (${amount} kr.)`,
      html: `
        <p>Ny betaling modtaget!</p>
        <p><strong>Kunde:</strong> ${session.customer_details?.name || '–'} (${customerEmail})</p>
        <p><strong>Beløb:</strong> ${amount} kr.</p>
        <p><strong>Session ID:</strong> ${session.id}</p>
        <p>Log ind i Stripe Dashboard for flere detaljer.</p>
      `,
    });
    console.log(`📧 Notifikation sendt til dig (${artistEmail})`);
  }
}

// ---------- Create Checkout Session ----------
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Ingen varer i kurven' });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'dkk',
        product_data: {
          name: item.name,
          description: item.description || undefined,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity || 1,
    }));

    const origin = req.headers.origin || `http://localhost:${PORT}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?cancelled=true`,
      locale: 'da',
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['DK', 'NO', 'SE', 'DE', 'GB'],
      },
      customer_email: undefined, // Stripe beder selv om e-mail
      metadata: {
        shop: 'AllHeartsPortraits',
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Session status (til success-siden) ----------
app.get('/session-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json({
      status: session.status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Manuel test-endpoint (valgfrit) ----------
app.post('/test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Ikke tilladt i produktion' });
  }
  try {
    const fakeSession = {
      id: 'cs_test_manual_' + Date.now(),
      amount_total: 420000,
      customer_details: {
        name: 'Test Person',
        email: req.body.email || process.env.ARTIST_EMAIL || process.env.GMAIL_USER,
      },
    };
    await sendOrderConfirmation(fakeSession);
    res.json({ ok: true, message: 'Test-e-mail sendt' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🎨 AllHeartsPortraits kører på http://localhost:${PORT}`);
  console.log(`   Webhook endpoint: POST /webhook`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('   ⚠️  STRIPE_SECRET_KEY mangler i .env');
  }
  if (!process.env.SMTP_HOST && !process.env.GMAIL_USER) {
    console.log('   ⚠️  Ingen e-mail sat op endnu (se .env.example)');
  }
  console.log('');
});
