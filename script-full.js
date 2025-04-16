
let data = JSON.parse(localStorage.getItem("mapData") || "[]");
let planningMode = false;
let currentPolygon = [];
let filter = "all";

const map = document.getElementById("map");
const menu = document.getElementById("menu");

function save() {
  if (!planningMode) {
    localStorage.setItem("mapData", JSON.stringify(data));
  }
}

function setFilter(type) {
  filter = type;
  render();
}

function togglePlanningMode() {
  planningMode = !planningMode;
  alert(`Plánovací režim: ${planningMode ? 'ZAPNUTÝ' : 'VYPNUTÝ'}`);
}

function render() {
  menu.innerHTML = "";
  map.querySelectorAll(".marker, .polygon-point, svg.polygon").forEach(el => el.remove());

  const categories = {
    "Lokace": [],
    "Území": [],
    "Dodávky": [],
    "Místa na ujíždění PD": ["autem", "na motorce", "pěšky"]
  };

  for (let cat in categories) {
    const container = document.createElement("div");
    container.className = "category";
    const h2 = document.createElement("h2");
    h2.textContent = cat;
    h2.onclick = () => {
      items.style.display = items.style.display === "block" ? "none" : "block";
    };
    const items = document.createElement("div");
    items.className = "category-items";

    const subcats = categories[cat].length ? categories[cat] : [null];
    subcats.forEach(sub => {
      data.forEach((item) => {
        if (
          (filter === "all" || filter === item.type) &&
          item.categories &&
          item.categories.includes(cat) &&
          (!sub || item.categories.includes(sub))
        ) {
          if (item.type === "point") renderMarker(item);
          if (item.type === "polygon") renderPolygon(item);

          const div = document.createElement("div");
          div.className = "item";
          div.innerHTML = \`<div><span class="dot" style="background:\${item.color}"></span>\${item.name}</div>
          <span class="delete-btn" onclick="deleteItem(\${item.id}); event.stopPropagation()">🗑</span>\`;
          div.onclick = () => centerTo(item);
          items.appendChild(div);
        }
      });
    });

    container.appendChild(h2);
    container.appendChild(items);
    menu.appendChild(container);
  }
}

function renderMarker(item) {
  const el = document.createElement("div");
  el.className = "marker";
  el.style.left = \`\${item.x * 100}%\`;
  el.style.top = \`\${item.y * 100}%\`;
  el.style.background = item.color;
  el.title = item.desc;
  map.appendChild(el);
}

function renderPolygon(item) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("polygon");
  svg.setAttribute("width", map.clientWidth);
  svg.setAttribute("height", map.clientHeight);

  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  poly.setAttribute("points", item.points.map(p => \`\${p.x * map.clientWidth},\${p.y * map.clientHeight}\`).join(" "));
  poly.setAttribute("fill", item.color + "55");
  poly.setAttribute("stroke", item.color);
  svg.appendChild(poly);
  map.appendChild(svg);
}

function centerTo(item) {
  if (item.type === "point") {
    const scrollX = item.x * map.scrollWidth - map.clientWidth / 2;
    const scrollY = item.y * map.scrollHeight - map.clientHeight / 2;
    map.scrollTo({ left: scrollX, top: scrollY, behavior: "smooth" });
  }
  if (item.type === "polygon") {
    const avgX = item.points.reduce((a, b) => a + b.x, 0) / item.points.length;
    const avgY = item.points.reduce((a, b) => a + b.y, 0) / item.points.length;
    const scrollX = avgX * map.scrollWidth - map.clientWidth / 2;
    const scrollY = avgY * map.scrollHeight - map.clientHeight / 2;
    map.scrollTo({ left: scrollX, top: scrollY, behavior: "smooth" });
  }
}

function deleteItem(id) {
  data = data.filter(i => i.id !== id);
  save();
  render();
}

function openForm(type, coords) {
  const name = prompt("Název:");
  if (!name) return;
  const desc = prompt("Popis:");
  const color = prompt("Barva (#hex nebo red...):", "#00ffff");

  const categories = ["Lokace", "Území", "Dodávky", "Místa na ujíždění PD", "autem", "na motorce", "pěšky"];
  let selectedCats = [];
  categories.forEach(cat => {
    if (confirm(\`Zařadit do "\${cat}"?\`)) {
      selectedCats.push(cat);
    }
  });

  const item = {
    id: Date.now(),
    type,
    name,
    desc,
    color,
    categories: selectedCats
  };

  if (type === "point") {
    item.x = coords.x;
    item.y = coords.y;
  } else {
    item.points = [...coords];
  }

  if (!planningMode) data.push(item);
  save();
  render();
}

map.addEventListener("dblclick", (e) => {
  if (e.shiftKey) return;
  const rect = map.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  openForm("point", { x, y });
});

map.addEventListener("click", (e) => {
  if (!e.shiftKey) return;
  const rect = map.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  currentPolygon.push({ x, y });

  const point = document.createElement("div");
  point.className = "polygon-point";
  point.style.left = \`\${x * 100}%\`;
  point.style.top = \`\${y * 100}%\`;
  map.appendChild(point);

  if (currentPolygon.length > 2 && confirm("Uzavřít území?")) {
    openForm("polygon", currentPolygon);
    currentPolygon = [];
    document.querySelectorAll(".polygon-point").forEach(el => el.remove());
  }
});

let scale = 1, originX = 0, originY = 0;
let isDragging = false, start = { x: 0, y: 0 };

map.addEventListener("wheel", (e) => {
  e.preventDefault();
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(0.5, scale), 6);
  map.style.transform = \`scale(\${scale}) translate(\${originX}px, \${originY}px)\`;
}, { passive: false });

map.addEventListener("mousedown", (e) => {
  isDragging = true;
  start.x = e.clientX;
  start.y = e.clientY;
});
window.addEventListener("mouseup", () => isDragging = false);
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  originX += (e.clientX - start.x) / scale;
  originY += (e.clientY - start.y) / scale;
  start = { x: e.clientX, y: e.clientY };
  map.style.transform = \`scale(\${scale}) translate(\${originX}px, \${originY}px)\`;
});

window.onload = () => render();
