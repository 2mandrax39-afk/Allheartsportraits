// ===== Sample products for AllHeartsPortraits =====
const products = [
  {
    id: 1,
    title: "Serenity",
    category: "original",
    price: 4200,
    description: "Et stille portræt i sort/hvid. Øjnene er lukkede, og der er en dyb indre ro. Originalt værk på høj kvalitetspapir.",
    size: "40 × 50 cm",
    year: 2025,
    medium: "Kul & pastel på papir",
    badge: "Original"
  },
  {
    id: 2,
    title: "Quiet Strength",
    category: "original",
    price: 4800,
    description: "Portræt af en kvinde i profil. Bløde toner og stærke konturer. Et værk der taler om stille styrke og værdighed.",
    size: "50 × 70 cm",
    year: 2025,
    medium: "Kul på papir",
    badge: "Original"
  },
  {
    id: 3,
    title: "Soft Gaze (Print)",
    category: "print",
    price: 750,
    description: "Limited edition giclée-print. Blødt lys og et indadvendt blik. Nummereret og signeret, kun 30 eksemplarer.",
    size: "30 × 40 cm",
    year: 2025,
    medium: "Giclée print",
    badge: "Print"
  },
  {
    id: 4,
    title: "Profile Study I",
    category: "print",
    price: 650,
    description: "Klassisk profilstudie. Elegant og minimalistisk. Perfekt til det moderne hjem. Signeret print.",
    size: "A3",
    year: 2024,
    medium: "Giclée print",
    badge: "Print"
  },
  {
    id: 5,
    title: "Heart’s Whisper",
    category: "original",
    price: 5500,
    description: "Større originalt portræt med fokus på følelse og tekstur. Arbejdet med lag af kul og hvid pastel.",
    size: "60 × 80 cm",
    year: 2025,
    medium: "Kul & hvid pastel",
    badge: "Original"
  },
  {
    id: 6,
    title: "Gentle Soul (Edition)",
    category: "print",
    price: 890,
    description: "Begrænset edition af 25. Et ømt og intimt portræt. Printet på Hahnemühle museumskvalitetspapir.",
    size: "40 × 50 cm",
    year: 2025,
    medium: "Giclée print",
    badge: "Print"
  },
  {
    id: 7,
    title: "Commission Example – Portrait",
    category: "commission",
    price: 3800,
    description: "Eksempel på bestilt portræt. Pris afhænger af størrelse og teknik. Kontakt mig for personlig bestilling.",
    size: "Efter aftale",
    year: 2025,
    medium: "Kul / pastel / mix",
    badge: "Bestilling"
  },
  {
    id: 8,
    title: "Timeless",
    category: "original",
    price: 3900,
    description: "Klassisk busteportræt i sort/hvid. Inspireret af klassiske skitser, men med moderne følelse.",
    size: "35 × 45 cm",
    year: 2024,
    medium: "Kul på papir",
    badge: "Original"
  }
];

// ===== State =====
let cart = [];
let currentFilter = "all";

// ===== DOM Elements =====
const galleryGrid = document.getElementById("gallery-grid");
const cartCount = document.getElementById("cart-count");
const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutStripeBtn = document.getElementById("checkout-stripe");
const checkoutMobilepayBtn = document.getElementById("checkout-mobilepay");
const productModal = document.getElementById("product-modal");
const productModalBody = document.getElementById("product-modal-body");
const closeCartBtn = document.getElementById("close-cart");
const closeModalBtn = document.getElementById("close-modal");
const filterBtns = document.querySelectorAll(".filter-btn");
const contactForm = document.getElementById("contact-form");

// ===== Render Gallery =====
function renderGallery() {
  const filtered = currentFilter === "all"
    ? products
    : products.filter(p => p.category === currentFilter);

  galleryGrid.innerHTML = filtered.map(product => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image">
        <div class="placeholder">${product.title}</div>
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
      </div>
      <div class="product-info">
        <p class="product-category">${formatCategory(product.category)}</p>
        <h3 class="product-title">${product.title}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.id);
      openProductModal(id);
    });
  });
}

function formatCategory(cat) {
  const map = {
    original: "Original",
    print: "Print",
    commission: "Bestillingsværk"
  };
  return map[cat] || cat;
}

function formatPrice(price) {
  return price.toLocaleString("da-DK") + " kr.";
}

// ===== Filter =====
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderGallery();
  });
});

// ===== Product Modal =====
function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  productModalBody.innerHTML = `
    <div class="modal-image">
      ${product.title}
    </div>
    <div class="modal-details">
      <p class="modal-category">${formatCategory(product.category)}</p>
      <h2 class="modal-title">${product.title}</h2>
      <p class="modal-price">${formatPrice(product.price)}</p>
      <p class="modal-description">${product.description}</p>
      <div class="modal-meta">
        <span><strong>Størrelse:</strong> ${product.size}</span>
        <span><strong>Teknik:</strong> ${product.medium}</span>
        <span><strong>År:</strong> ${product.year}</span>
      </div>
      <button class="btn btn-primary" onclick="addToCart(${product.id})">
        Læg i kurv
      </button>
    </div>
  `;

  productModal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  productModal.classList.remove("open");
  document.body.style.overflow = "";
}

closeModalBtn.addEventListener("click", closeProductModal);
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) closeProductModal();
});

// ===== Cart =====
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  closeProductModal();

  const btn = document.querySelector(".cart-btn");
  btn.style.transform = "scale(1.08)";
  setTimeout(() => btn.style.transform = "", 200);
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Kurven er tom</p>`;
    cartTotal.textContent = "0 kr.";
    checkoutStripeBtn.disabled = true;
    checkoutMobilepayBtn.disabled = true;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-image">${item.title.split(" ")[0]}</div>
        <div class="cart-item-info">
          <p class="cart-item-title">${item.title}</p>
          <p class="cart-item-price">${formatPrice(item.price)} × ${item.qty}</p>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Fjern</button>
        </div>
      </div>
    `).join("");

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartTotal.textContent = formatPrice(total);
    checkoutStripeBtn.disabled = false;
    checkoutMobilepayBtn.disabled = false;
  }
}

// Open cart
document.querySelector(".cart-btn").addEventListener("click", (e) => {
  e.preventDefault();
  cartModal.classList.add("open");
  document.body.style.overflow = "hidden";
});

closeCartBtn.addEventListener("click", () => {
  cartModal.classList.remove("open");
  document.body.style.overflow = "";
});

cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) {
    cartModal.classList.remove("open");
    document.body.style.overflow = "";
  }
});

// ===== Stripe Checkout =====
// Sæt din Publishable Key her (eller i config)
const STRIPE_PUBLISHABLE_KEY = "pk_test_REPLACE_WITH_YOUR_KEY"; // <-- skift denne
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

async function startStripeCheckout() {
  if (cart.length === 0) return;

  checkoutStripeBtn.disabled = true;
  checkoutStripeBtn.textContent = "Sender dig til betaling...";

  try {
    // Priser skal være i øre for Stripe (1 kr = 100 øre)
    const items = cart.map(item => ({
      name: item.title,
      description: item.medium + " · " + item.size,
      price: Math.round(item.price * 100), // kr → øre
      quantity: item.qty
    }));

    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Redirect til Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      // Fallback hvis kun session id returneres
      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      if (result.error) throw new Error(result.error.message);
    }
  } catch (err) {
    console.error(err);
    alert("Noget gik galt med betalingen:\n" + err.message + "\n\nTjek at serveren kører og at dine Stripe-nøgler er sat korrekt.");
    checkoutStripeBtn.disabled = false;
    checkoutStripeBtn.textContent = "Betal med kort (Stripe)";
  }
}

checkoutStripeBtn.addEventListener("click", startStripeCheckout);

// ===== MobilePay =====
// MobilePay/Vipps kræver en erhvervsaftale + backend-integration.
// Indtil det er sat op, sender vi brugeren til kontaktformularen.
checkoutMobilepayBtn.addEventListener("click", () => {
  cartModal.classList.remove("open");
  document.body.style.overflow = "";
  document.getElementById("kontakt").scrollIntoView({ behavior: "smooth" });
  const subject = document.getElementById("subject");
  if (subject) subject.value = "bestilling";
  const msg = document.getElementById("message");
  if (msg) {
    const summary = cart.map(i => "• " + i.title + " × " + i.qty + " (" + formatPrice(i.price) + ")").join("\n");
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    msg.value = "Hej, jeg vil gerne betale med MobilePay.\n\nMine varer:\n" + summary + "\n\nTotal: " + formatPrice(total) + "\n\nMit MobilePay-nummer / navn: ";
  }
  alert("MobilePay er endnu ikke direkte integreret.\n\nDu bliver sendt til kontaktformularen – udfyld dine oplysninger, så aftaler vi MobilePay-betaling manuelt indtil den fulde integration er klar.");
});

// ===== Contact form =====
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Tak for din besked!\n\nJeg vender tilbage hurtigst muligt.\n\n(I den færdige version sendes beskeden direkte til dig.)");
  contactForm.reset();
});

// ===== Mobile menu =====
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.style.display === "flex";
  if (isOpen) {
    navLinks.style.display = "none";
  } else {
    navLinks.style.display = "flex";
    navLinks.style.flexDirection = "column";
    navLinks.style.position = "absolute";
    navLinks.style.top = "100%";
    navLinks.style.left = "0";
    navLinks.style.right = "0";
    navLinks.style.background = "var(--color-bg)";
    navLinks.style.padding = "1.5rem";
    navLinks.style.borderBottom = "1px solid var(--color-border)";
    navLinks.style.gap = "1rem";
    navLinks.style.boxShadow = "0 8px 20px rgba(0,0,0,0.06)";
  }
});

// ===== Init =====
renderGallery();
updateCartUI();
