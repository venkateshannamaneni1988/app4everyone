// ===============================
// SHOPS CONFIG (SAME MENU SHEET)
// ===============================
const shops = {
  kk: {
    name: "K K Store",
    location: "Dharmavaram",
    whatsapp: "918904220620"
  },
  svk: {
    name: "Sri Venkateswara Kirana Store",
    location: "Dharmavaram",
    whatsapp: "918904220620"
  },
  balaji: {
    name: "Balaji Kirana Store",
    location: "Dharmavaram",
    whatsapp: "918904220620"
  }
};

function initShopDropdown() {
  const select = document.getElementById("shopSelect");
  if (!select) return;

  select.value = currentShopKey;
}
function onShopChange(shopKey) {
  if (!shops[shopKey]) return;

  currentShopKey = shopKey;
  shop = shops[shopKey];

  // reset cart when shop changes
  for (let key in cart) delete cart[key];

  renderShopInfo();
  renderCart();
  loadMenu();

  // update URL (nice UX)
  const newUrl =
    window.location.pathname + "?shop=" + shopKey;
  window.history.replaceState({}, "", newUrl);
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
// GOOGLE SHEET (SAME FOR ALL)
// ===============================
const sheetId = "1Fyyky7aA8sKCBMycHoc6Yyw0IqmonSX2iGlfQigTUTg";
const sheetUrl =
  "https://docs.google.com/spreadsheets/d/" +
  sheetId +
  "/gviz/tq?tqx=out:json";

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

// ===============================
// LOAD MENU
// ===============================
function loadMenu() {
  fetch(sheetUrl)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substr(47).slice(0, -2));
      renderMenu(json.table.rows);
    });
}

// ===============================
// RENDER MENU
// ===============================
function renderMenu(rows) {
  const menuDiv = document.getElementById("menu");
  menuDiv.innerHTML = "";

  rows.forEach(r => {
    const item = r.c[0]?.v;
    const price = r.c[1]?.v;
    const unit = r.c[2]?.v;
    const available = r.c[3]?.v;

    if (available !== "yes") return;

    menuDiv.innerHTML += `
      <div class="card">
        <div class="item-row">
          <div>
            <div class="item-name">${item}</div>
            <div class="item-price">Rs.${price}/${unit}</div>
          </div>
          <div>
            <button class="qty-btn" onclick="removeFromCart('${item}')">-</button>
            <button class="qty-btn" onclick="addToCart('${item}', ${price}, '${unit}')">+</button>
          </div>
        </div>
      </div>
    `;
  });
}

// ===============================
// CART ACTIONS (0.5 STEP)
// ===============================
function addToCart(item, price, unit) {
  if (!cart[item]) {
    cart[item] = { qty: 0.5, price, unit };
  } else {
    cart[item].qty += 0.5;
  }
  renderCart();
}

function removeFromCart(item) {
  if (!cart[item]) return;
  cart[item].qty -= 0.5;
  if (cart[item].qty <= 0) delete cart[item];
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
  message += "\n\n" + translations[currentLang].note + "\nThank you.";

  const url =
    "https://wa.me/" +
    shop.whatsapp +
    "?text=" +
    encodeURIComponent(message);

  window.open(url);
}

// ===============================
// INIT
// ===============================
renderShopInfo();
loadMenu();
setLanguage("en");
initShopDropdown();
setInterval(loadMenu, 30000);
