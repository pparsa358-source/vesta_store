
const DEFAULT_PRODUCTS = [
  { id: 1, name: "تیشرت مینیمال", category: "clothes", categoryName: "لباس", price: 490000, sizes: ["S", "M", "L", "XL"], stock: { S: 10, M: 12, L: 8, XL: 5 }, tag: "پرفروش", image: "photo-1521572163474-6864f9cf17ab" },
  { id: 2, name: "هودی روزمره", category: "clothes", categoryName: "لباس", price: 1190000, sizes: ["M", "L", "XL"], stock: { M: 6, L: 8, XL: 4 }, tag: "جدید", image: "photo-1556821840-3a63f95609a7" },
  { id: 3, name: "کتانی کلاسیک", category: "shoes", categoryName: "کفش", price: 1850000, sizes: ["40", "41", "42", "43", "44"], stock: { "40": 2, "41": 4, "42": 6, "43": 5, "44": 2 }, tag: "محبوب", image: "photo-1542291026-7eec264c27ff" },
  { id: 4, name: "کتانی سفید", category: "shoes", categoryName: "کفش", price: 1690000, sizes: ["39", "40", "41", "42", "43"], stock: { "39": 2, "40": 4, "41": 5, "42": 5, "43": 3 }, tag: "جدید", image: "photo-1543163521-1bf539c55dd2" },
  { id: 5, name: "پیراهن کژوال", category: "clothes", categoryName: "لباس", price: 890000, sizes: ["S", "M", "L", "XL"], stock: { S: 4, M: 7, L: 5, XL: 3 }, tag: "", image: "photo-1598033129183-c4f50c736f10" },
  { id: 6, name: "ژاکت بافت", category: "clothes", categoryName: "لباس", price: 1450000, sizes: ["M", "L", "XL"], stock: { M: 3, L: 5, XL: 2 }, tag: "", image: "photo-1618354691373-d851c5c3a990" },
  { id: 7, name: "کفش اسپرت", category: "shoes", categoryName: "کفش", price: 2150000, sizes: ["40", "41", "42", "43", "44"], stock: { "40": 3, "41": 5, "42": 5, "43": 4, "44": 2 }, tag: "پرفروش", image: "photo-1549298916-b41d501d3772" },
  { id: 8, name: "تیشرت سفید", category: "clothes", categoryName: "لباس", price: 390000, sizes: ["S", "M", "L", "XL"], stock: { S: 8, M: 10, L: 8, XL: 4 }, tag: "", image: "photo-1503341504253-dff4815485f1" }
];

function normalizeAndMergeProducts(savedProducts) {
  const merged = new Map(DEFAULT_PRODUCTS.map(product => [String(product.id), { ...product, stock: { ...product.stock } }]));
  if (Array.isArray(savedProducts)) {
    for (const item of savedProducts) {
      if (!item || item.id == null || typeof item.name !== "string" || !Number.isFinite(Number(item.price)) || !Array.isArray(item.sizes)) continue;
      const key = String(item.id);
      const previous = merged.get(key);
      const sizes = item.sizes.map(size => String(size));
      const stock = { ...(previous?.stock || {}), ...(item.stock && typeof item.stock === "object" ? item.stock : {}) };
      for (const size of sizes) {
        if (!Number.isFinite(Number(stock[size])) || Number(stock[size]) < 0) stock[size] = 0;
        else stock[size] = Math.floor(Number(stock[size]));
      }
      merged.set(key, {
        ...(previous || {}),
        ...item,
        id: item.id,
        category: item.category === "shoes" ? "shoes" : "clothes",
        categoryName: item.categoryName || (item.category === "shoes" ? "کفش" : "لباس"),
        price: Number(item.price),
        discount: Number(item.discount) || 0,
        sizes,
        stock,
        tag: item.tag || "",
        image: item.image || item.images?.[0] || previous?.image || "",
        images: Array.isArray(item.images) && item.images.length
          ? item.images.filter(value => typeof value === "string" && value)
          : [item.image || previous?.image || ""].filter(Boolean)
      });
    }
  }
  return [...merged.values()];
}

function readSavedProducts() {
  try {
    const raw = localStorage.getItem("vesta_products");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("خواندن محصولات ذخیره‌شده ناموفق بود:", error);
    return [];
  }
}

let products = normalizeAndMergeProducts(readSavedProducts());
try {
  localStorage.setItem("vesta_products", JSON.stringify(products));
} catch (error) {
  console.warn("ذخیره اولیه محصولات در مرورگر ممکن نشد:", error);
}

function imageUrl(photoId) {
  if (typeof photoId !== "string" || !photoId) {
    return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=80";
  }
  if (photoId.startsWith("https://") || photoId.startsWith("http://") || photoId.startsWith("data:image/")) {
    return photoId;
  }
  const id = photoId.startsWith("photo-") ? photoId : "photo-1523381210434-271e8be1f52b";
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80`;
}

const grid = document.getElementById("product-grid");
const searchInput = document.getElementById("search");
const resultCount = document.getElementById("result-count");
const emptyMessage = document.getElementById("empty-message");
const cartCount = document.getElementById("cart-count");
const cartPanel = document.getElementById("cart-panel");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartFooter = document.getElementById("cart-footer");
const checkoutForm = document.getElementById("checkout-form");
const toast = document.getElementById("toast");

let selectedCategory = "all";
let cart = [];
let toastTimer;

function money(value) {
  return value.toLocaleString("fa-IR") + " تومان";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function renderProducts() {
  const term = searchInput.value.trim().toLocaleLowerCase("fa");

  const filtered = products.filter(product => {
    const matchesCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory;

    const matchesSearch =
      product.name.toLocaleLowerCase("fa").includes(term) ||
      product.categoryName.toLocaleLowerCase("fa").includes(term);

    return matchesCategory && matchesSearch;
  });

  grid.replaceChildren();
  resultCount.textContent =
    filtered.length.toLocaleString("fa-IR") + " محصول";

  emptyMessage.hidden = filtered.length !== 0;

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageBox = document.createElement("div");
    imageBox.className = "product-image";

    const gallery = Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.image].filter(Boolean);
    let galleryIndex = 0;
    const img = document.createElement("img");
    img.src = imageUrl(gallery[0] || product.image);
    img.alt = product.name;
    img.loading = "lazy";
    img.onerror = () => {
      img.onerror = null;
      img.src = imageUrl("photo-1523381210434-271e8be1f52b");
    };
    imageBox.appendChild(img);

    if (gallery.length > 1) {
      const galleryControls = document.createElement("div");
      galleryControls.className = "gallery-controls";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "gallery-arrow";
      previous.textContent = "‹";
      previous.setAttribute("aria-label", "عکس قبلی");
      const next = document.createElement("button");
      next.type = "button";
      next.className = "gallery-arrow";
      next.textContent = "›";
      next.setAttribute("aria-label", "عکس بعدی");
      const counter = document.createElement("span");
      counter.className = "gallery-counter";
      const updateGallery = () => {
        img.src = imageUrl(gallery[galleryIndex]);
        counter.textContent = `${(galleryIndex + 1).toLocaleString("fa-IR")} / ${gallery.length.toLocaleString("fa-IR")}`;
      };
      previous.addEventListener("click", () => { galleryIndex = (galleryIndex - 1 + gallery.length) % gallery.length; updateGallery(); });
      next.addEventListener("click", () => { galleryIndex = (galleryIndex + 1) % gallery.length; updateGallery(); });
      galleryControls.append(previous, counter, next);
      imageBox.appendChild(galleryControls);
      updateGallery();
    }

    if (product.tag) {
      const tag = document.createElement("span");
      tag.className = "product-tag";
      tag.textContent = product.tag;
      imageBox.appendChild(tag);
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.categoryName;

    const price = document.createElement("div");
    price.className = "product-price";
    const discountPercent = Math.min(90, Math.max(0, Number(product.discount) || 0));
    const finalPrice = discountPercent > 0
      ? Math.round(Number(product.price) * (100 - discountPercent) / 100)
      : Number(product.price);
    if (discountPercent > 0) {
      const oldPrice = document.createElement("span");
      oldPrice.className = "old-price";
      oldPrice.textContent = money(Number(product.price));
      const newPrice = document.createElement("strong");
      newPrice.className = "sale-price";
      newPrice.textContent = money(finalPrice);
      const discountBadge = document.createElement("span");
      discountBadge.className = "discount-badge";
      discountBadge.textContent = `${discountPercent.toLocaleString("fa-IR")}٪ تخفیف`;
      price.append(oldPrice, newPrice, discountBadge);
    } else {
      price.textContent = money(finalPrice);
    }

    const sizeLabel = document.createElement("label");
    sizeLabel.className = "size-label";
    sizeLabel.textContent = "انتخاب سایز";

    const sizeSelect = document.createElement("select");
    sizeSelect.className = "size-select";
    sizeSelect.setAttribute(
      "aria-label",
      "سایز " + product.name
    );

    product.sizes.forEach(size => {
      const option = document.createElement("option");
      const available = Math.max(0, Math.floor(Number(product.stock?.[size]) || 0));
      option.value = size;
      option.disabled = available <= 0;
      option.textContent = available <= 0
        ? `${size} (ناموجود)`
        : `${size} (موجودی: ${available.toLocaleString("fa-IR")})`;
      sizeSelect.appendChild(option);
    });

    const stockStatus = document.createElement("p");
    stockStatus.className = "stock-status";
    const updateStockStatus = () => {
      const available = Math.max(0, Math.floor(Number(product.stock?.[sizeSelect.value]) || 0));
      if (available <= 0) {
        stockStatus.textContent = "این سایز ناموجود است";
        stockStatus.className = "stock-status out-of-stock";
        addButton.disabled = true;
        addButton.textContent = "ناموجود";
      } else {
        stockStatus.textContent = available <= 3
          ? `فقط ${available.toLocaleString("fa-IR")} عدد از این سایز باقی مانده`
          : `موجودی این سایز: ${available.toLocaleString("fa-IR")} عدد`;
        stockStatus.className = available <= 3 ? "stock-status low-stock" : "stock-status in-stock";
        addButton.disabled = false;
        addButton.textContent = "افزودن به سبد خرید";
      }
    };

    sizeLabel.htmlFor = "size-" + product.id;
    sizeSelect.id = "size-" + product.id;

    const addButton = document.createElement("button");
    addButton.className = "add-button";
    addButton.textContent = "افزودن به سبد خرید";

    addButton.addEventListener("click", () => {
      addToCart(product, sizeSelect.value);
    });
    sizeSelect.addEventListener("change", updateStockStatus);
    updateStockStatus();

    info.append(
      name,
      category,
      price,
      sizeLabel,
      sizeSelect,
      stockStatus,
      addButton
    );

    card.append(imageBox, info);
    grid.appendChild(card);
  });
}

function addToCart(product, size) {
  const available = Number(product.stock?.[size]);
  if (product.stock && (!Number.isFinite(available) || available <= 0)) {
    showToast("این سایز موجود نیست.");
    return;
  }

  const existing = cart.find(item => item.id === product.id && item.size === size);
  if (existing && product.stock && existing.quantity >= available) {
    showToast("موجودی این سایز کافی نیست.");
    return;
  }

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: (Number(product.discount) > 0 && Number(product.discount) <= 90)
        ? Math.round(Number(product.price) * (100 - Number(product.discount)) / 100)
        : Number(product.price),
      size,
      image: product.image,
      quantity: 1
    });
  }
  renderCart();
  showToast(product.name + " به سبد خرید اضافه شد.");
}

function changeQuantity(id, size, amount) {
  const item = cart.find(item =>
    item.id === id && item.size === size
  );

  if (!item) return;

  if (amount > 0) {
    const product = products.find(product => product.id === id);
    const available = Number(product?.stock?.[size]);
    if (product?.stock && item.quantity >= available) {
      showToast("موجودی این سایز کافی نیست.");
      return;
    }
  }
  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(item =>
      !(item.id === id && item.size === size)
    );
  }

  renderCart();
}

function removeItem(id, size) {
  cart = cart.filter(item =>
    !(item.id === id && item.size === size)
  );

  renderCart();
}

function renderCart() {
  cartItems.replaceChildren();

  const count = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  cartCount.textContent = count.toLocaleString("fa-IR");
  cartTotal.textContent = money(total);

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "سبد خریدت هنوز خالی است.";
    cartItems.appendChild(empty);
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const img = document.createElement("img");
    img.src = imageUrl(item.image);
    img.alt = item.name;

    const details = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = item.name;

    const size = document.createElement("p");
    size.textContent = "سایز: " + item.size;

    const price = document.createElement("p");
    price.textContent = money(item.price * item.quantity);

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.setAttribute("aria-label", "کم کردن تعداد");
    minus.addEventListener("click", () =>
      changeQuantity(item.id, item.size, -1)
    );

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity.toLocaleString("fa-IR");

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.setAttribute("aria-label", "زیاد کردن تعداد");
    plus.addEventListener("click", () =>
      changeQuantity(item.id, item.size, 1)
    );

    controls.append(minus, quantity, plus);
    details.append(name, size, price, controls);

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.textContent = "حذف";
    remove.addEventListener("click", () =>
      removeItem(item.id, item.size)
    );

    row.append(img, details, remove);
    cartItems.appendChild(row);
  });
}

function openCart() {
  cartPanel.hidden = false;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("close-cart").focus();
}

function closeCart() {
  cartPanel.hidden = true;
  overlay.hidden = true;
  document.body.style.overflow = "";
  document.getElementById("open-cart").focus();
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;

    document.querySelectorAll(".filter").forEach(filter => {
      filter.classList.toggle("active", filter === button);
    });

    renderProducts();
  });
});

document.querySelectorAll("[data-nav-category]").forEach(link => {
  link.addEventListener("click", () => {
    selectedCategory = link.dataset.navCategory;

    document.querySelectorAll(".filter").forEach(filter => {
      filter.classList.toggle(
        "active",
        filter.dataset.category === selectedCategory
      );
    });

    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);

// اگر پنل مدیریت در تب دیگری تغییر کند، فروشگاه هم به‌روز می‌شود.
window.addEventListener("storage", event => {
  if (event.key !== "vesta_products") return;
  try {
    const saved = event.newValue ? JSON.parse(event.newValue) : [];
    products = normalizeAndMergeProducts(saved);
    renderProducts();
  } catch (error) {
    console.warn("به‌روزرسانی محصولات از پنل مدیریت ناموفق بود:", error);
  }
});

document.getElementById("open-cart")
  .addEventListener("click", openCart);

document.getElementById("close-cart")
  .addEventListener("click", closeCart);

overlay.addEventListener("click", closeCart);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !cartPanel.hidden) {
    closeCart();
  }
});

document.getElementById("checkout").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("ابتدا محصولی به سبد خرید اضافه کن.");
    return;
  }
  cartFooter.hidden = true;
  cartItems.hidden = true;
  checkoutForm.hidden = false;
  checkoutForm.scrollTop = 0;
  document.getElementById("customer-name").focus();
});

document.getElementById("back-to-cart").addEventListener("click", () => {
  checkoutForm.hidden = true;
  cartItems.hidden = false;
  cartFooter.hidden = false;
  cartItems.scrollTop = 0;
});

function saveProductsToStorage() {
  try {
    localStorage.setItem("vesta_products", JSON.stringify(products));
    return true;
  } catch (error) {
    showToast("ذخیره موجودی ناموفق بود؛ فضای مرورگر را بررسی کن.");
    return false;
  }
}

checkoutForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.length) {
    showToast("سبد خرید خالی است.");
    return;
  }

  // قبل از ثبت سفارش، موجودی هر سایز دوباره بررسی می‌شود.
  for (const item of cart) {
    const product = products.find(product => String(product.id) === String(item.id));
    const available = Number(product?.stock?.[item.size]);
    if (!product || !Number.isFinite(available) || available < item.quantity) {
      showToast(`موجودی ${item.name} در سایز ${item.size} کافی نیست. سبد را بررسی کن.`);
      renderProducts();
      return;
    }
  }

  const customerName = document.getElementById("customer-name").value.trim();
  const phoneInput = document.getElementById("customer-phone");
  const phone = normalizeIranianMobile(phoneInput.value);
  const address = document.getElementById("customer-address").value.trim();
  const notes = document.getElementById("customer-notes").value.trim();
  if (!customerName || !phone || !address) {
    showToast("نام، شماره تماس و آدرس را کامل کن.");
    return;
  }
  if (!/^09\d{9}$/.test(phone)) {
    phoneInput.setCustomValidity("شماره موبایل معتبر نیست؛ نمونه درست: 09123456789");
    phoneInput.reportValidity();
    showToast("شماره موبایل را به شکل ۱۱ رقمی و با 09 وارد کن.");
    return;
  }
  phoneInput.setCustomValidity("");
  phoneInput.value = phone;

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem("vesta_orders") || "[]");
    if (!Array.isArray(orders)) orders = [];
  } catch (_) { orders = []; }

  const orderId = `VST-${Date.now().toString().slice(-8)}`;
  const orderItems = cart.map(item => ({ ...item }));
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    customer: { name: customerName, phone, address, notes },
    deliveryLocation: {
      lat: document.getElementById("delivery-lat").value ? Number(document.getElementById("delivery-lat").value) : null,
      lng: document.getElementById("delivery-lng").value ? Number(document.getElementById("delivery-lng").value) : null
    },
    items: orderItems,
    total,
    status: "new",
    stockRestored: false
  };

  // کم‌کردن موجودی فقط پس از اعتبارسنجی کامل سبد.
  const previousProducts = JSON.stringify(products);
  for (const item of orderItems) {
    const product = products.find(product => String(product.id) === String(item.id));
    product.stock[item.size] = Number(product.stock[item.size]) - item.quantity;
  }

  try {
    localStorage.setItem("vesta_orders", JSON.stringify([order, ...orders]));
    localStorage.setItem("vesta_products", JSON.stringify(products));
  } catch (error) {
    products = JSON.parse(previousProducts);
    showToast("ثبت سفارش انجام نشد؛ فضای ذخیره‌سازی مرورگر کافی نیست.");
    return;
  }

  cart = [];
  renderCart();
  renderProducts();
  checkoutForm.reset();
  checkoutForm.hidden = true;
  cartItems.hidden = false;
  cartFooter.hidden = false;
  showToast(`سفارش ${orderId} با موفقیت ثبت شد.`);
  setTimeout(closeCart, 900);
});

function toEnglishDigits(value) {
  return String(value || "").replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizeIranianMobile(value) {
  let phone = toEnglishDigits(value).replace(/[\s()\-]/g, "");
  if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
  else if (phone.startsWith("0098")) phone = "0" + phone.slice(4);
  return phone;
}

const phoneInput = document.getElementById("customer-phone");
phoneInput.addEventListener("input", () => {
  phoneInput.setCustomValidity("");
  const normalized = normalizeIranianMobile(phoneInput.value);
  if (normalized && !/^09\d{9}$/.test(normalized)) {
    phoneInput.setCustomValidity("شماره موبایل ایران باید ۱۱ رقم و با 09 شروع شود؛ نمونه: 09123456789");
  }
});

let deliveryMap = null;
let deliveryMarker = null;
let reverseLookupTimer = null;
let reverseLookupController = null;
function initDeliveryMap() {
  const status = document.getElementById("map-status");
  if (deliveryMap) {
    setTimeout(() => deliveryMap.invalidateSize(), 100);
    return;
  }
  if (!window.L) {
    status.textContent = "نقشه بارگذاری نشد. اتصال اینترنت را بررسی و صفحه را دوباره بارگذاری کن؛ آدرس را می‌توانی دستی وارد کنی.";
    return;
  }
  deliveryMap = L.map("delivery-map").setView([35.6892, 51.3890], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(deliveryMap);
  const setLocation = (latlng) => {
    if (!deliveryMarker) {
      deliveryMarker = L.marker(latlng, { draggable: true }).addTo(deliveryMap);
      deliveryMarker.on("dragend", () => setLocation(deliveryMarker.getLatLng()));
    } else deliveryMarker.setLatLng(latlng);
    document.getElementById("delivery-lat").value = latlng.lat.toFixed(6);
    document.getElementById("delivery-lng").value = latlng.lng.toFixed(6);
    status.textContent = "در حال دریافت آدرس این نقطه…";
    clearTimeout(reverseLookupTimer);
    if (reverseLookupController) reverseLookupController.abort();
    reverseLookupTimer = setTimeout(async () => {
      reverseLookupController = new AbortController();
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latlng.lat)}&lon=${encodeURIComponent(latlng.lng)}&accept-language=fa`;
        const response = await fetch(url, { signal: reverseLookupController.signal, headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error("reverse lookup failed");
        const data = await response.json();
        if (data.display_name) {
          document.getElementById("customer-address").value = data.display_name;
          status.textContent = "آدرس روی نقشه انتخاب شد. پلاک، واحد و جزئیات لازم را در کادر آدرس تکمیل کن.";
        } else {
          status.textContent = "نقطه انتخاب شد؛ آدرس را لطفاً دستی کامل کن.";
        }
      } catch (error) {
        if (error.name !== "AbortError") status.textContent = "نقطه انتخاب شد، اما دریافت آدرس خودکار نشد؛ آدرس را دستی وارد کن.";
      }
    }, 700);
  };
  deliveryMap.on("click", event => setLocation(event.latlng));
  deliveryMarker = null;
  deliveryMap.on("click", () => {});
  // پس از جابه‌جایی نشانگر نیز آدرس دوباره دریافت می‌شود.
  deliveryMap.on("popupopen", () => {});
  status.textContent = "روی نقشه کلیک کن تا محل تحویل مشخص شود. نقشه با OpenStreetMap بارگذاری می‌شود.";
  deliveryMap._vestaSetLocation = setLocation;
  setTimeout(() => deliveryMap.invalidateSize(), 100);
}

document.getElementById("checkout").addEventListener("click", () => {
  setTimeout(initDeliveryMap, 120);
});

renderProducts();
renderCart();
