/* Lysee private travel journal — front-end demo credentials only.
   For real security, move authentication to a server-side service. */
const DEMO_ACCOUNT = { email: "lyseetse@msn.com", password: "anson4486014" };
const loginGate = document.querySelector("#login-gate");
const appShell = document.querySelector("#app-shell");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const rememberMe = document.querySelector("#remember-me");
const loginButton = loginForm.querySelector("button[type='submit']");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#password-toggle");
const logoutButton = document.querySelector("#logout-button");
const postsGrid = document.querySelector("#posts-grid");
const loadError = document.querySelector("#load-error");
const postCount = document.querySelector("#post-count");
let map;

function showApp() {
  loginGate.hidden = true;
  appShell.hidden = false;
  document.body.classList.add("is-authenticated");
  window.setTimeout(() => {
    if (!map) initMap();
    map?.invalidateSize();
  }, 80);
}

function showLogin() {
  loginGate.hidden = false;
  appShell.hidden = true;
  document.body.classList.remove("is-authenticated");
  loginForm.reset();
}

function handleLogin(event) {
  event?.preventDefault();
  const email = document.querySelector("#email").value.trim().toLowerCase();
  const password = document.querySelector("#password").value;
  if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
    sessionStorage.setItem("lysee-authenticated", "true");
    if (rememberMe.checked) localStorage.setItem("lysee-remembered", "true");
    else localStorage.removeItem("lysee-remembered");
    loginError.textContent = "";
    showApp();
  } else {
    loginError.textContent = "登入資料不正確，請再試一次。";
  }
}

loginForm.addEventListener("submit", handleLogin);
loginButton.addEventListener("click", handleLogin);
passwordToggle.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.textContent = isVisible ? "眼仔" : "隱藏";
  passwordToggle.setAttribute("aria-label", isVisible ? "顯示密碼" : "隱藏密碼");
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("lysee-authenticated");
  localStorage.removeItem("lysee-remembered");
  showLogin();
});

async function getPosts() {
  const response = await fetch("posts.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load posts.json (${response.status})`);
  const posts = await response.json();
  if (!Array.isArray(posts)) throw new Error("posts.json must contain an array");
  return posts;
}

function initMap() {
  map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView([35.75, 127.8], 5);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  }).addTo(map);
  getPosts().then((posts) => {
    posts.forEach((post) => addMarker(post));
    if (posts.length) map.fitBounds(posts.map((post) => [post.coordinates.lat, post.coordinates.lng]), { padding: [32, 32] });
  }).catch((error) => console.warn(error));
}

function addMarker(post) {
  const icon = L.divIcon({ className: "", html: '<span class="lysee-marker"></span>', iconSize: [12, 12], iconAnchor: [6, 6] });
  const marker = L.marker([post.coordinates.lat, post.coordinates.lng], { icon }).addTo(map);
  marker.bindPopup(`<div class="popup-location">${escapeHtml(post.date)}</div><strong>${escapeHtml(post.location)}</strong>`);
  marker.on("click", () => document.querySelector(`#post-${post.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
}

function renderPosts(posts) {
  postCount.textContent = `${String(posts.length).padStart(2, "0")} ENTRIES`;
  postsGrid.innerHTML = posts.map((post) => `
    <article class="post-card" id="post-${escapeHtml(post.id)}">
      <figure><img src="${escapeAttribute(post.image)}" alt="${escapeAttribute(post.imageAlt || post.location)}" loading="lazy" /></figure>
      <div class="post-meta"><time datetime="${escapeAttribute(post.date)}">${escapeHtml(formatDate(post.date))}</time><span>${escapeHtml(post.location)}</span></div>
      <h4>${escapeHtml(post.title)}</h4>
      <p>${escapeHtml(post.content)}</p>
      <div class="tags">${(post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    </article>`).join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-Hant", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function escapeAttribute(value = "") { return escapeHtml(value); }

async function loadJournal() {
  try { renderPosts(await getPosts()); }
  catch (error) { loadError.textContent = "暫時未能載入遊記，請確認你係用 Live Server 開啟，而唔係直接雙擊 HTML。"; console.error(error); }
}

document.querySelector("#year").textContent = new Date().getFullYear();
loadJournal();
if (sessionStorage.getItem("lysee-authenticated") === "true" || localStorage.getItem("lysee-remembered") === "true") {
  showApp();
}
