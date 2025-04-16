// firebase-map.js
import { getDatabase, ref, onValue, set, remove, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const db = window.firebaseDB;
const dbRef = window.firebaseRef;
const dbOnValue = window.firebaseOnValue;
const dbSet = window.firebaseSet;
const dbRemove = window.firebaseRemove;
const dbPush = window.firebasePush;

const map = document.getElementById("map");
const menu = document.getElementById("menu");
const tooltip = document.getElementById("tooltip");
const categories = [
  "📍 Lokace", "🗺️ Území", "🔫 Předání zbraní",
  "🚗 Ujíždění autem", "🏍️ Ujíždění na motorce",
  "🏃‍♂️ Útěk pěšky", "📦 Sklady", "🎭 Místa na výslech"
];

let data = [];
let expandedCategories = new Set(categories);
let planningMode = false;
let currentPolygon = [];

function loadData() {
  dbOnValue(dbRef(db, 'mapData'), (snapshot) => {
    data = snapshot.val() ? Object.values(snapshot.val()) : [];
    render();
  });
}

function saveItem(item) {
  const id = item.id || Date.now();
  item.id = id;
  dbSet(dbRef(db, `mapData/${id}`), item);
}

function deleteItem(id) {
  dbRemove(dbRef(db, `mapData/${id}`));
}

function render() {
  menu.innerHTML = "";
  map.querySelectorAll(".marker, .polygon-point, svg.polygon").forEach(el => el.remove());
  const search = document.getElementById("search").value.toLowerCase();
  for (let cat of categories) {
    const header = document.createElement("button");
    header.className = "category-header";
    header.textContent = `${cat} (${data.filter(i => i.categories?.includes(cat)).length})`;
    header.onclick = () => {
      if (expandedCategories.has(cat)) expandedCategories.delete(cat);
      else expandedCategories.add(cat);
      render();
    };

    const items = document.createElement("div");
    items.className = "category-items";
    items.style.display = expandedCategories.has(cat) ? "block" : "none";

    data.forEach(item => {
      if (!item.categories.includes(cat)) return;
      if (!expandedCategories.has(cat)) return;
      if (item.name?.toLowerCase().includes(search)) {
        if (item.type === 'point') renderMarker(item);
        if (item.type === 'polygon') renderPolygon(item);
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `<div><span class="dot" style="background:${item.color}"></span>${item.name}</div><span class="delete-btn" onclick="window.deleteItem(${item.id}); event.stopPropagation()">🗑</span>`;
        items.appendChild(div);
      }
    });

    menu.appendChild(header);
    menu.appendChild(items);
  }
}

function renderMarker(item) {
  const el = document.createElement("div");
  el.className = "marker";
  el.style.left = `${item.x * 100}%`;
  el.style.top = `${item.y * 100}%`;
  el.style.background = item.color;
  el.style.width = el.style.height = `${item.size || 6}px`;
  el.onmouseenter = e => showTooltip(e, `${item.name}: ${item.desc}`);
  el.onmouseleave = hideTooltip;
  map.appendChild(el);
}

function renderPolygon(item) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("polygon");
  svg.setAttribute("width", map.clientWidth);
  svg.setAttribute("height", map.clientHeight);
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  poly.setAttribute("points", item.points.map(p => `${p.x * map.clientWidth},${p.y * map.clientHeight}`).join(" "));
  poly.setAttribute("fill", item.color + "55");
  poly.setAttribute("stroke", item.color);
  poly.onmouseenter = e => showTooltip(e, `${item.name}: ${item.desc}`);
  poly.onmouseleave = hideTooltip;
  svg.appendChild(poly);
  map.appendChild(svg);
}

function showTooltip(e, text) {
  tooltip.style.display = "block";
  tooltip.style.left = e.clientX + 10 + "px";
  tooltip.style.top = e.clientY + 10 + "px";
  tooltip.textContent = text;
}

function hideTooltip() {
  tooltip.style.display = "none";
}

function openForm(type, coords) {
  const wrapper = document.createElement("div");
  wrapper.id = "form-wrapper";
  wrapper.innerHTML = `
    <label>Název:<br><input id='form-name' style='width:100%'></label><br><br>
    <label>Popis:<br><textarea id='form-desc' style='width:100%'></textarea></label><br><br>
    <label>Barva:<br><input type='color' id='form-color' value='#00ffff'></label><br><br>
    <label>Velikost:<br><input type='number' id='form-size' value='6' min='2' max='20'></label><br><br>
    <div><b>Zařadit do kategorií:</b><br>` +
    categories.map(c => `<label><input type='checkbox' value='${c}'> ${c}</label>`).join("<br>") +
    `</div><br>
    <button id='form-ok'>OK</button> <button onclick='document.getElementById("form-wrapper").remove()'>Zrušit</button>`;

  document.body.appendChild(wrapper);

  document.getElementById("form-ok").onclick = () => {
    const name = document.getElementById("form-name").value;
    const desc = document.getElementById("form-desc").value;
    const color = document.getElementById("form-color").value;
    const size = +document.getElementById("form-size").value;
    const selectedCats = Array.from(wrapper.querySelectorAll("input[type=checkbox]:checked")).map(i => i.value);
    if (!name || selectedCats.length === 0) return alert("Zadej název a vyber kategorii.");
    const item = { id: Date.now(), type, name, desc, color, size, categories: selectedCats };
    if (type === "point") { item.x = coords.x; item.y = coords.y; }
    else { item.points = coords; }
    if (!planningMode) saveItem(item);
    wrapper.remove();
  };
}

// Eventy mapy
map.addEventListener("dblclick", e => {
  if (e.shiftKey) return;
  const r = map.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  openForm("point", { x, y });
});

map.addEventListener("click", e => {
  if (!e.shiftKey) return;
  const r = map.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  currentPolygon.push({ x, y });
  const point = document.createElement("div");
  point.className = "polygon-point";
  point.style.left = `${x * 100}%`;
  point.style.top = `${y * 100}%`;
  map.appendChild(point);
  if (currentPolygon.length > 2 && confirm("Uzavřít území?")) {
    openForm("polygon", currentPolygon);
    currentPolygon = [];
    document.querySelectorAll(".polygon-point").forEach(el => el.remove());
  }
});

window.onload = () => {
  document.getElementById("planning-toggle").onclick = () => {
    planningMode = !planningMode;
    alert(`Plánovací režim: ${planningMode ? 'ZAPNUTÝ' : 'VYPNUTÝ'}`);
  };
  document.getElementById("show-all").onclick = () => {
    if (expandedCategories.size === categories.length) expandedCategories.clear();
    else expandedCategories = new Set(categories);
    render();
  };
  document.getElementById("search").oninput = () => render();

  window.deleteItem = deleteItem;

  loadData();
};
