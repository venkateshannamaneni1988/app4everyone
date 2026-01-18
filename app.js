let allProducts = [];
// ===============================
// SHOPS CONFIG (SAME MENU SHEET)
// ===============================
const shops = {
  kk: {
    name: "K K Store",
    location: "Dharmavaram",
    whatsapp: "917795562130"
  },
  svk: {
    name: "Sri Venkateswara Kirana Store",
    location: "Dharmavaram",
    whatsapp: "917795562130"
  },
  balaji: {
    name: "Balaji Kirana Store",
    location: "Dharmavaram",
    whatsapp: "917795562130"
  },
  vjfoods: {
    name: "VJ FOODS",
    location: "Bangalore",
    whatsapp: "91861824576",
    sheetId: "1BXpFSu7yCVs-VvMQtp0LzjEjU_D4_Y2yiCEYWihg8SY"
  },
  ssmedicals: {
    name: "Shiridi sai medicals",
    location: "Kothacheruvu",
    whatsapp: "918790367637",
    sheetId: "1CwQvpGm8jcpKToE9f5rrOX87Dgkv_4BAUq7ERnoEao8"
  }
};

function generatePickupCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

// ===============================
// READ SHOP FROM URL
// ===============================
function getShopKey() {
  const params = new URLSearchParams(window.location.search);
  return params.get("shop") || "kk";
}

let currentShopKey = getShopKey();
let shop = shops[currentShopKey] || shops.kk;

// ===============================
// ORDER INTENT TRACKING
// ===============================
function trackOrderIntent(itemsText, total, pickupTime) {
  console.log("🔥 trackOrderIntent called");

  const formUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSeFC7MBahIfrH4GsIXWdILKfzs83yfihtQ7Uw7aJiKS4JGfXw/formResponse";

  const data = new FormData();
  data.append("entry.376479344", new Date().toISOString()); // timestamp
  data.append("entry.361876883", currentShopKey);           // shop_key
  data.append("entry.1677708277", shop.name);               // shop_name
  data.append("entry.1711734285", shop.location);           // city
  data.append("entry.1764806945", itemsText);               // items
  data.append("entry.205186095", total);                    // total ✅
  data.append("entry.1552637072", pickupTime);              // pickup_time
  data.append("entry.1587844795", currentLang);             // language

  fetch(formUrl, {
    method: "POST",
    mode: "no-cors",
    body: data
  });
}

//============= Gallery Logic============

let galleryImages = [];
let galleryIndex = 0;

function openGalleryFromElement(el) {
  const images = el.dataset.images
    ? el.dataset.images.split(",")
    : ["placeholder.png"];

  galleryImages = images;
  galleryIndex = 0;
  showGalleryImage();
}

function showGalleryImage() {
  const modal = document.getElementById("imageModal");
  const img = document.getElementById("modalImage");

  img.src = "images/" + galleryImages[galleryIndex];
  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}


//============End===========================

// ===============================
// SHOP DROPDOWN
// ===============================
function initShopDropdown() {
  const select = document.getElementById("shopSelect");
  if (!select) return;

  select.innerHTML = "";

  Object.keys(shops).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = shops[key].name;
    select.appendChild(option);
  });

  // select current shop
  select.value = currentShopKey;
}


function onShopChange(shopKey) {
  if (!shops[shopKey]) return;

  currentShopKey = shopKey;
  shop = shops[shopKey];

  // reset cart
  for (let key in cart) delete cart[key];

  renderShopInfo();
  renderCart();
  loadMenu();

  const newUrl =
    window.location.pathname + "?shop=" + shopKey;
  window.history.replaceState({}, "", newUrl);
}

// ===============================
// GOOGLE SHEET (MENU)
// ===============================
const DEFAULT_SHEET_ID  = "1Fyyky7aA8sKCBMycHoc6Yyw0IqmonSX2iGlfQigTUTg";
function getSheetUrl() {
  const sid = shop.sheetId || DEFAULT_SHEET_ID;
  return (
    "https://docs.google.com/spreadsheets/d/" +
    sid +
    "/gviz/tq?tqx=out:json"
  );
}

// ===============================
// LANGUAGE SETUP
// ===============================
let currentLang = "en";

const translations = {
  en: {
    menu: "Menu",
    cart: "Cart",
    pickupTime: "Pickup Time",
    orderBtn: "Order on WhatsApp",
    total: "Total (approx)",
    note: "Final price as per shop"
  },
  te: {
    menu: "మెను",
    cart: "కార్ట్",
    pickupTime: "పికప్ సమయం",
    orderBtn: "వాట్సాప్ లో ఆర్డర్",
    total: "మొత్తం (అంచనా)",
    note: "చివరి ధర దుకాణం ప్రకారం ఉంటుంది"
  }
};

// ===============================
// STATE
// ===============================
const cart = {};

// ===============================
// RENDER SHOP INFO
// ===============================
function renderShopInfo() {
  document.getElementById("shopInfo").innerText =
    shop.name + ", " + shop.location;
}
function applyFilters() {
  const searchText =
    document.getElementById("searchInput").value.toLowerCase();

  const selectedCategory =
    document.getElementById("categoryFilter").value;

  const filtered = allProducts.filter(r => {
    const item = r.c[0]?.v || "";
    const category = r.c[1]?.v || "";
    const available = r.c[4]?.v;

    if (available !== "yes") return false;
    if (
      selectedCategory !== "all" &&
      category !== selectedCategory
    )
      return false;

    if (!item.toLowerCase().includes(searchText)) return false;

    return true;
  });

  renderMenu(filtered);
}

function populateCategories(rows) {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const categories = new Set();

  rows.forEach(r => {
    const category = r.c[1]?.v;
    if (category) categories.add(category);
  });

  select.innerHTML =
    `<option value="all">All Categories</option>` +
    [...categories]
      .map(c => `<option value="${c}">${c}</option>`)
      .join("");
}

// ===============================
// LOAD MENU
// ===============================
function loadMenu() {
 fetch(getSheetUrl())
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substr(47).slice(0, -2));
      allProducts = json.table.rows;

      populateCategories(allProducts);
      applyFilters(); // render first time
    });
}


// ===============================
// RENDER MENU
// ===============================
function renderMenu(rows) {
  const menuDiv = document.getElementById("menu");
  menuDiv.innerHTML = "";

  if (rows.length === 0) {
    menuDiv.innerHTML = `<p class="empty">No products found</p>`;
    return;
  }

  rows.forEach(r => {
    const item = r.c[0]?.v;
    const category = r.c[1]?.v;
    const price = r.c[2]?.v;
    const unit = r.c[3]?.v;
    const available = r.c[4]?.v;
    const image = r.c[5]?.v || "placeholder.png";

    if (available !== "yes") return;

    const qty = cart[item]?.qty || 0;

    const images = (r.c[5]?.v || "placeholder.png")
  .split(",")
  .map(i => i.trim());

const images = (r.c[5]?.v || "placeholder.png")
  .split(",")
  .map(i => i.trim())
  .slice(0, 3); // max 3 images

const mainImage = images[0];
const imagesData = images.join(",");



menuDiv.innerHTML += `
  <div class="product-card">
    <img
      src="images/${mainImage}"
      class="product-image"
      data-images="${imagesData}"
      onclick="openGalleryFromElement(this)"
      onerror="this.src='images/placeholder.png'"
    />

    <div class="product-info">
      <div class="product-name">${item}</div>
      <div class="product-category">${category}</div>
      <div class="product-price">₹${price} / ${unit}</div>
    </div>

    <div class="product-actions">
      <button onclick="removeFromCart('${item}')">−</button>
      <span class="product-qty" id="qty-${safeId}">
        ${cart[item]?.qty ? cart[item].qty + " " + unit : ""}
      </span>
      <button onclick="addToCart('${item}', ${price}, '${unit}')">+</button>
    </div>
  </div>
`;

  });
}


// ===============================
// CART ACTIONS
// ===============================
function updateQtyUI(item, unit) {
  const el = document.getElementById(
    "qty-" + item.replace(/\s+/g,'')
  );
  if (!el) return;

  const qty = cart[item]?.qty || 0;
  el.innerText = qty > 0 ? qty + " " + unit : "";
}

function addToCart(item, price, unit) {
  if (!cart[item]) {
    cart[item] = { qty: 0.5, price, unit };
  } else {
    cart[item].qty += 0.5;
  }

  updateQtyUI(item, unit);   // 🔥 INSTANT
  renderCart();              // cart summary only
}

function removeFromCart(item) {
  if (!cart[item]) return;

  cart[item].qty -= 0.5;
  if (cart[item].qty <= 0) delete cart[item];

  updateQtyUI(item, cart[item]?.unit || "");
  renderCart();
}

// ===============================
// RENDER CART
// ===============================
function renderCart() {
  const cartDiv = document.getElementById("cart");
  const totalDiv = document.getElementById("total");

  cartDiv.innerHTML = "";
  let total = 0;

  Object.keys(cart).forEach(item => {
    const c = cart[item];
    const itemTotal = c.qty * c.price;
    total += itemTotal;

    cartDiv.innerHTML += `
      <div class="cart-item">
        ${item}: ${c.qty} ${c.unit} - Rs.${itemTotal}
      </div>
    `;
  });

  totalDiv.innerText =
  translations[currentLang].total + ": Rs." + total;

// 🔥 Sticky cart update
const stickyBar = document.getElementById("stickyCartBar");
const stickyText = document.getElementById("stickyCartText");

const itemCount = Object.keys(cart).length;

if (itemCount > 0) {
  stickyBar.style.display = "block";
  stickyText.innerText =
    "🛒 " + itemCount + " items | Total ₹" + total;
} else {
  stickyBar.style.display = "none";
}
// Optional: tap sticky bar to scroll to cart
stickyBar.onclick = () => {
  document
    .getElementById("cart")
    .scrollIntoView({ behavior: "smooth" });
};


}

// ===============================
// LANGUAGE SWITCH
// ===============================
function setLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];

  document.getElementById("menuLabel").innerText = t.menu;
  document.getElementById("cartLabel").innerText = t.cart;
  document.getElementById("pickupLabel").innerText = t.pickupTime;
  document.getElementById("orderBtn").innerText = t.orderBtn;
  document.getElementById("noteText").innerText = t.note;

  renderCart();
}

// ===============================
// WHATSAPP ORDER
// ===============================
function placeOrder() {
  console.log("🚀 placeOrder called");
  const pickupCode = generatePickupCode();


  if (Object.keys(cart).length === 0) {
    alert("Please add items to cart");
    return;
  }

  let message =
    "Hello " + shop.name + ",\n\n" +
    (currentLang === "te" ? "ఆర్డర్ వివరాలు:\n" : "Order details:\n");

  let total = 0;

  Object.keys(cart).forEach(item => {
    const c = cart[item];
    const itemTotal = c.qty * c.price;
    total += itemTotal;

    message +=
      "- " + item + ": " + c.qty + " " + c.unit + " - Rs." + itemTotal + "\n";
  });

  const pickupTime =
    document.getElementById("pickupTime").value || "Not specified";

  message += "\n" + translations[currentLang].total + ": Rs." + total;
  message += "\n" + translations[currentLang].pickupTime + ": " + pickupTime;
  message += "\nPickup Code: " + pickupCode;
message += "\n(Please show this code at pickup)";

  message += "\n\n" + translations[currentLang].note + "\nThank you.";

  // 1️⃣ Track intent FIRST
 trackOrderIntent(
  message.replace(/\n/g, " | "),
  total,
  pickupTime + " | Code:" + pickupCode
);

  // 2️⃣ Redirect to WhatsApp after short delay
  const url =
    "https://wa.me/" +
    shop.whatsapp +
    "?text=" +
    encodeURIComponent(message);

  setTimeout(() => {
    window.open(url, "_blank");
  }, 300);
}

// ===============================
// INIT
// ===============================
renderShopInfo();
loadMenu();
setLanguage("en");
initShopDropdown();
setInterval(() => {
  // only refresh menu data, NOT UI state
  loadMenu();
}, 60000); // 1 minute is enough

//setInterval(loadMenu, 30000);
















