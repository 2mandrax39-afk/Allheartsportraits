# AllHeartsPortraits – Webshop

Portræt-webshop med **Stripe**, **MobilePay-forberedelse** og **automatisk e-mailbekræftelse**.

---

## Hurtig start

```bash
npm install
cp .env.example .env
# Rediger .env med dine nøgler (se nedenfor)
npm start
```

Åbn http://localhost:4242

Husk også at sætte `STRIPE_PUBLISHABLE_KEY` i `script.js`.

---

## 1. Stripe

1. Opret konto på [stripe.com](https://stripe.com)
2. Hent **test-nøgler** under Developers → API keys
3. Sæt dem i `.env` og i `script.js`

**Testkort:** `4242 4242 4242 4242`

---

## 2. E-mailbekræftelse

Når en betaling går igennem, sender systemet automatisk:

- En flot **ordrebekræftelse** til kunden
- En **notifikation** til dig (kunstneren)

### Opsætning med Gmail (nemmest)

1. Aktivér 2-trins bekræftelse på din Google-konto
2. Opret en **App-adgangskode**:  
   https://myaccount.google.com/apppasswords
3. Sæt i `.env`:

```env
GMAIL_USER=din@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
ARTIST_EMAIL=din@email.dk
EMAIL_FROM="AllHeartsPortraits <din@gmail.com>"
```

### Opsætning med anden SMTP (SendGrid, Mailgun osv.)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=din_api_key
EMAIL_FROM="AllHeartsPortraits <noreply@ditdomæne.dk>"
ARTIST_EMAIL=din@email.dk
```

### Webhook (nødvendig for automatiske e-mails)

E-mails sendes via Stripe webhook når betalingen er gennemført.

**Lokalt (anbefalet under udvikling):**

```bash
# Installer Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:4242/webhook
```

Kopiér den `whsec_...` secret som CLI’en viser, og sæt den i `.env` som `STRIPE_WEBHOOK_SECRET`.

**I produktion:**

1. Gå til Stripe Dashboard → Developers → Webhooks
2. Tilføj endpoint: `https://dit-domæne.dk/webhook`
3. Vælg event: `checkout.session.completed`
4. Kopiér signing secret til `STRIPE_WEBHOOK_SECRET`

### Test e-mail uden betaling

```bash
curl -X POST http://localhost:4242/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"din@email.dk"}'
```

---

## 3. MobilePay

Knappen findes i kurven. Fordi Vipps MobilePay kræver erhvervsaftale, sender den lige nu kunden til kontaktformularen med kurven udfyldt.  
Når du har aftale, kan vi tilføje den rigtige API.

---

## Filer

```
├── index.html
├── styles.css
├── script.js
├── server.js          ← Stripe + webhook + e-mail
├── success.html
├── package.json
├── .env.example
├── logo.webp
└── README.md
```

---

## Publicér

Anbefalet: **Railway**, **Render** eller **Fly.io** (understøtter webhooks godt).

Husk at sætte alle environment variables i hosting-panelet.

---

## Tjekliste

- [ ] Stripe test-nøgler sat
- [ ] Gmail / SMTP sat op
- [ ] Stripe CLI webhook kører lokalt
- [ ] Test-betaling + tjek at e-mail ankommer
- [ ] Erstat eksempel-værker med dine egne

Sig til hvis du vil have hjælp til deploy eller yderligere tilpasning af e-mailskabelonen!
