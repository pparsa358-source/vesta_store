const STORAGE_KEY = "vesta_products";

const CATEGORY_STORAGE_KEY = "vesta_categories";
const DEFAULT_CATEGORIES = [
  { id: "clothes", name: "لباس", children: [
    { id: "clothes-men", name: "لباس مردانه", children: [{ id: "clothes-men-tshirt", name: "تیشرت" }, { id: "clothes-men-pants", name: "شلوار" }] },
    { id: "clothes-women", name: "لباس زنانه", children: [{ id: "clothes-women-dress", name: "پیراهن" }] }
  ] },
  { id: "shoes", name: "کفش", children: [
    { id: "shoes-sport", name: "کفش اسپرت", children: [{ id: "shoes-sneakers", name: "کتانی" }] },
    { id: "shoes-formal", name: "کفش رسمی", children: [] }
  ] }
];
function loadCategories() {
  try {
    const value = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || "null");
    return Array.isArray(value) && value.length ? value : structuredClone(DEFAULT_CATEGORIES);
  } catch (_) { return structuredClone(DEFAULT_CATEGORIES); }
}
let categories = loadCategories();
function saveCategories() {
  try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories)); return true; }
  catch (_) { showToast("ذخیره دسته‌بندی‌ها ناموفق بود."); return false; }
}
function makeCategoryId() { return "cat-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fillSelect(select, items, placeholder, selected = "") {
  select.replaceChildren();
  if (placeholder !== null) { const opt = document.createElement("option"); opt.value = ""; opt.textContent = placeholder; select.appendChild(opt); }
  items.forEach(item => { const opt = document.createElement("option"); opt.value = item.id; opt.textContent = item.name; select.appendChild(opt); });
  if ([...select.options].some(opt => opt.value === String(selected))) select.value = String(selected);
}
function getMain(id) { return categories.find(item => item.id === id); }
function getSub1(mainId, id) { return getMain(mainId)?.children?.find(item => item.id === id); }
function categoryPath(mainId, sub1Id, sub2Id) {
  const main = getMain(mainId); const sub1 = getSub1(mainId, sub1Id); const sub2 = sub1?.children?.find(item => item.id === sub2Id);
  return [main?.name, sub1?.name, sub2?.name].filter(Boolean).join(" / ") || (mainId === "shoes" ? "کفش" : "لباس");
}
function refreshProductCategorySelects(selected = {}) {
  const main = document.getElementById("category"), sub1 = document.getElementById("subcategory-1"), sub2 = document.getElementById("subcategory-2");
  fillSelect(main, categories, null, selected.main || "clothes");
  const parent = getMain(main.value);
  fillSelect(sub1, parent?.children || [], "بدون دسته‌بندی فرعی", selected.sub1 || "");
  const child = getSub1(main.value, sub1.value);
  fillSelect(sub2, child?.children || [], "بدون دسته‌بندی فرعی", selected.sub2 || "");
}
function refreshCategoryManager() {
  const level = document.getElementById("category-level").value;
  const parentSelect = document.getElementById("category-parent");
  const subparentSelect = document.getElementById("category-subparent");
  document.getElementById("category-subparent-label").hidden = level !== "sub2";
  document.getElementById("category-parent-label").hidden = level === "main";
  if (level === "sub1") fillSelect(parentSelect, categories, "انتخاب دسته‌بندی اصلی");
  else if (level === "sub2") {
    fillSelect(parentSelect, categories, "انتخاب دسته‌بندی اصلی");
    const selectedMain = getMain(parentSelect.value);
    fillSelect(subparentSelect, selectedMain?.children || [], "انتخاب دسته‌بندی فرعی ۱");
  }
  renderCategoryTree();
}
function renderCategoryTree() {
  const tree = document.getElementById("category-tree"); if (!tree) return;
  tree.replaceChildren();
  function addNode(item, depth, parentArray) {
    const row = document.createElement("div"); row.className = "category-tree-row depth-" + depth;
    const label = document.createElement("span"); label.textContent = (depth === 0 ? "اصلی: " : depth === 1 ? "فرعی ۱: " : "فرعی ۲: ") + item.name;
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "action-button delete"; remove.textContent = "حذف";
    remove.addEventListener("click", () => {
      const childCount = item.children?.length || 0;
      if (!confirm(`«${item.name}» حذف شود؟${childCount ? " دسته‌های زیرمجموعه آن نیز حذف می‌شوند." : ""}`)) return;
      const index = parentArray.findIndex(entry => entry.id === item.id); if (index >= 0) parentArray.splice(index, 1);
      saveCategories(); refreshProductCategorySelects(); refreshCategoryManager();
      document.getElementById("category-message").textContent = "دسته‌بندی حذف شد.";
    });
    row.append(label, remove); tree.appendChild(row);
    (item.children || []).forEach(child => addNode(child, depth + 1, item.children));
  }
  categories.forEach(item => addNode(item, 0, categories));
}


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
        ...(previous || {}), ...item,
        id: item.id,
        category: item.category === "shoes" ? "shoes" : "clothes",
        categoryName: item.categoryName || (item.category === "shoes" ? "کفش" : "لباس"),
        price: Number(item.price), discount: Number(item.discount) || 0,
        sizes, stock, tag: item.tag || "",
        image: item.image || item.images?.[0] || previous?.image || "",
        images: Array.isArray(item.images) && item.images.length
          ? item.images.filter(value => typeof value === "string" && value)
          : (item.image || previous?.image ? [item.image || previous.image] : [])
      });
    }
  }
  return [...merged.values()];
}

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return normalizeAndMergeProducts(saved ? JSON.parse(saved) : []);
  } catch (error) {
    console.warn("خواندن محصولات ذخیره‌شده ناموفق بود:", error);
    return normalizeAndMergeProducts([]);
  }
}

const form = document.getElementById("product-form");
const productList = document.getElementById("product-list");
const searchInput = document.getElementById("admin-search");
const imageFile = document.getElementById("image-file");
const imageUrl = document.getElementById("image-url");
const imagePreview = document.getElementById("image-preview");
const previewPlaceholder = document.getElementById("preview-placeholder");
const message = document.getElementById("form-message");
const toast = document.getElementById("toast");

let products = loadProducts();
let currentImages = [];
let toastTimer;
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
} catch (error) {
  console.warn("ذخیره اولیه محصولات ناموفق بود:", error);
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch {
    showToast("ذخیره ناموفق بود؛ فضای ذخیره‌سازی مرورگر را بررسی کن.");
    return false;
  }
}

function money(value) {
  return Number(value).toLocaleString("fa-IR") + " تومان";
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function showMessage(text) {
  message.textContent = text;
}

function setPreview(images) {
  currentImages = (Array.isArray(images) ? images : [images]).filter(Boolean);
  const wrap = document.getElementById("preview-wrap");
  wrap.replaceChildren();
  if (!currentImages.length) {
    const placeholder = document.createElement("span");
    placeholder.id = "preview-placeholder";
    placeholder.textContent = "پیش‌نمایش عکس‌های محصول";
    wrap.appendChild(placeholder);
    return;
  }
  currentImages.slice(0, 8).forEach((src, index) => {
    const img = document.createElement("img");
    img.alt = `پیش‌نمایش عکس ${index + 1}`;
    img.src = imageUrlForAdmin(src);
    img.onerror = () => { img.hidden = true; };
    wrap.appendChild(img);
  });
  if (currentImages.length > 8) {
    const more = document.createElement("span");
    more.textContent = `و ${currentImages.length - 8} عکس دیگر`;
    wrap.appendChild(more);
  }
}

function imageUrlForAdmin(value) {
  if (!value) return "";
  if (/^(https?:|data:image\/)/i.test(value)) return value;
  return `https://images.unsplash.com/${value}?auto=format&fit=crop&w=700&q=80`;
}

function parseSizes(text) {
  return [...new Set(
    text.split(/[,،]/)
      .map(size => size.trim())
      .filter(Boolean)
  )];
}

function parseStock(text) {
  const stock = {};

  for (const entry of text.split(/[,،]/)) {
    const parts = entry.split(":");
    if (parts.length !== 2) {
      throw new Error("موجودی را به شکل S:10, M:8 وارد کن.");
    }

    const size = parts[0].trim();
    const quantityText = parts[1].trim();
    const quantity = Number(quantityText);

    if (
      !size ||
      quantityText === "" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0
    ) {
      throw new Error("موجودی هر سایز باید عدد صحیح و صفر یا بیشتر باشد.");
    }

    stock[size] = quantity;
  }

  return stock;
}

function totalStock(product) {
  return product.sizes.reduce(
    (sum, size) => sum + (Number(product.stock[size]) || 0), 0
  );
}

function stockText(product) {
  return product.sizes
    .map(size => `${size}: ${Number(product.stock[size]) || 0}`)
    .join("، ");
}

function renderStats() {
  document.getElementById("stat-products").textContent =
    products.length.toLocaleString("fa-IR");

  const stock = products.reduce(
    (sum, product) => sum + totalStock(product), 0
  );

  document.getElementById("stat-stock").textContent =
    stock.toLocaleString("fa-IR");

  const value = products.reduce(
    (sum, product) => sum + product.price * totalStock(product), 0
  );

  document.getElementById("stat-value").textContent = money(value);
}

function makeCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function renderProducts() {
  const term = searchInput.value.trim().toLocaleLowerCase("fa");
  const filtered = products.filter(product =>
    product.name.toLocaleLowerCase("fa").includes(term)
  );

  productList.replaceChildren();
  document.getElementById("empty-list").hidden = filtered.length > 0;

  filtered.forEach(product => {
    const row = document.createElement("tr");

    const productCell = document.createElement("td");
    const wrapper = document.createElement("div");
    wrapper.className = "product-cell";

    const img = document.createElement("img");
    img.alt = product.name;
    img.src = product.image || "";
    img.hidden = !product.image;
    img.onerror = () => { img.hidden = true; };

    const details = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;

    const category = document.createElement("small");
    category.textContent = product.categoryName || (product.category === "shoes" ? "کفش" : "لباس");

    details.append(name, category);
    wrapper.append(img, details);
    productCell.appendChild(wrapper);

    const stockCell = makeCell(stockText(product));
    stockCell.style.whiteSpace = "normal";
    stockCell.style.minWidth = "150px";

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-group";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-button";
    editButton.textContent = "ویرایش";
    editButton.addEventListener("click", () => editProduct(product.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button delete";
    deleteButton.textContent = "حذف";
    deleteButton.addEventListener("click", () => deleteProduct(product.id));

    actions.append(editButton, deleteButton);
    actionsCell.appendChild(actions);

    const priceCell = document.createElement("td");
    const basePrice = Number(product.price) || 0;
    const discount = Math.min(90, Math.max(0, Number(product.discount) || 0));
    if (discount > 0) {
      const oldPrice = document.createElement("div");
      oldPrice.textContent = money(basePrice);
      oldPrice.style.textDecoration = "line-through";
      oldPrice.style.color = "#777";
      oldPrice.style.fontSize = "12px";
      const finalPrice = document.createElement("strong");
      finalPrice.textContent = money(Math.round(basePrice * (100 - discount) / 100));
      finalPrice.style.color = "#a3342c";
      priceCell.append(oldPrice, finalPrice);
    } else {
      priceCell.textContent = money(basePrice);
    }

    row.append(
      productCell,
      priceCell,
      makeCell(discount + "٪"),
      stockCell,
      actionsCell
    );

    productList.appendChild(row);
  });

  renderStats();
}

function setupCategoryManagement() {
  const main = document.getElementById("category");
  const sub1 = document.getElementById("subcategory-1");
  main.addEventListener("change", () => refreshProductCategorySelects({ main: main.value }));
  sub1.addEventListener("change", () => refreshProductCategorySelects({ main: main.value, sub1: sub1.value }));
  document.getElementById("category-level").addEventListener("change", refreshCategoryManager);
  document.getElementById("category-parent").addEventListener("change", () => {
    if (document.getElementById("category-level").value === "sub2") fillSelect(document.getElementById("category-subparent"), getMain(document.getElementById("category-parent").value)?.children || [], "انتخاب دسته‌بندی فرعی ۱");
  });
  document.getElementById("add-category-button").addEventListener("click", () => {
    const level = document.getElementById("category-level").value;
    const nameInput = document.getElementById("new-category-name"); const name = nameInput.value.trim();
    const msg = document.getElementById("category-message");
    if (!name) { msg.textContent = "نام دسته‌بندی را وارد کن."; return; }
    let target = categories;
    if (level !== "main") {
      const mainId = document.getElementById("category-parent").value; const mainCategory = getMain(mainId);
      if (!mainCategory) { msg.textContent = "ابتدا دسته‌بندی اصلی را انتخاب کن."; return; }
      if (level === "sub1") target = mainCategory.children;
      else {
        const sub = getSub1(mainId, document.getElementById("category-subparent").value);
        if (!sub) { msg.textContent = "دسته‌بندی فرعی ۱ را انتخاب کن."; return; }
        target = sub.children;
      }
    }
    if (target.some(item => item.name.toLocaleLowerCase("fa") === name.toLocaleLowerCase("fa"))) { msg.textContent = "این نام در همین سطح وجود دارد."; return; }
    target.push({ id: makeCategoryId(), name, children: [] });
    if (!saveCategories()) return;
    nameInput.value = ""; refreshProductCategorySelects(); refreshCategoryManager();
    msg.textContent = "دسته‌بندی با موفقیت اضافه شد.";
  });
  refreshProductCategorySelects(); refreshCategoryManager();
}
setupCategoryManagement();

function resetForm() {
  form.reset();
  document.getElementById("product-id").value = "";
  document.getElementById("form-title").textContent =
    "افزودن محصول جدید";
  document.getElementById("save-button").textContent = "ذخیره محصول";
  document.getElementById("cancel-edit").hidden = true;
  imageUrl.value = "";
  imageFile.value = "";
  setPreview([]);
  showMessage("");
}

function editProduct(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  document.getElementById("product-id").value = product.id;
  document.getElementById("name").value = product.name;
  refreshProductCategorySelects({ main: product.mainCategoryId || product.category, sub1: product.subCategory1Id || "", sub2: product.subCategory2Id || "" });
  document.getElementById("price").value = product.price;
  document.getElementById("discount").value = product.discount || 0;
  document.getElementById("tag").value = product.tag || "";
  document.getElementById("sizes").value = product.sizes.join(", ");
  document.getElementById("stock").value = stockText(product);

  const savedImages = Array.isArray(product.images) && product.images.length
    ? product.images
    : (product.image ? [product.image] : []);
  imageUrl.value = savedImages.filter(src => /^https?:\/\//i.test(src)).join("\n");
  imageFile.value = "";
  setPreview(savedImages);

  document.getElementById("form-title").textContent =
    "ویرایش محصول";
  document.getElementById("save-button").textContent =
    "ذخیره تغییرات";
  document.getElementById("cancel-edit").hidden = false;

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProduct(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  if (!confirm(`محصول «${product.name}» حذف شود؟`)) return;

  const previous = products;
  products = products.filter(item => String(item.id) !== String(id));

  if (!saveProducts()) {
    products = previous;
    return;
  }

  renderProducts();
  showToast("محصول حذف شد.");
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("فقط عکس JPG، PNG یا WebP انتخاب کن."));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("حجم عکس باید کمتر از ۸ مگابایت باشد."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("خواندن عکس ناموفق بود."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("فایل عکس معتبر نیست."));

      image.onload = () => {
        const maxSide = 800;
        const scale = Math.min(
          1,
          maxSide / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("پردازش عکس ممکن نشد."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.70));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

imageFile.addEventListener("change", async () => {
  const files = [...imageFile.files];
  if (!files.length) return;
  if (files.length > 12) {
    imageFile.value = "";
    showMessage("حداکثر ۶ عکس برای هر محصول انتخاب کن.");
    return;
  }
  try {
    const urls = imageUrl.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    const fileImages = [];
    for (const file of files) fileImages.push(await readImageFile(file));
    setPreview([...urls, ...fileImages]);
    showMessage(`${(urls.length + fileImages.length).toLocaleString("fa-IR")} عکس برای محصول آماده است.`);
  } catch (error) {
    imageFile.value = "";
    showMessage(error.message);
  }
});

imageUrl.addEventListener("input", () => {
  const urls = imageUrl.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (urls.some(url => !/^https?:\/\//i.test(url))) {
    showMessage("هر خط باید یک آدرس عکس با http:// یا https:// باشد.");
    return;
  }
  const fileCount = imageFile.files.length;
  if (urls.length + fileCount > 12) {
    showMessage("حداکثر ۶ عکس برای هر محصول مجاز است.");
    return;
  }
  if (fileCount) {
    // پیش‌نمایش فایل‌ها بعد از انتخاب فایل آماده می‌شود؛ URLها در زمان ذخیره ترکیب می‌شوند.
    showMessage(`${urls.length.toLocaleString("fa-IR")} آدرس عکس وارد شده است.`);
  } else {
    setPreview(urls.length ? urls : currentImages);
  }
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    if (!document.getElementById("product-id").value) {
      setPreview("");
    }
  }, 0);
});

document.getElementById("cancel-edit").addEventListener("click", resetForm);
document.getElementById("reset-button").addEventListener("click", resetForm);
searchInput.addEventListener("input", renderProducts);

form.addEventListener("submit", async event => {
  event.preventDefault();
  showMessage("");

  const idValue = document.getElementById("product-id").value;
  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value;
  const subCategory1Id = document.getElementById("subcategory-1").value;
  const subCategory2Id = document.getElementById("subcategory-2").value;
  const price = Number(document.getElementById("price").value);
  const discount = Number(document.getElementById("discount").value);
  const tag = document.getElementById("tag").value.trim();
  const sizes = parseSizes(document.getElementById("sizes").value);

  if (!name || !sizes.length) {
    showMessage("نام محصول و حداقل یک سایز لازم است.");
    return;
  }

  if (
    !Number.isSafeInteger(price) || price < 0 ||
    !Number.isFinite(discount) || discount < 0 || discount > 90
  ) {
    showMessage("قیمت یا درصد تخفیف معتبر نیست.");
    return;
  }

  let stock;

  try {
    stock = parseStock(document.getElementById("stock").value);
  } catch (error) {
    showMessage(error.message);
    return;
  }

  if (sizes.some(size => !Object.hasOwn(stock, size))) {
    showMessage("برای تمام سایزها موجودی وارد کن.");
    return;
  }

  if (Object.keys(stock).some(size => !sizes.includes(size))) {
    showMessage("فقط برای سایزهای انتخاب‌شده موجودی وارد کن.");
    return;
  }

  const oldProduct = idValue
    ? products.find(item => String(item.id) === String(idValue))
    : null;

  const enteredUrls = imageUrl.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (enteredUrls.some(url => !/^https?:\/\//i.test(url))) {
    showMessage("آدرس هر عکس باید با http:// یا https:// شروع شود.");
    return;
  }
  if (enteredUrls.length + imageFile.files.length > 6) {
    showMessage("حداکثر ۶ عکس برای هر محصول مجاز است.");
    return;
  }

  let images = currentImages.slice();
  if (enteredUrls.length || imageFile.files.length) {
    images = [...enteredUrls, ...currentImages.filter(src => src.startsWith("data:image/"))];
    try {
      for (const file of [...imageFile.files]) images.push(await readImageFile(file));
    } catch (error) {
      showMessage(error.message);
      return;
    }
  }
  images = [...new Set(images)].slice(0, 6);
  const image = images[0] || "";

  const product = {
    id: oldProduct ? oldProduct.id : Date.now(),
    name,
    category: category === "shoes" ? "shoes" : category === "clothes" ? "clothes" : "custom",
    mainCategoryId: category,
    subCategory1Id,
    subCategory2Id,
    categoryName: categoryPath(category, subCategory1Id, subCategory2Id),
    price,
    discount,
    sizes,
    stock,
    tag,
    image,
    images
  };

  const previous = products;

  if (oldProduct) {
    products = products.map(item =>
      String(item.id) === String(oldProduct.id) ? product : item
    );
  } else {
    products = [...products, product];
  }

  if (!saveProducts()) {
    products = previous;
    return;
  }

  renderProducts();
  resetForm();
  showToast(oldProduct ? "تغییرات ذخیره شد." : "محصول اضافه شد.");
});

renderProducts();


// مدیریت سفارش‌ها (ذخیره‌شده در همین مرورگر)
const orderList = document.getElementById("order-list");
const orderSearch = document.getElementById("order-search");
const emptyOrders = document.getElementById("empty-orders");
const orderStatuses = {
  new: "جدید",
  confirmed: "تأییدشده",
  preparing: "در حال آماده‌سازی",
  sent: "ارسال‌شده",
  cancelled: "لغوشده"
};

function readOrders() {
  try {
    const value = JSON.parse(localStorage.getItem("vesta_orders") || "[]");
    return Array.isArray(value) ? value : [];
  } catch (_) { return []; }
}

function saveOrders(orders) {
  try {
    localStorage.setItem("vesta_orders", JSON.stringify(orders));
    return true;
  } catch (_) {
    showToast("ذخیره سفارش‌ها ناموفق بود.");
    return false;
  }
}

function orderCell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function renderOrders() {
  if (!orderList) return;
  const orders = readOrders();
  const term = (orderSearch?.value || "").trim().toLocaleLowerCase("fa");
  const filtered = orders.filter(order => {
    const haystack = [order.id, order.customer?.name, order.customer?.phone]
      .join(" ").toLocaleLowerCase("fa");
    return haystack.includes(term);
  });
  orderList.replaceChildren();
  emptyOrders.hidden = filtered.length > 0;

  filtered.forEach(order => {
    const tr = document.createElement("tr");
    const orderInfo = document.createElement("div");
    const orderId = document.createElement("strong");
    orderId.textContent = order.id;
    const address = document.createElement("small");
    address.textContent = order.customer?.address || "آدرس ثبت نشده";
    address.className = "order-address";
    orderInfo.append(orderId, address);
    if (Number.isFinite(Number(order.deliveryLocation?.lat)) && Number.isFinite(Number(order.deliveryLocation?.lng))) {
      const mapLink = document.createElement("a");
      mapLink.className = "order-address";
      mapLink.href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(order.deliveryLocation.lat)}&mlon=${encodeURIComponent(order.deliveryLocation.lng)}#map=17/${encodeURIComponent(order.deliveryLocation.lat)}/${encodeURIComponent(order.deliveryLocation.lng)}`;
      mapLink.target = "_blank";
      mapLink.rel = "noopener noreferrer";
      mapLink.textContent = "مشاهده محل تحویل روی نقشه";
      orderInfo.appendChild(mapLink);
    }
    const first = document.createElement("td");
    first.appendChild(orderInfo);
    tr.appendChild(first);

    const customer = document.createElement("td");
    customer.append(document.createTextNode(order.customer?.name || "—"));
    const phone = document.createElement("small");
    phone.className = "order-address";
    phone.textContent = order.customer?.phone || "—";
    customer.appendChild(phone);
    tr.appendChild(customer);

    const items = (order.items || []).map(item => `${item.name} (${item.size}) × ${item.quantity}`).join("، ");
    tr.appendChild(orderCell(items || "—"));
    tr.appendChild(orderCell(money(Number(order.total) || 0)));

    const statusCell = document.createElement("td");
    const select = document.createElement("select");
    select.className = "order-status-select";
    Object.entries(orderStatuses).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = (order.status || "new") === value;
      select.appendChild(option);
    });
    select.addEventListener("change", () => {
      const currentOrders = readOrders();
      const current = currentOrders.find(item => item.id === order.id);
      if (!current) return;
      const previousStatus = current.status || "new";
      const nextStatus = select.value;
      if (nextStatus === "cancelled" && previousStatus !== "cancelled" && !current.stockRestored) {
        const backup = JSON.stringify(products);
        for (const item of (current.items || [])) {
          const product = products.find(p => String(p.id) === String(item.id));
          if (product) {
            product.stock = product.stock || {};
            product.stock[item.size] = (Number(product.stock[item.size]) || 0) + Number(item.quantity || 0);
          }
        }
        if (!saveProducts()) {
          products = JSON.parse(backup);
          select.value = previousStatus;
          return;
        }
        current.stockRestored = true;
      }
      // سفارش لغوشده دوباره فعال نمی‌شود تا موجودی دوبار محاسبه نشود.
      if (previousStatus === "cancelled" && nextStatus !== "cancelled" && current.stockRestored) {
        select.value = "cancelled";
        showToast("سفارش لغوشده را دوباره فعال نکن؛ برای جلوگیری از خطای موجودی، سفارش جدید ثبت کن.");
        return;
      }
      current.status = nextStatus;
      if (saveOrders(currentOrders)) showToast("وضعیت سفارش به‌روزرسانی شد.");
    });
    statusCell.appendChild(select);
    tr.appendChild(statusCell);

    let dateText = "—";
    if (order.createdAt) {
      const date = new Date(order.createdAt);
      if (!Number.isNaN(date.getTime())) dateText = date.toLocaleString("fa-IR");
    }
    tr.appendChild(orderCell(dateText));
    orderList.appendChild(tr);
  });
}

if (orderSearch) orderSearch.addEventListener("input", renderOrders);
window.addEventListener("storage", event => {
  if (event.key === "vesta_orders") renderOrders();
  if (event.key === "vesta_products") {
    try {
      products = normalizeAndMergeProducts(JSON.parse(event.newValue || "[]"));
      renderProducts();
    } catch (_) {}
  }
});
renderOrders();
