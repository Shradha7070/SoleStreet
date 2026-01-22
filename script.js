// ===== State Management =====
const state = {
  products: [],
  cart: []
};

// ===== LocalStorage Helpers =====
const CART_STORAGE_KEY = 'solestreet_cart';

function saveCartToStorage() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem(CART_STORAGE_KEY);
  if (saved) {
    try {
      state.cart = JSON.parse(saved);
    } catch (e) {
      state.cart = [];
    }
  }
}

// ===== DOM Elements =====
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose = document.getElementById('cartClose');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const header = document.getElementById('header');

// ===== Fetch Products from JSON =====
async function fetchProducts() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to load products');
    state.products = await response.json();
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted);">
        <p>Unable to load products. Please try again later.</p>
      </div>
    `;
  }
}

// ===== Render Products =====
function renderProducts() {
  productsGrid.innerHTML = state.products.map(product => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image-container">
        <span class="product-badge">${product.category}</span>
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-brand">${product.brand}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">$${product.price.toFixed(2)}</span>
          <button class="add-to-cart-btn" data-id="${product.id}" aria-label="Add ${product.name} to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// ===== Cart Functions =====
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = state.cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCartToStorage();
  updateCartUI();
  showToast(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartUI();
  renderCartItems();
}

function updateQuantity(productId, delta) {
  const item = state.cart.find(item => item.id === productId);
  if (!item) return;

  item.quantity += delta;
  
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCartToStorage();
  updateCartUI();
  renderCartItems();
}

function getCartTotal() {
  return state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
  return state.cart.reduce((count, item) => count + item.quantity, 0);
}

// ===== Render Cart =====
function renderCartItems() {
  if (state.cart.length === 0) {
    cartItems.innerHTML = '';
    cartEmpty.classList.add('show');
    cartFooter.classList.add('hidden');
    return;
  }

  cartEmpty.classList.remove('show');
  cartFooter.classList.remove('hidden');

  cartItems.innerHTML = state.cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <div>
          <h4 class="cart-item-name">${item.name}</h4>
          <span class="cart-item-brand">${item.brand}</span>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          <div class="quantity-controls">
            <button class="quantity-btn" data-action="decrease" data-id="${item.id}">−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
          </div>
          <button class="remove-btn" data-id="${item.id}" aria-label="Remove ${item.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function updateCartUI() {
  const count = getCartItemCount();
  cartCount.textContent = count;
  
  if (count > 0) {
    cartCount.classList.add('show');
  } else {
    cartCount.classList.remove('show');
  }

  cartTotal.textContent = `$${getCartTotal().toFixed(2)}`;
}

// ===== Cart Sidebar Toggle =====
function openCart() {
  cartSidebar.classList.add('show');
  cartOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCart() {
  cartSidebar.classList.remove('show');
  cartOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

// ===== Toast Notification =====
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ===== Checkout Simulation =====
function handleCheckout() {
  if (state.cart.length === 0) return;

  const total = getCartTotal().toFixed(2);
  const itemCount = getCartItemCount();

  // Clear cart
  state.cart = [];
  saveCartToStorage();
  updateCartUI();
  renderCartItems();
  closeCart();

  // Show success message
  showToast(`Order placed! Total: $${total} (${itemCount} items)`);
}

// ===== Event Listeners =====
// Cart button
cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Escape key closes cart
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartSidebar.classList.contains('show')) {
    closeCart();
  }
});

// Add to cart (event delegation)
productsGrid.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.add-to-cart-btn');
  if (addBtn) {
    const productId = parseInt(addBtn.dataset.id, 10);
    addToCart(productId);
  }
});

// Cart item actions (event delegation)
cartItems.addEventListener('click', (e) => {
  const quantityBtn = e.target.closest('.quantity-btn');
  const removeBtn = e.target.closest('.remove-btn');

  if (quantityBtn) {
    const productId = parseInt(quantityBtn.dataset.id, 10);
    const action = quantityBtn.dataset.action;
    updateQuantity(productId, action === 'increase' ? 1 : -1);
  }

  if (removeBtn) {
    const productId = parseInt(removeBtn.dataset.id, 10);
    removeFromCart(productId);
  }
});

// Checkout
checkoutBtn.addEventListener('click', handleCheckout);

// Header scroll effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  updateCartUI();
  fetchProducts();
});
