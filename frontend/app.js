import {
  apiRequest,
  checkConnection,
  clearSession,
  getApiBaseUrl,
  getSession,
  saveSession,
  setApiBaseUrl
} from "./api-client.js";

const app = document.querySelector("#app");
const modal = document.querySelector("#app-modal");
const modalBody = document.querySelector("#modal-body");
const modalTitle = document.querySelector("#modal-title");
const modalEyebrow = document.querySelector("#modal-eyebrow");
const toastRegion = document.querySelector("#toast-region");

const state = {
  session: getSession(),
  currentView: "dashboard",
  connected: false,
  products: [],
  categories: [],
  brands: [],
  users: [],
  roles: []
};

const iconPaths = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  tag: '<path d="M20.6 13.6 11 4H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 8.92 4.6h.08a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.12.61.66 1.05 1.29 1.08H21v4h-.09A1.65 1.65 0 0 0 19.4 15Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',
  refresh: '<path d="M20 6v6h-6"/><path d="M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6.2 5.2L4 7M20 17l-2.2 1.8A7 7 0 0 1 5.5 15"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/>'
};

function icon(name, label = "") {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="${label ? "false" : "true"}"${label ? ` aria-label="${escapeHtml(label)}"` : ""}>${iconPaths[name] || iconPaths.box}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function initials(value) {
  return String(value || "TM")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase())
    .join("") || "TM";
}

function toast(message, type = "success", title = type === "error" ? "No se pudo completar" : "Listo") {
  const element = document.createElement("div");
  element.className = `toast ${type}`;
  element.innerHTML = `
    <div class="toast-icon">${type === "error" ? "!" : "✓"}</div>
    <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>
  `;
  toastRegion.append(element);
  setTimeout(() => element.remove(), 4200);
}

function setButtonLoading(button, loading, text = "Procesando...") {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.textContent = text;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
  }
}

function brand() {
  return `<div class="brand"><span class="brand-mark" aria-hidden="true"></span><span class="brand-name">TechManager</span></div>`;
}

async function init() {
  state.connected = await checkConnection();
  if (state.session.token && state.session.user) {
    renderShell();
    await navigate("dashboard");
  } else {
    await renderLogin();
  }
}

async function renderLogin() {
  let requiresAdmin = false;
  try {
    const status = await apiRequest("/auth/bootstrap-status", { auth: false });
    requiresAdmin = Boolean(status.requiereAdministrador);
    state.connected = true;
  } catch {
    state.connected = false;
  }

  app.innerHTML = `
    <main class="login-page">
      <section class="login-panel">
        ${brand()}
        <div class="login-copy">
          <p class="eyebrow">${requiresAdmin ? "Configuración inicial" : "Bienvenido de nuevo"}</p>
          <h1>${requiresAdmin ? "Creá tu cuenta administradora" : "Todo tu negocio, en un solo lugar."}</h1>
          <p>${requiresAdmin
            ? "Esta será la primera cuenta con acceso completo a TechManager."
            : "Ingresá para administrar productos, stock y tu equipo."}</p>
        </div>
        <form class="login-form" id="auth-form" data-mode="${requiresAdmin ? "bootstrap" : "login"}">
          ${requiresAdmin ? `
            <div class="form-field">
              <label for="auth-name">Nombre completo</label>
              <input id="auth-name" name="nombre" autocomplete="name" required placeholder="Tu nombre">
            </div>` : ""}
          <div class="form-field">
            <label for="auth-email">Email</label>
            <div class="input-with-icon">${icon("mail")}<input id="auth-email" name="email" type="email" autocomplete="email" required placeholder="nombre@empresa.com"></div>
          </div>
          <div class="form-field">
            <label for="auth-password">Contraseña</label>
            <div class="input-with-icon">${icon("lock")}<input id="auth-password" name="password" type="password" autocomplete="${requiresAdmin ? "new-password" : "current-password"}" minlength="${requiresAdmin ? "8" : "1"}" required placeholder="${requiresAdmin ? "Mínimo 8 caracteres" : "Tu contraseña"}"></div>
          </div>
          <button class="button button-primary button-full" type="submit">${requiresAdmin ? "Crear administrador" : "Ingresar a TechManager"}</button>
        </form>
        <p class="login-help">Conexión: <strong>${state.connected ? "API disponible" : "API sin respuesta"}</strong><br>${state.connected ? "Tus datos viajan protegidos mediante autenticación JWT." : `Revisá que el backend esté iniciado en ${escapeHtml(getApiBaseUrl())}.`}</p>
      </section>
      <aside class="login-visual" aria-hidden="true">
        <div class="login-grid"></div>
        <div class="visual-card">
          <p class="eyebrow" style="color:#a99fff">Control operativo</p>
          <h2>Decisiones claras. Stock bajo control.</h2>
          <p>Una vista simple para saber qué tenés, qué falta y qué necesita atención.</p>
          <div class="visual-stats">
            <div class="visual-stat"><strong>01</strong><span>Panel central</span></div>
            <div class="visual-stat"><strong>24/7</strong><span>Acceso web</span></div>
            <div class="visual-stat"><strong>100%</strong><span>Datos reales</span></div>
          </div>
        </div>
      </aside>
    </main>`;

  document.querySelector("#auth-form").addEventListener("submit", handleAuth);
}

async function handleAuth(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type=submit]");
  const data = Object.fromEntries(new FormData(form));
  const mode = form.dataset.mode;
  setButtonLoading(button, true, mode === "bootstrap" ? "Creando cuenta..." : "Ingresando...");
  try {
    const response = await apiRequest(mode === "bootstrap" ? "/auth/bootstrap" : "/auth/login", {
      method: "POST",
      auth: false,
      body: data
    });
    state.session = saveSession(response);
    toast(`Hola, ${state.session.user.nombre}`);
    renderShell();
    await navigate("dashboard");
  } catch (error) {
    toast(error.message, "error", "No pudimos ingresar");
    setButtonLoading(button, false);
  }
}

function renderShell() {
  const user = state.session.user;
  const adminNav = user?.rol === "ADMIN"
    ? `<button class="nav-button" data-nav="users">${icon("users")}<span>Usuarios</span></button>`
    : "";

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        ${brand()}
        <p class="sidebar-label">Principal</p>
        <nav class="nav-list" aria-label="Navegación principal">
          <button class="nav-button active" data-nav="dashboard">${icon("dashboard")}<span>Resumen</span></button>
          <button class="nav-button" data-nav="products">${icon("box")}<span>Productos</span></button>
          <button class="nav-button" data-nav="categories">${icon("layers")}<span>Categorías</span></button>
          <button class="nav-button" data-nav="brands">${icon("tag")}<span>Marcas</span></button>
          ${adminNav}
        </nav>
        <p class="sidebar-label">Sistema</p>
        <nav class="nav-list" aria-label="Configuración">
          <button class="nav-button" data-nav="settings">${icon("settings")}<span>Configuración</span></button>
        </nav>
        <div class="sidebar-footer">
          <div class="user-card">
            <div class="avatar">${escapeHtml(initials(user?.nombre))}</div>
            <div class="user-meta"><strong>${escapeHtml(user?.nombre)}</strong><span>${escapeHtml(user?.rol?.toLowerCase())}</span></div>
            <button class="icon-button" data-action="logout" aria-label="Cerrar sesión">${icon("logout")}</button>
          </div>
        </div>
      </aside>
      <section class="main-area">
        <header class="topbar">
          <div class="topbar-start">
            <button class="icon-button mobile-menu-button" data-action="toggle-sidebar" aria-label="Abrir menú">${icon("menu")}</button>
            <span class="topbar-title" id="topbar-title">Resumen</span>
          </div>
          <div class="topbar-end">
            <span class="connection-pill ${state.connected ? "" : "offline"}" id="connection-pill"><span class="status-dot"></span><span>${state.connected ? "API conectada" : "Sin conexión"}</span></span>
            <button class="icon-button" data-action="refresh" aria-label="Actualizar información">${icon("refresh")}</button>
          </div>
        </header>
        <main class="content" id="view-content"></main>
      </section>
    </div>`;

}

async function handleAppClick(event) {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    await navigate(nav.dataset.nav);
    document.querySelector("#sidebar")?.classList.remove("open");
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const { action, id, entity } = actionButton.dataset;

  if (action === "logout") return logout();
  if (action === "toggle-sidebar") return document.querySelector("#sidebar")?.classList.toggle("open");
  if (action === "refresh") return navigate(state.currentView, true);
  if (action === "new-product") return prepareProductModal();
  if (action === "edit-product") return prepareProductModal(Number(id));
  if (action === "delete-product") return deleteRecord("productos", Number(id), "producto");
  if (action === "new-entity") return openSimpleEntityModal(entity);
  if (action === "edit-entity") return openSimpleEntityModal(entity, Number(id));
  if (action === "delete-entity") return deleteRecord(entity, Number(id), entity === "categorias" ? "categoría" : "marca");
  if (action === "new-user") return openUserModal();
  if (action === "edit-user") return openUserModal(Number(id));
  if (action === "delete-user") return deleteRecord("usuarios", Number(id), "usuario");
}

function logout() {
  clearSession();
  state.session = { token: null, user: null };
  state.currentView = "dashboard";
  renderLogin();
}

async function navigate(view, refreshing = false) {
  state.currentView = view;
  document.querySelectorAll("[data-nav]").forEach(button => {
    button.classList.toggle("active", button.dataset.nav === view);
  });
  const labels = {
    dashboard: "Resumen",
    products: "Productos",
    categories: "Categorías",
    brands: "Marcas",
    users: "Usuarios",
    settings: "Configuración"
  };
  const topbar = document.querySelector("#topbar-title");
  if (topbar) topbar.textContent = labels[view] || "TechManager";
  const content = document.querySelector("#view-content");
  if (!content) return;
  content.innerHTML = `<div class="loading-grid">${Array(4).fill('<div class="skeleton"></div>').join("")}</div>`;

  try {
    if (view === "dashboard") await renderDashboard(content);
    if (view === "products") await renderProducts(content);
    if (view === "categories") await renderSimpleEntities(content, "categorias");
    if (view === "brands") await renderSimpleEntities(content, "marcas");
    if (view === "users") await renderUsers(content);
    if (view === "settings") renderSettings(content);
    state.connected = true;
    updateConnectionPill();
    if (refreshing) toast("Información actualizada");
  } catch (error) {
    state.connected = error.status !== undefined;
    updateConnectionPill();
    content.innerHTML = errorState(error.message);
  }
}

function updateConnectionPill() {
  const pill = document.querySelector("#connection-pill");
  if (!pill) return;
  pill.classList.toggle("offline", !state.connected);
  pill.innerHTML = `<span class="status-dot"></span><span>${state.connected ? "API conectada" : "Sin conexión"}</span>`;
}

function pageHeader(eyebrow, title, description, actions = "") {
  return `<div class="page-header"><div class="page-title"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${actions ? `<div class="header-actions">${actions}</div>` : ""}</div>`;
}

function emptyState(title, text, iconName = "box") {
  return `<div class="empty-state"><div class="empty-icon">${icon(iconName)}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`;
}

function errorState(message) {
  return `${pageHeader("Estado del sistema", "No pudimos cargar esta sección", "Comprobá la conexión con el backend e intentá nuevamente.", `<button class="button" data-action="refresh">${icon("refresh")} Reintentar</button>`)}<div class="panel">${emptyState("La API no respondió", message, "settings")}</div>`;
}

async function renderDashboard(content) {
  const [stats, products] = await Promise.all([
    apiRequest("/dashboard"),
    apiRequest("/productos")
  ]);
  state.products = products;
  const lowStock = [...products]
    .filter(product => Number(product.stock) <= 5)
    .sort((a, b) => Number(a.stock) - Number(b.stock))
    .slice(0, 6);
  const categoryCounts = products.reduce((acc, product) => {
    const name = product.categoria?.nombre || "Sin categoría";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCategory = Math.max(...topCategories.map(([, count]) => count), 1);

  const cards = [
    ["Productos", stats.productos, "box", ""],
    ["Categorías", stats.categorias, "layers", "teal"],
    ["Marcas", stats.marcas, "tag", ""],
    ["Usuarios", stats.usuarios, "users", "teal"],
    ["Sin stock", stats.productosSinStock, "box", "amber"]
  ];

  content.innerHTML = `
    ${pageHeader("Vista general", `Hola, ${state.session.user.nombre.split(" ")[0]}`, "Así está TechManager en este momento.", `<button class="button button-primary" data-action="new-product">${icon("plus")} Nuevo producto</button>`)}
    <section class="stats-grid" aria-label="Indicadores principales">
      ${cards.map(([label, value, iconName, tone]) => `<article class="stat-card"><div class="stat-head"><span>${label}</span><span class="stat-icon ${tone}">${icon(iconName)}</span></div><strong class="stat-value">${Number(value || 0).toLocaleString("es-AR")}</strong></article>`).join("")}
    </section>
    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-header"><div><h2>Productos que necesitan atención</h2><p>Stock igual o menor a cinco unidades</p></div><button class="button button-quiet" data-nav="products">Ver inventario</button></div>
        <div class="panel-body">${lowStock.length ? `<div class="quick-list">${lowStock.map(product => `<div class="quick-item"><div class="product-avatar">${escapeHtml(initials(product.nombre))}</div><div class="quick-copy"><strong>${escapeHtml(product.nombre)}</strong><span>${escapeHtml(product.marca?.nombre || "Sin marca")} · ${escapeHtml(product.categoria?.nombre || "Sin categoría")}</span></div><span class="badge ${Number(product.stock) === 0 ? "badge-danger" : "badge-warning"}">${Number(product.stock)} un.</span></div>`).join("")}</div>` : emptyState("Stock saludable", "No hay productos con stock crítico.", "box")}</div>
      </article>
      <article class="panel">
        <div class="panel-header"><div><h2>Distribución del catálogo</h2><p>Productos por categoría</p></div></div>
        <div class="panel-body">${topCategories.length ? `<div class="progress-stack">${topCategories.map(([name, count]) => `<div class="progress-row"><div class="progress-meta"><span>${escapeHtml(name)}</span><strong>${count}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${Math.max(8, count / maxCategory * 100)}%"></div></div></div>`).join("")}</div>` : emptyState("Todavía no hay datos", "Agregá productos para ver la distribución.", "layers")}</div>
      </article>
    </section>`;
}

async function ensureCatalogs() {
  const [categories, brands] = await Promise.all([
    apiRequest("/categorias"),
    apiRequest("/marcas")
  ]);
  state.categories = categories;
  state.brands = brands;
}

async function renderProducts(content) {
  const [products] = await Promise.all([apiRequest("/productos"), ensureCatalogs()]);
  state.products = products;
  content.innerHTML = `
    ${pageHeader("Inventario", "Productos", "Administrá precios, stock, categorías y marcas.", `<button class="button button-primary" data-action="new-product">${icon("plus")} Agregar producto</button>`)}
    <section class="panel">
      <div class="toolbar"><div class="search-wrap">${icon("search")}<input class="search-input" id="product-search" type="search" placeholder="Buscar producto, marca o categoría..."></div><span class="badge badge-neutral" id="product-count">${products.length} productos</span></div>
      <div id="products-table"></div>
    </section>`;
  renderProductsTable("");
  document.querySelector("#product-search").addEventListener("input", event => renderProductsTable(event.target.value));
}

function renderProductsTable(query) {
  const normalized = query.trim().toLowerCase();
  const products = state.products.filter(product => [
    product.nombre,
    product.descripcion,
    product.marca?.nombre,
    product.categoria?.nombre
  ].some(value => String(value || "").toLowerCase().includes(normalized)));
  const count = document.querySelector("#product-count");
  if (count) count.textContent = `${products.length} ${products.length === 1 ? "producto" : "productos"}`;
  const target = document.querySelector("#products-table");
  if (!target) return;
  if (!products.length) {
    target.innerHTML = emptyState(normalized ? "No encontramos coincidencias" : "Todavía no hay productos", normalized ? "Probá con otra búsqueda." : "Agregá el primer producto para comenzar.", "box");
    return;
  }
  target.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Marca</th><th>Compra</th><th>Venta</th><th>Stock</th><th>Estado</th><th aria-label="Acciones"></th></tr></thead><tbody>${products.map(product => `<tr><td class="cell-primary"><strong>${escapeHtml(product.nombre)}</strong><span>${escapeHtml(product.descripcion || "Sin descripción")}</span></td><td>${escapeHtml(product.categoria?.nombre || "—")}</td><td>${escapeHtml(product.marca?.nombre || "—")}</td><td>${money(product.precioCompra)}</td><td><strong>${money(product.precioVenta)}</strong></td><td><span class="badge ${Number(product.stock) === 0 ? "badge-danger" : Number(product.stock) <= 5 ? "badge-warning" : "badge-success"}">${Number(product.stock)} un.</span></td><td><span class="badge ${product.activo ? "badge-success" : "badge-neutral"}">${product.activo ? "Activo" : "Inactivo"}</span></td><td><div class="table-actions"><button class="icon-button" data-action="edit-product" data-id="${product.id}" aria-label="Editar ${escapeHtml(product.nombre)}">${icon("edit")}</button><button class="icon-button" data-action="delete-product" data-id="${product.id}" aria-label="Eliminar ${escapeHtml(product.nombre)}">${icon("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>`;
}

async function renderSimpleEntities(content, entity) {
  const isCategory = entity === "categorias";
  const list = await apiRequest(`/${entity}`);
  if (isCategory) state.categories = list; else state.brands = list;
  const singular = isCategory ? "categoría" : "marca";
  const title = isCategory ? "Categorías" : "Marcas";
  const iconName = isCategory ? "layers" : "tag";
  content.innerHTML = `
    ${pageHeader("Organización del catálogo", title, `Administrá las ${title.toLowerCase()} disponibles para tus productos.`, `<button class="button button-primary" data-action="new-entity" data-entity="${entity}">${icon("plus")} Nueva ${singular}</button>`)}
    <section class="panel">
      <div class="panel-header"><div><h2>${title} registradas</h2><p>${list.length} ${list.length === 1 ? singular : title.toLowerCase()}</p></div></div>
      ${list.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Nombre</th><th aria-label="Acciones"></th></tr></thead><tbody>${list.map(item => `<tr><td>#${item.id}</td><td class="cell-primary"><strong>${escapeHtml(item.nombre)}</strong></td><td><div class="table-actions"><button class="icon-button" data-action="edit-entity" data-entity="${entity}" data-id="${item.id}" aria-label="Editar">${icon("edit")}</button><button class="icon-button" data-action="delete-entity" data-entity="${entity}" data-id="${item.id}" aria-label="Eliminar">${icon("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : emptyState(`Todavía no hay ${title.toLowerCase()}`, `Creá la primera ${singular} para organizar tus productos.`, iconName)}
    </section>`;
}

async function renderUsers(content) {
  if (state.session.user.rol !== "ADMIN") {
    content.innerHTML = errorState("Esta sección está disponible únicamente para administradores.");
    return;
  }
  const [users, roles] = await Promise.all([apiRequest("/usuarios"), apiRequest("/roles")]);
  state.users = users;
  state.roles = roles;
  content.innerHTML = `
    ${pageHeader("Accesos y permisos", "Usuarios", "Administrá quién puede ingresar al sistema.", `<button class="button button-primary" data-action="new-user">${icon("plus")} Nuevo usuario</button>`)}
    <section class="panel">
      <div class="panel-header"><div><h2>Equipo con acceso</h2><p>${users.length} ${users.length === 1 ? "usuario registrado" : "usuarios registrados"}</p></div></div>
      ${users.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th aria-label="Acciones"></th></tr></thead><tbody>${users.map(user => `<tr><td class="cell-primary"><strong>${escapeHtml(user.nombre)}</strong></td><td>${escapeHtml(user.email)}</td><td><span class="badge badge-neutral">${escapeHtml(user.rol?.nombre || "Sin rol")}</span></td><td><span class="badge ${user.activo ? "badge-success" : "badge-neutral"}">${user.activo ? "Activo" : "Inactivo"}</span></td><td><div class="table-actions"><button class="icon-button" data-action="edit-user" data-id="${user.id}" aria-label="Editar">${icon("edit")}</button><button class="icon-button" data-action="delete-user" data-id="${user.id}" aria-label="Eliminar">${icon("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : emptyState("Todavía no hay usuarios", "Creá un usuario para darle acceso al sistema.", "users")}
    </section>`;
}

function renderSettings(content) {
  const isProxy = getApiBaseUrl() === "/api";
  content.innerHTML = `
    ${pageHeader("Preferencias", "Configuración", "Revisá la conexión entre la página y el backend.")}
    <section class="panel settings-card">
      <div class="panel-header"><div><h2>Conexión con la API</h2><p>URL utilizada por esta computadora</p></div><span class="connection-pill ${state.connected ? "" : "offline"}"><span class="status-dot"></span>${state.connected ? "Conectada" : "Sin respuesta"}</span></div>
      <form class="panel-body" id="settings-form">
        <div class="settings-row">
          <div class="form-field"><label for="api-url">Dirección del backend</label><input id="api-url" name="apiUrl" value="${escapeHtml(getApiBaseUrl())}" placeholder="https://api.techmanager.com"></div>
          <button class="button button-primary" type="submit">${icon("save")} Guardar y probar</button>
        </div>
        <p class="info-box">${isProxy ? "En Vercel se utiliza el proxy seguro incluido en el proyecto. La dirección real del backend se configura con la variable BACKEND_URL." : "Para desarrollo local, la dirección habitual es http://localhost:8080. Dejá el campo vacío para volver a la configuración automática."}</p>
      </form>
    </section>`;
  document.querySelector("#settings-form").addEventListener("submit", handleSettings);
}

async function handleSettings(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  setButtonLoading(button, true, "Probando...");
  setApiBaseUrl(new FormData(event.currentTarget).get("apiUrl"));
  state.connected = await checkConnection();
  setButtonLoading(button, false);
  updateConnectionPill();
  toast(state.connected ? "La conexión funciona correctamente" : "La API no respondió en esa dirección", state.connected ? "success" : "error");
  renderSettings(document.querySelector("#view-content"));
}

function openModal({ title, eyebrow, body }) {
  modalTitle.textContent = title;
  modalEyebrow.textContent = eyebrow;
  modalBody.innerHTML = body;
  modal.showModal();
  modalBody.querySelector("input, select, textarea")?.focus();
}

function closeModal() {
  modal.close();
  modalBody.innerHTML = "";
}

async function prepareProductModal(id = null) {
  try {
    if (!state.categories.length || !state.brands.length) {
      await ensureCatalogs();
    }
    openProductModal(id);
  } catch (error) {
    toast(error.message, "error");
  }
}

function openProductModal(id = null) {
  if (!state.categories.length || !state.brands.length) {
    toast("Primero necesitás crear al menos una categoría y una marca", "error", "Faltan datos del catálogo");
    return;
  }
  const product = id ? state.products.find(item => item.id === id) : null;
  openModal({
    eyebrow: "Inventario",
    title: product ? "Editar producto" : "Nuevo producto",
    body: `<form class="modal-form" data-modal-form="product" data-id="${product?.id || ""}"><div class="form-grid"><div class="form-field full"><label for="product-name">Nombre</label><input id="product-name" name="nombre" required maxlength="150" value="${escapeHtml(product?.nombre || "")}" placeholder="Ej. Notebook Lenovo ThinkPad"></div><div class="form-field full"><label for="product-description">Descripción</label><textarea id="product-description" name="descripcion" maxlength="500" placeholder="Detalle opcional">${escapeHtml(product?.descripcion || "")}</textarea></div><div class="form-field"><label for="purchase-price">Precio de compra</label><input id="purchase-price" name="precioCompra" type="number" min="0" step="0.01" required value="${product?.precioCompra ?? ""}"></div><div class="form-field"><label for="sale-price">Precio de venta</label><input id="sale-price" name="precioVenta" type="number" min="0" step="0.01" required value="${product?.precioVenta ?? ""}"></div><div class="form-field"><label for="stock">Stock</label><input id="stock" name="stock" type="number" min="0" step="1" required value="${product?.stock ?? 0}"></div><div class="checkbox-field"><input id="product-active" name="activo" type="checkbox" ${product?.activo === false ? "" : "checked"}><label for="product-active">Producto activo</label></div><div class="form-field"><label for="category">Categoría</label><select id="category" name="categoriaId" required><option value="">Seleccionar</option>${state.categories.map(category => `<option value="${category.id}" ${product?.categoria?.id === category.id ? "selected" : ""}>${escapeHtml(category.nombre)}</option>`).join("")}</select></div><div class="form-field"><label for="brand">Marca</label><select id="brand" name="marcaId" required><option value="">Seleccionar</option>${state.brands.map(brand => `<option value="${brand.id}" ${product?.marca?.id === brand.id ? "selected" : ""}>${escapeHtml(brand.nombre)}</option>`).join("")}</select></div></div><div class="form-actions"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button-primary" type="submit">${icon("save")} ${product ? "Guardar cambios" : "Crear producto"}</button></div></form>`
  });
}

function openSimpleEntityModal(entity, id = null) {
  const isCategory = entity === "categorias";
  const list = isCategory ? state.categories : state.brands;
  const item = id ? list.find(value => value.id === id) : null;
  const singular = isCategory ? "categoría" : "marca";
  openModal({
    eyebrow: "Catálogo",
    title: item ? `Editar ${singular}` : `Nueva ${singular}`,
    body: `<form class="modal-form" data-modal-form="simple-entity" data-entity="${entity}" data-id="${item?.id || ""}"><div class="form-field"><label for="entity-name">Nombre</label><input id="entity-name" name="nombre" required maxlength="100" value="${escapeHtml(item?.nombre || "")}" placeholder="Nombre de la ${singular}"></div><div class="form-actions"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button-primary" type="submit">${icon("save")} Guardar</button></div></form>`
  });
}

function openUserModal(id = null) {
  const user = id ? state.users.find(item => item.id === id) : null;
  openModal({
    eyebrow: "Accesos",
    title: user ? "Editar usuario" : "Nuevo usuario",
    body: `<form class="modal-form" data-modal-form="user" data-id="${user?.id || ""}"><div class="form-grid"><div class="form-field"><label for="user-name">Nombre</label><input id="user-name" name="nombre" required maxlength="100" value="${escapeHtml(user?.nombre || "")}"></div><div class="form-field"><label for="user-email">Email</label><input id="user-email" name="email" type="email" required maxlength="100" value="${escapeHtml(user?.email || "")}"></div><div class="form-field"><label for="user-password">Contraseña ${user ? "(opcional)" : ""}</label><input id="user-password" name="password" type="password" ${user ? "" : "required minlength=8"} placeholder="${user ? "Dejar vacía para conservar" : "Mínimo 8 caracteres"}"></div><div class="form-field"><label for="user-role">Rol</label><select id="user-role" name="rolId" required><option value="">Seleccionar</option>${state.roles.map(role => `<option value="${role.id}" ${user?.rol?.id === role.id ? "selected" : ""}>${escapeHtml(role.nombre)}</option>`).join("")}</select></div><div class="checkbox-field"><input id="user-active" name="activo" type="checkbox" ${user?.activo === false ? "" : "checked"}><label for="user-active">Usuario activo</label></div></div><div class="form-actions"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button-primary" type="submit">${icon("save")} Guardar usuario</button></div></form>`
  });
}

async function handleModalSubmit(event) {
  const form = event.target.closest("[data-modal-form]");
  if (!form) return;
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  setButtonLoading(button, true, "Guardando...");
  const data = Object.fromEntries(new FormData(form));
  const id = Number(form.dataset.id) || null;
  try {
    if (form.dataset.modalForm === "product") {
      const body = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioCompra: Number(data.precioCompra),
        precioVenta: Number(data.precioVenta),
        stock: Number(data.stock),
        activo: form.elements.activo.checked,
        categoria: { id: Number(data.categoriaId) },
        marca: { id: Number(data.marcaId) }
      };
      await apiRequest(id ? `/productos/${id}` : "/productos", { method: id ? "PUT" : "POST", body });
    }
    if (form.dataset.modalForm === "simple-entity") {
      await apiRequest(id ? `/${form.dataset.entity}/${id}` : `/${form.dataset.entity}`, {
        method: id ? "PUT" : "POST",
        body: { nombre: data.nombre }
      });
    }
    if (form.dataset.modalForm === "user") {
      const body = {
        nombre: data.nombre,
        email: data.email,
        password: data.password || null,
        rol: { id: Number(data.rolId) },
        activo: form.elements.activo.checked
      };
      await apiRequest(id ? `/usuarios/${id}` : "/usuarios", { method: id ? "PUT" : "POST", body });
    }
    closeModal();
    toast(id ? "Los cambios fueron guardados" : "El registro fue creado");
    await navigate(state.currentView);
  } catch (error) {
    toast(error.message, "error");
    setButtonLoading(button, false);
  }
}

async function deleteRecord(entity, id, label) {
  if (!window.confirm(`¿Seguro que querés eliminar este ${label}?`)) return;
  try {
    await apiRequest(`/${entity}/${id}`, { method: "DELETE" });
    toast(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminado`);
    await navigate(state.currentView);
  } catch (error) {
    toast(error.message, "error");
  }
}

modal.addEventListener("click", event => {
  if (event.target === modal || event.target.closest("[data-close-modal]")) closeModal();
});
modal.addEventListener("submit", handleModalSubmit);
app.addEventListener("click", handleAppClick);
window.addEventListener("techmanager:session-expired", () => {
  state.session = { token: null, user: null };
  toast("Volvé a ingresar para continuar", "error", "La sesión venció");
  renderLogin();
});

init();

