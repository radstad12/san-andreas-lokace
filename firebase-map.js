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


function getCategoryIcons(categories) {
  const icons = {
    "📍 Lokace": "📍",
    "🥷 Území": "🥷",
    "🔫 Předání zbraní": "🔫",
    "🚗 Ujíždění autem": "🚗",
    "🏍️ Ujíždění na motorce": "🏍️",
    "🏃‍♂️ Útěk pěšky": "🏃‍♂️",
    "📦 Sklady": "📦",
    "🎭 Místa na výslech": "🎭"
  };
  if (!Array.isArray(categories)) categories = [categories];
  return categories.map(cat => icons[cat] || "").join(" ");
}


// ----- MAP LOGIKA ZDE -----

const map = document.getElementById("map");
const menu = document.getElementById("menu");
const tooltip = document.getElementById("tooltip");
const categories = [
  "📍 Lokace", "🥷 Území", "🔫 Předání zbraní",
  "🚗 Ujíždění autem", "🏍️ Ujíždění na motorce",
  "🏃‍♂️ Útěk pěšky", "📦 Sklady", "🎭 Místa na výslech"
];

let data = [];
let expandedCategories = new Set(categories);
let planningMode = false;
let currentPolygon = [];
let scale = 1, originX = 0, originY = 0;

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
  const marker = document.getElementById(`marker-${id}`);
  if (marker) marker.remove();
  const label = document.getElementById(`marker-label-${id}`);
  if (label) label.remove();
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
        div.dataset.id = item.id;
        div.onmouseenter = () => {
          if (item.type === 'polygon') {
            const polys = document.querySelectorAll("svg.polygon polygon");
            polys.forEach(poly => {
              if (poly.getAttribute("data-id") === String(item.id)) {
                poly.setAttribute("stroke-width", "4");
                poly.setAttribute("stroke", "#ffff00");
              }
            });
          }

          const marker = document.getElementById(`marker-${item.id}`);
          if (marker) {
            marker.classList.add("highlight-marker");
            // Přidat textový štítek vedle markeru
            const existingLabel = document.getElementById("marker-label-" + item.id);
            if (!existingLabel) {
              const label = document.createElement("div");
              label.className = "marker-label";
              label.id = "marker-label-" + item.id;
              label.innerText = item.name + (item.desc ? ": " + item.desc : "");
              label.style.position = "absolute";
              label.style.left = (marker.offsetLeft + 25) + "px";
              label.style.top = (marker.offsetTop - 10) + "px";
              label.style.background = "rgba(0,0,0,0.75)";
              label.style.color = "#fff";
              label.style.padding = "6px 10px";
              label.style.borderRadius = "6px";
              label.style.fontSize = "16px";
              label.style.zIndex = "1001";
              map.appendChild(label);
            }
          }
        };
        div.onmouseleave = () => {
          if (item.type === 'polygon') {
            const polys = document.querySelectorAll("svg.polygon polygon");
            polys.forEach(poly => {
              if (poly.getAttribute("data-id") === String(item.id)) {
                poly.setAttribute("stroke-width", "2");
                poly.setAttribute("stroke", item.color);
  poly.setAttribute("data-id", item.id);
              }
            });
          }

          const marker = document.getElementById(`marker-${item.id}`);
          if (marker) {
            marker.classList.remove("highlight-marker");
            const label = document.getElementById("marker-label-" + item.id);
            if (label) label.remove();
          }
        };
        div.innerHTML = `<div><span class="dot" style="background:${item.color}"></span>${item.name}</div><span class="delete-btn" onclick="window.deleteItem(${item.id}); event.stopPropagation()">🗑</span>`;
        items.appendChild(div);
      }
    });

    menu.appendChild(header);
    menu.appendChild(items);
  }
}





function renderMarker(item) {
  if (typeof item.x !== 'number' || typeof item.y !== 'number') return;
  const el = document.createElement("div");
  el.className = "marker";
  el.id = `marker-${item.id}`;
  el.style.left = `${item.x * 100}%`;
  el.style.top = `${item.y * 100}%`;
  el.style.background = item.color;
  const size = item.size || 6;
  el.style.width = el.style.height = size + "px";

  // Přidání dokonale vystředěné ikony
  const icon = document.createElement("div");
  icon.className = "marker-icon";
  icon.textContent = getCategoryIcons(item.categories || item.category);
  icon.style.position = "absolute";
  icon.style.top = "50%";
  icon.style.left = "50%";
  icon.style.transform = "translate(-50%, -50%)";
  icon.style.pointerEvents = "none";
  icon.style.fontSize = `${size * 0.65}px`;
  icon.style.lineHeight = "1";
  icon.style.width = icon.style.height = `${size * 0.65}px`;
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  el.appendChild(icon);

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
  poly.setAttribute("data-id", item.id);
  poly.onmouseenter = e => {
    const name = item.name?.trim() || "(bez názvu)";
    const desc = item.desc?.trim() || "";
    const text = desc ? `${name}: ${desc}` : name;
    showTooltip(e, text);
  };
  poly.onmouseleave = hideTooltip;
  svg.appendChild(poly);
  // ikona do středu polygonu
  if (item.points?.length) {
    const bbox = poly.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const icon = document.createElement("div");
    icon.className = "polygon-icon";
    icon.textContent = getCategoryIcons(item.categories || item.category);
    icon.style.position = "absolute";
    icon.style.left = centerX + "px";
    icon.style.top = centerY + "px";
    icon.style.transform = "translate(-50%, -50%)";
    icon.style.pointerEvents = "none";
    icon.style.fontSize = "14px";
    icon.style.lineHeight = "1";
    icon.style.zIndex = "1000";
    icon.style.textAlign = "center";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.id = "polygon-icon-" + item.id;
    map.appendChild(icon);
  }

  map.appendChild(svg);
  // ikona do středu polygonu
  if (item.points?.length) {
    const bbox = poly.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const icon = document.createElement("div");
    icon.className = "polygon-icon";
    icon.textContent = getCategoryIcons(item.categories || item.category);
    icon.style.position = "absolute";
    icon.style.left = centerX + "px";
    icon.style.top = centerY + "px";
    icon.style.transform = "translate(-50%, -50%)";
    icon.style.pointerEvents = "none";
    icon.style.fontSize = "18px";
    icon.style.zIndex = "999";
    icon.id = "polygon-icon-" + item.id;
    map.appendChild(icon);
  }

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


// Wheel zoom s limitem pouze pro přiblížení (ne oddálení pod scale 1)
map.addEventListener("wheel", e => {
  e.preventDefault();
  const delta = e.deltaY * -0.001;
  const newScale = scale + delta;
  if (delta > 0 || newScale >= 1) {
    scale = Math.min(8, newScale);
    map.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
  }
}, { passive: false });








const keysPressed = {};
function isFormElementFocused() {
  const el = document.activeElement;
  return el && (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.tagName === 'BUTTON' ||
    el.isContentEditable
  );
}

function updateTransform() {
  if (isFormElementFocused()) return;
  const step = 2*3 / scale;
  if (keysPressed['w']) originY += step;
  if (keysPressed['s']) originY -= step;
  if (keysPressed['a']) originX += step;
  if (keysPressed['d']) originX -= step;
  map.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
}
setInterval(updateTransform, 16);
window.addEventListener("keydown", e => { keysPressed[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", e => { keysPressed[e.key.toLowerCase()] = false; });



window.onload = () => {
const style = document.createElement("style");
style.innerHTML = `
.marker-label { pointer-events: none; }
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
.highlight-marker {
  transform: scale(5) !important;
  animation: pulse 1s infinite;
  z-index: 1000;
}
  /* 1. Vyrovnaná šířka input a tlačítka */
  #search, #show-all {
    width: calc(100% - 20px);
    box-sizing: border-box;
  }

  /* 2. Hover efekt pro kategorie i zobrazit vše */
  button.category-header,
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 8px;
  margin-top: 4px;
  cursor: pointer;
  width: 100%;
  text-align: center;
  transition: background 0.2s, transform 0.2s;
    transition: background 0.2s, transform 0.2s;
  }
  button.category-header:hover,
  #show-all:hover {
    background: #333;
  transform: scale(1.02);
  }

  /* 3. Hover zvětšení itemů v menu */
  .category-items .item {
    transition: transform 0.2s ease;
  }
  .category-items .item:hover {
    transform: scale(1.03);
  }
`;

style.innerHTML += `
.category-box:hover {
  background-color: rgba(255, 255, 255, 0.08);
  transition: background-color 0.2s ease;
}
`;

style.innerHTML += `
.category-box {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px;
  transition: background-color 0.2s ease;
}
.category-box:hover {
  background-color: rgba(255, 255, 255, 0.12);
}
`;
style.innerHTML += `
.polygon-icon {
  font-size: 18px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  position: absolute;
}
`;
  style.innerHTML += `
.marker-icon {
  font-size: 6px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  position: absolute;
}
`;
  style.innerHTML += `
.marker-icon {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  line-height: 1;
}
`;
  style.innerHTML += `
.polygon-icon {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  line-height: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;
  document.head.appendChild(style);



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
  
window.deleteItem = id => {
  const item = data.find(i => i.id === id);
  if (!item) return;
  const confirmText = `Opravdu chceš odstranit “${item.name || 'tuto položku'}”?`;
  if (confirm(confirmText)) deleteItem(id);
};


// ======= MiniMapa =======
const minimap = document.createElement("div");
minimap.id = "minimap";
minimap.style.position = "absolute";
minimap.style.top = "10px";
minimap.style.right = "10px";
minimap.style.width = "160px";
minimap.style.height = "100px";
minimap.style.border = "2px solid white";
minimap.style.background = "#000";
minimap.style.zIndex = "9999";
minimap.style.opacity = "0.6";
minimap.style.pointerEvents = "none";
document.body.appendChild(minimap);

// ======= Drag & Drop pro body =======
map.addEventListener("mousedown", e => {
  if (!e.target.classList.contains("marker")) return;
  const marker = e.target;
  const id = marker.id.split("marker-")[1];
  const r = map.getBoundingClientRect();

  const move = e2 => {
    const x = (e2.clientX - r.left) / r.width;
    const y = (e2.clientY - r.top) / r.height;
    marker.style.left = x * 100 + "%";
    marker.style.top = y * 100 + "%";

    const index = data.findIndex(i => i.id == id);
    if (index !== -1) {
      data[index].x = x;
      data[index].y = y;
      saveItem(data[index]);
    }
  };

  const up = () => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
});

  loadData();
};
