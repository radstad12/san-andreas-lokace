// firebase-map.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjdiDEHn6LvQvvtpZ79ueE5JbxLf1ASWU",
  authDomain: "san-andreas-map-ef3a6.firebaseapp.com",
  databaseURL: "https://san-andreas-map-ef3a6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "san-andreas-map-ef3a6",
  storageBucket: "san-andreas-map-ef3a6.appspot.com",
  messagingSenderId: "966102879269",
  appId: "1:966102879269:web:56156288290ec8b7c4c3cc",
  measurementId: "G-GRJKH0EWJQ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref;
const dbOnValue = onValue;
const dbSet = set;
const dbRemove = remove;
const dbPush = push;

// ----- MAP LOGIKA ZDE -----

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
let scale = 1, originX = 0, originY = 0, isDragging = false, start = { x: 0, y: 0 };

function loadData() {
  dbOnValue(dbRef(db, 'mapData'), (snapshot) => {
    data = snapshot.val() ? Object.values(snapshot.val()).filter(i => !i._temp) : [];
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
      if (!item.categories?.includes(cat)) return;
      if (!expandedCategories.has(cat)) return;
      const matchSearch = (item.name && item.name.toLowerCase().includes(search)) || (item.desc && item.desc.toLowerCase().includes(search));
      if (search === "" || matchSearch) {
        if (item.type === 'point') {
          renderMarker(item);
        }
        if (item.type === 'polygon') {
          renderPolygon(item);
        }
        const div = document.createElement("div");
        div.className = "item";
        div.addEventListener("click", () => {
          const targetScale = 4; // úroveň přiblížení po kliknutí
          scale = targetScale;

          if (item.type === "point" && typeof item.x === "number" && typeof item.y === "number") {
            const x = item.x * map.clientWidth;
            const y = item.y * map.clientHeight;
            const scrollX = (x - map.clientWidth / 2) * scale;
            const scrollY = (y - map.clientHeight / 2) * scale;
            originX = -scrollX / scale;
            originY = -scrollY / scale;
            map.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
          } else if (item.type === "polygon" && Array.isArray(item.points)) {
            const bounds = item.points.reduce((acc, p) => {
              const px = p.x * map.clientWidth;
              const py = p.y * map.clientHeight;
              acc.minX = Math.min(acc.minX, px);
              acc.maxX = Math.max(acc.maxX, px);
              acc.minY = Math.min(acc.minY, py);
              acc.maxY = Math.max(acc.maxY, py);
              return acc;
            }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;
            const scrollX = (centerX - map.clientWidth / 2) * scale;
            const scrollY = (centerY - map.clientHeight / 2) * scale;
            originX = -scrollX / scale;
            originY = -scrollY / scale;
            map.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
          }
        });
        div.innerHTML = `<div><span class="dot" style="background:${item.color}"></span>${item.name}</div><span class="delete-btn" onclick="window.deleteItem(${item.id}); event.stopPropagation()">🗑</span>`;
        items.appendChild(div);
      }
    });

    menu.appendChild(header);
    menu.appendChild(items);
  }
}

function renderMarker(item) {
  if (typeof item.x !== 'number' || typeof item.y !== 'number') {
    console.warn('Neplatné souřadnice bodu:', item);
    return;
  }
  const el = document.createElement("div");
  el.className = "marker";
  el.style.left = `${item.x * 100}%`;
  el.style.top = `${item.y * 100}%`;
  el.style.background = item.color;
  el.style.width = el.style.height = `${item.size || 6}px`;
  el.onmouseenter = e => {
    const name = item.name?.trim() || "(bez názvu)";
    const desc = item.desc?.trim() || "";
    const text = desc ? `${name}: ${desc}` : name;
    showTooltip(e, text);
  };
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
  poly.onmouseenter = e => {
    const name = item.name?.trim() || "(bez názvu)";
    const desc = item.desc?.trim() || "";
    const text = desc ? `${name}: ${desc}` : name;
    showTooltip(e, text);
  };
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
    <div><b>Přednastavené barvy:</b><br>
      <span class='color-sample' style='background:#ff0000' onclick="document.getElementById('form-color').value = '#ff0000'"></span>
      <span class='color-sample' style='background:#00ff00' onclick="document.getElementById('form-color').value = '#00ff00'"></span>
      <span class='color-sample' style='background:#0000ff' onclick="document.getElementById('form-color').value = '#0000ff'"></span>
      <span class='color-sample' style='background:#ffff00' onclick="document.getElementById('form-color').value = '#ffff00'"></span>
      <span class='color-sample' style='background:#ff00ff' onclick="document.getElementById('form-color').value = '#ff00ff'"></span>
      <span class='color-sample' style='background:#00ffff' onclick="document.getElementById('form-color').value = '#00ffff'"></span>
    </div><br>
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
    const item = {
      id: Date.now(),
      type,
      name: name.trim(),
      desc: desc.trim(),
      color,
      size,
      categories: selectedCats
    };
    if (type === "point") { item.x = coords.x; item.y = coords.y; }
    else { item.points = coords; }
    if (!planningMode) {
      saveItem(item);
    } else {
      item._temp = true;
      data.push(item);
      render();
    }
    wrapper.remove();
  };
}

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

map.addEventListener("wheel", e => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(0.5, scale), 8);
  map.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
}, { passive: false });

map.addEventListener("mousedown", e => {
  isDragging = true;
  start = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseup", () => isDragging = false);

window.addEventListener("mousemove", e => {
  if (!isDragging) return;
  originX += (e.clientX - start.x) / scale;
  originY += (e.clientY - start.y) / scale;
  start = { x: e.clientX, y: e.clientY };
  map.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
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
