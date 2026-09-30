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
  loginGate.style.display = "none";
  appShell.hidden = false;
  appShell.style.display = "block";
  document.body.classList.add("is-authenticated");
  window.setTimeout(() => {
    if (!map) initMap();
    map?.invalidateSize();
  }, 80);
}

function showLogin() {
  loginGate.hidden = false;
  loginGate.style.display = "grid";
  appShell.hidden = true;
  appShell.style.display = "none";
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
function revealPassword() {
  passwordInput.type = "text";
  passwordToggle.setAttribute("aria-label", "移開眼睛圖示隱藏密碼");
  passwordToggle.setAttribute("aria-pressed", "true");
}

function concealPassword() {
  passwordInput.type = "password";
  passwordToggle.setAttribute("aria-label", "移到眼睛圖示上顯示密碼");
  passwordToggle.setAttribute("aria-pressed", "false");
}

passwordToggle.addEventListener("mouseenter", revealPassword);
passwordToggle.addEventListener("mouseleave", concealPassword);
passwordToggle.addEventListener("focus", revealPassword);
passwordToggle.addEventListener("blur", concealPassword);

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
  getPosts().then((posts) => {
    renderSlideshow(posts);
    map = { invalidateSize() {} };
  }).catch((error) => console.warn(error));
}

function renderSlideshow(posts) {
  const box = document.querySelector("#map");
  if (!box || !posts.length) return;
  let active = 0;
  let timer;
  box.innerHTML = `
    <div class="slides-track"></div>
    <button class="slide-arrow slide-prev" type="button" aria-label="上一張相片">←</button>
    <button class="slide-arrow slide-next" type="button" aria-label="下一張相片">→</button>
    <div class="slide-caption"></div>
    <div class="slide-dots" role="tablist" aria-label="相片選擇"></div>`;
  const track = box.querySelector(".slides-track");
  const caption = box.querySelector(".slide-caption");
  const dots = box.querySelector(".slide-dots");
  track.innerHTML = posts.map((post) => `<img class="slide-image" src="${escapeAttribute(post.image)}" alt="${escapeAttribute(post.imageAlt || post.title)}" loading="lazy" />`).join("");
  dots.innerHTML = posts.map((post, index) => `<button class="slide-dot" type="button" role="tab" aria-label="第 ${index + 1} 張：${escapeAttribute(post.title)}"></button>`).join("");
  const images = [...track.querySelectorAll(".slide-image")];
  const dotButtons = [...dots.querySelectorAll(".slide-dot")];
  const show = (index) => {
    active = (index + posts.length) % posts.length;
    images.forEach((image, i) => image.classList.toggle("is-active", i === active));
    dotButtons.forEach((dot, i) => { dot.classList.toggle("is-active", i === active); dot.setAttribute("aria-selected", String(i === active)); });
    const post = posts[active];
    caption.innerHTML = `<span>${escapeHtml(post.date)} · ${escapeHtml(post.location)}</span><strong>${escapeHtml(post.title)}</strong>`;
  };
  const restart = () => { window.clearInterval(timer); timer = window.setInterval(() => show(active + 1), 5000); };
  box.querySelector(".slide-prev").addEventListener("click", () => { show(active - 1); restart(); });
  box.querySelector(".slide-next").addEventListener("click", () => { show(active + 1); restart(); });
  dotButtons.forEach((dot, index) => dot.addEventListener("click", () => { show(index); restart(); }));
  box.addEventListener("mouseenter", () => window.clearInterval(timer));
  box.addEventListener("mouseleave", restart);
  box.addEventListener("click", (event) => { if (!event.target.closest("button")) document.querySelector(`#post-${posts[active].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); });
  show(0);
  restart();
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
