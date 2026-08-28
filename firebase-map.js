// firebase-map.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  push
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// ============================================================
// FIREBASE
// ============================================================

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

// ============================================================
// IKONY
// ============================================================

function getCategoryIcons(categories) {
  const icons = {
    "📍 Lokace": "📍",
    "🥷 Území": "🥷",
    "🚗 Ujíždění autem": "🚗",
    "🏍️ Ujíždění na motorce": "🏍️",
    "🏃‍♂️ Útěk pěšky": "🏃‍♂️",
    "📦 Sklady": "📦",
    "🎭 Místa na výslech": "🎭"
  };

  if (!Array.isArray(categories)) {
    categories = categories ? [categories] : [];
  }

  return categories
    .map(cat => icons[cat] || "")
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// MAPA
// ============================================================

const map = document.getElementById("map");
const menu = document.getElementById("menu");
const tooltip = document.getElementById("tooltip");

const categories = [
  "🥷 Území",
  "📍 Lokace",
  "🚗 Ujíždění autem",
  "🏍️ Ujíždění na motorce",
  "🏃‍♂️ Útěk pěšky",
  "📦 Sklady",
  "🎭 Místa na výslech"
];

let data = [];
let expandedCategories = new Set(categories);

let planningMode = false;
let currentPolygon = [];

let scale = 1;
let originX = 0;
let originY = 0;

// ============================================================
// FIREBASE - NAČÍTÁNÍ
// ============================================================

function loadData() {
  const dataRef = ref(db, "mapData");

  onValue(
    dataRef,
    snapshot => {
      const value = snapshot.val();

      if (!value) {
        data = [];
      } else {
        data = Object.values(value).filter(item => !item._temp);
      }

      render();
    },
    error => {
      console.error("Firebase chyba při načítání:", error);

      alert(
        "Nepodařilo se načíst data z Firebase.\n\n" +
        error.message
      );
    }
  );
}

// ============================================================
// FIREBASE - UKLÁDÁNÍ
// ============================================================

async function saveItem(item) {
  try {
    if (!item.id) {
      item.id = Date.now();
    }

    await set(ref(db, `mapData/${item.id}`), item);

    console.log("Položka uložena:", item);

    return true;
  } catch (error) {
    console.error("Firebase chyba při ukládání:", error);

    alert(
      "Položku se nepodařilo uložit do Firebase.\n\n" +
      error.message
    );

    return false;
  }
}

// ============================================================
// FIREBASE - MAZÁNÍ
// ============================================================

async function deleteItem(id) {
  try {
    await remove(ref(db, `mapData/${id}`));

    const marker = document.getElementById(`marker-${id}`);
    if (marker) {
      marker.remove();
    }

    const label = document.getElementById(`marker-label-${id}`);
    if (label) {
      label.remove();
    }

    console.log("Položka odstraněna:", id);

  } catch (error) {
    console.error("Firebase chyba při mazání:", error);

    alert(
      "Položku se nepodařilo odstranit.\n\n" +
      error.message
    );
  }
}

// ============================================================
// VYKRESLENÍ
// ============================================================

function render() {
  menu.innerHTML = "";

  map
    .querySelectorAll(".marker, .polygon-point, svg.polygon, .marker-label")
    .forEach(el => el.remove());

  const searchInput = document.getElementById("search");
  const search = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  // Aby se body nevykreslovaly několikrát,
  // vykreslíme každou položku pouze jednou.
  const visibleItems = data.filter(item => {
    const matchSearch =
      search === "" ||
      (item.name &&
        item.name.toLowerCase().includes(search)) ||
      (item.desc &&
        item.desc.toLowerCase().includes(search));

    return matchSearch;
  });

  // ==========================================================
  // MENU
  // ==========================================================

  for (const cat of categories) {
    const categoryItems = visibleItems.filter(item =>
      item.categories?.includes(cat)
    );

    const header = document.createElement("button");

    header.className = "category-header";
    header.textContent = `${cat} (${categoryItems.length})`;

    header.onclick = () => {
      if (expandedCategories.has(cat)) {
        expandedCategories.delete(cat);
      } else {
        expandedCategories.add(cat);
      }

      render();
    };

    menu.appendChild(header);

    const items = document.createElement("div");
    items.className = "category-items";

    items.style.display =
      expandedCategories.has(cat)
        ? "block"
        : "none";

    for (const item of categoryItems) {
      const div = document.createElement("div");

      div.className = "item";
      div.dataset.id = item.id;

      div.innerHTML = `
        <div>
          <span
            class="dot"
            style="background:${item.color || "#00ffff"}"
          ></span>
          ${item.name || "(bez názvu)"}
        </div>

        <span class="delete-btn">🗑</span>
      `;

      // Kliknutí na koš
      const deleteButton =
        div.querySelector(".delete-btn");

      deleteButton.onclick = async e => {
        e.stopPropagation();

        const ok = confirm(
          `Opravdu chceš odstranit „${item.name || "tuto položku"}“?`
        );

        if (ok) {
          await deleteItem(item.id);
        }
      };

      // Najetí myší
      div.onmouseenter = () => {
        if (item.type === "polygon") {
          const poly =
            document.getElementById(
              `polygon-${item.id}`
            );

          if (poly) {
            poly.setAttribute("stroke-width", "5");
            poly.setAttribute("stroke", "#ffff00");
          }
        }

        if (item.type === "point") {
          const marker =
            document.getElementById(
              `marker-${item.id}`
            );

          if (marker) {
            marker.classList.add(
              "highlight-marker"
            );
          }
        }
      };

      div.onmouseleave = () => {
        if (item.type === "polygon") {
          const poly =
            document.getElementById(
              `polygon-${item.id}`
            );

          if (poly) {
            poly.setAttribute(
              "stroke-width",
              "2"
            );

            poly.setAttribute(
              "stroke",
              item.color || "#00ffff"
            );
          }
        }

        if (item.type === "point") {
          const marker =
            document.getElementById(
              `marker-${item.id}`
            );

          if (marker) {
            marker.classList.remove(
              "highlight-marker"
            );
          }
        }
      };

      // Pravé tlačítko = editace
      div.oncontextmenu = e => {
        e.preventDefault();

        openEditForm(item);
      };

      items.appendChild(div);
    }

    menu.appendChild(items);
  }

  // ==========================================================
  // MAPA
  // ==========================================================

  // Každou položku vykreslíme pouze jednou.
  visibleItems.forEach(item => {
    if (item.type === "point") {
      renderMarker(item);
    }

    if (item.type === "polygon") {
      renderPolygon(item);
    }
  });
}

// ============================================================
// MARKER / BOD
// ============================================================

function renderMarker(item) {
  if (
    typeof item.x !== "number" ||
    typeof item.y !== "number"
  ) {
    return;
  }

  const el = document.createElement("div");

  el.className = "marker";
  el.id = `marker-${item.id}`;

  el.style.left = `${item.x * 100}%`;
  el.style.top = `${item.y * 100}%`;

  el.style.background =
    item.color || "#00ffff";

  const size = item.size || 10;

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  // Ikona
  const icon = document.createElement("div");

  icon.className = "marker-icon";

  icon.textContent =
    getCategoryIcons(item.categories);

  icon.style.position = "absolute";
  icon.style.top = "50%";
  icon.style.left = "50%";
  icon.style.transform =
    "translate(-50%, -50%)";

  icon.style.pointerEvents = "none";
  icon.style.fontSize =
    `${Math.max(size * 0.9, 10)}px`;

  icon.style.lineHeight = "1";

  el.appendChild(icon);

  // Tooltip
  el.onmouseenter = e => {
    const name =
      item.name?.trim() || "(bez názvu)";

    const desc =
      item.desc?.trim() || "";

    const text =
      desc
        ? `${name}: ${desc}`
        : name;

    showTooltip(e, text);
  };

  el.onmouseleave = hideTooltip;

  map.appendChild(el);
}

// ============================================================
// POLYGON / ÚZEMÍ
// ============================================================

function renderPolygon(item) {
  if (
    !Array.isArray(item.points) ||
    item.points.length < 3
  ) {
    return;
  }

  const svg =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

  svg.classList.add("polygon");

  svg.id = `polygon-svg-${item.id}`;

  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";

  svg.setAttribute(
    "width",
    map.clientWidth
  );

  svg.setAttribute(
    "height",
    map.clientHeight
  );

  svg.setAttribute(
    "viewBox",
    `0 0 ${map.clientWidth} ${map.clientHeight}`
  );

  const poly =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );

  poly.id = `polygon-${item.id}`;

  const points = item.points
    .map(p => {
      return `${p.x * map.clientWidth},${p.y * map.clientHeight}`;
    })
    .join(" ");

  poly.setAttribute(
    "points",
    points
  );

  const color =
    item.color || "#00ffff";

  poly.setAttribute(
    "fill",
    color + "55"
  );

  poly.setAttribute(
    "stroke",
    color
  );

  poly.setAttribute(
    "stroke-width",
    "2"
  );

  poly.setAttribute(
    "data-id",
    item.id
  );

  poly.style.cursor = "pointer";

  poly.onmouseenter = e => {
    const name =
      item.name?.trim() ||
      "(bez názvu)";

    const desc =
      item.desc?.trim() || "";

    const text =
      desc
        ? `${name}: ${desc}`
        : name;

    showTooltip(e, text);
  };

  poly.onmouseleave =
    hideTooltip;

  svg.appendChild(poly);

  map.appendChild(svg);
}

// ============================================================
// TOOLTIP
// ============================================================

function showTooltip(e, text) {
  tooltip.style.display = "block";

  tooltip.style.left =
    `${e.clientX + 10}px`;

  tooltip.style.top =
    `${e.clientY + 10}px`;

  tooltip.textContent = text;
}

function hideTooltip() {
  tooltip.style.display = "none";
}

// ============================================================
// FORMULÁŘ - NOVÁ POLOŽKA
// ============================================================

function openForm(type, coords) {
  const wrapper =
    document.createElement("div");

  wrapper.id = "form-wrapper";

  wrapper.innerHTML = `
    <h3>
      ${type === "point"
        ? "📍 Nový bod"
        : "🥷 Nové území"}
    </h3>

    <label>
      Název:<br>
      <input
        id="form-name"
        style="width:100%;box-sizing:border-box"
      >
    </label>

    <br><br>

    <label>
      Popis:<br>
      <textarea
        id="form-desc"
        style="width:100%;box-sizing:border-box"
      ></textarea>
    </label>

    <br><br>

    <label>
      Barva:<br>
      <input
        type="color"
        id="form-color"
        value="#00ffff"
      >
    </label>

    <br><br>

    ${
      type === "point"
        ? `
          <label>
            Velikost:<br>
            <input
              type="number"
              id="form-size"
              value="10"
              min="3"
              max="40"
            >
          </label>
          <br><br>
        `
        : ""
    }

    <div>
      <b>Přednastavené barvy:</b><br>

      <span
        class="color-sample"
        style="background:#ff0000"
        data-color="#ff0000"
      ></span>

      <span
        class="color-sample"
        style="background:#00ff00"
        data-color="#00ff00"
      ></span>

      <span
        class="color-sample"
        style="background:#0000ff"
        data-color="#0000ff"
      ></span>

      <span
        class="color-sample"
        style="background:#ffff00"
        data-color="#ffff00"
      ></span>

      <span
        class="color-sample"
        style="background:#ff00ff"
        data-color="#ff00ff"
      ></span>

      <span
        class="color-sample"
        style="background:#00ffff"
        data-color="#00ffff"
      ></span>
    </div>

    <br>

    <div>
      <b>Zařadit do kategorií:</b><br>

      ${categories
        .map(
          c => `
            <label>
              <input
                type="checkbox"
                value="${c}"
              >
              ${c}
            </label>
            <br>
          `
        )
        .join("")}
    </div>

    <br>

    <button id="form-ok">
      OK
    </button>

    <button id="form-cancel">
      Zrušit
    </button>
  `;

  document.body.appendChild(wrapper);

  // Barvy
  wrapper
    .querySelectorAll(".color-sample")
    .forEach(sample => {
      sample.onclick = () => {
        document.getElementById(
          "form-color"
        ).value =
          sample.dataset.color;
      };
    });

  // Zrušit
  document.getElementById(
    "form-cancel"
  ).onclick = () => {
    wrapper.remove();
  };

  // OK
  document.getElementById(
    "form-ok"
  ).onclick = async () => {

    const name =
      document.getElementById(
        "form-name"
      ).value.trim();

    const desc =
      document.getElementById(
        "form-desc"
      ).value.trim();

    const color =
      document.getElementById(
        "form-color"
      ).value;

    const selectedCats =
      Array.from(
        wrapper.querySelectorAll(
          "input[type=checkbox]:checked"
        )
      ).map(i => i.value);

    if (!name) {
      alert(
        "Zadej název."
      );
      return;
    }

    if (selectedCats.length === 0) {
      alert(
        "Vyber alespoň jednu kategorii."
      );
      return;
    }

    const item = {
      id: Date.now(),
      type,
      name,
      desc,
      color,
      categories: selectedCats
    };

    if (type === "point") {
      const sizeInput =
        document.getElementById(
          "form-size"
        );

      item.size =
        sizeInput
          ? Number(sizeInput.value) || 10
          : 10;

      item.x = coords.x;
      item.y = coords.y;

    } else {
      item.points =
        coords.map(p => ({
          x: p.x,
          y: p.y
        }));
    }

    // ========================================================
    // PLÁNOVACÍ REŽIM
    // ========================================================

    if (planningMode) {

      item._temp = true;

      data.push(item);

      render();

      wrapper.remove();

      return;
    }

    // ========================================================
    // NORMÁLNÍ ULOŽENÍ
    // ========================================================

    const success =
      await saveItem(item);

    if (success) {

      // Lokálně ji přidáme okamžitě.
      data.push(item);

      render();

      wrapper.remove();
    }
  };
}

// ============================================================
// EDITACE
// ============================================================

function openEditForm(item) {
  const wrapper =
    document.createElement("div");

  wrapper.id = "form-wrapper";

  wrapper.innerHTML = `
    <h3>✏️ Upravit položku</h3>

    <label>
      Název:<br>
      <input
        id="form-name"
        style="width:100%;box-sizing:border-box"
      >
    </label>

    <br><br>

    <label>
      Popis:<br>
      <textarea
        id="form-desc"
        style="width:100%;box-sizing:border-box"
      ></textarea>
    </label>

    <br><br>

    <label>
      Barva:<br>
      <input
        type="color"
        id="form-color"
      >
    </label>

    <br><br>

    ${
      item.type === "point"
        ? `
          <label>
            Velikost:<br>
            <input
              type="number"
              id="form-size"
              min="3"
              max="40"
            >
          </label>

          <br><br>
        `
        : ""
    }

    <div>
      <b>Kategorie:</b><br>

      ${categories
        .map(
          c => `
            <label>
              <input
                type="checkbox"
                value="${c}"
              >
              ${c}
            </label>
            <br>
          `
        )
        .join("")}
    </div>

    <br>

    <button id="form-ok">
      Uložit
    </button>

    <button id="form-cancel">
      Zrušit
    </button>
  `;

  document.body.appendChild(wrapper);

  document.getElementById(
    "form-name"
  ).value =
    item.name || "";

  document.getElementById(
    "form-desc"
  ).value =
    item.desc || "";

  document.getElementById(
    "form-color"
  ).value =
    item.color || "#00ffff";

  if (item.type === "point") {
    document.getElementById(
      "form-size"
    ).value =
      item.size || 10;
  }

  (item.categories || [])
    .forEach(cat => {

      const checkbox =
        wrapper.querySelector(
          `input[type=checkbox][value="${cat}"]`
        );

      if (checkbox) {
        checkbox.checked = true;
      }
    });

  document.getElementById(
    "form-cancel"
  ).onclick = () => {
    wrapper.remove();
  };

  document.getElementById(
    "form-ok"
  ).onclick = async () => {

    const name =
      document.getElementById(
        "form-name"
      ).value.trim();

    const desc =
      document.getElementById(
        "form-desc"
      ).value.trim();

    const color =
      document.getElementById(
        "form-color"
      ).value;

    const selectedCats =
      Array.from(
        wrapper.querySelectorAll(
          "input[type=checkbox]:checked"
        )
      ).map(i => i.value);

    if (!name) {
      alert(
        "Zadej název."
      );
      return;
    }

    if (selectedCats.length === 0) {
      alert(
        "Vyber alespoň jednu kategorii."
      );
      return;
    }

    const updated = {
      ...item,
      name,
      desc,
      color,
      categories: selectedCats
    };

    if (item.type === "point") {
      updated.size =
        Number(
          document.getElementById(
            "form-size"
          ).value
        ) || 10;
    }

    // Pokud upravujeme dočasný plán,
    // stačí upravit lokální položku.
    if (item._temp) {

      const index =
        data.findIndex(
          i => i.id === item.id
        );

      if (index !== -1) {
        data[index] = updated;
      }

      render();

      wrapper.remove();

      return;
    }

    const success =
      await saveItem(updated);

    if (success) {

      const index =
        data.findIndex(
          i => i.id === item.id
        );

      if (index !== -1) {
        data[index] = updated;
      }

      render();

      wrapper.remove();
    }
  };
}

// ============================================================
// DVOJKLIK = NOVÝ BOD
// ============================================================

map.addEventListener(
  "dblclick",
  e => {

    if (e.shiftKey) {
      return;
    }

    const r =
      map.getBoundingClientRect();

    const x =
      (e.clientX - r.left) /
      r.width;

    const y =
      (e.clientY - r.top) /
      r.height;

    openForm(
      "point",
      {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y))
      }
    );
  }
);

// ============================================================
// SHIFT + KLIK = ÚZEMÍ
// ============================================================

map.addEventListener(
  "click",
  e => {

    if (!e.shiftKey) {
      return;
    }

    const r =
      map.getBoundingClientRect();

    const x =
      (e.clientX - r.left) /
      r.width;

    const y =
      (e.clientY - r.top) /
      r.height;

    const point = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };

    currentPolygon.push(point);

    const visualPoint =
      document.createElement("div");

    visualPoint.className =
      "polygon-point";

    visualPoint.style.left =
      `${point.x * 100}%`;

    visualPoint.style.top =
      `${point.y * 100}%`;

    map.appendChild(
      visualPoint
    );

    if (
      currentPolygon.length >= 3
    ) {

      if (
        confirm(
          "Uzavřít území?"
        )
      ) {

        openForm(
          "polygon",
          [...currentPolygon]
        );

        currentPolygon = [];

        document
          .querySelectorAll(
            ".polygon-point"
          )
          .forEach(el =>
            el.remove()
          );
      }
    }
  }
);

// ============================================================
// ZOOM
// ============================================================

map.addEventListener(
  "wheel",
  e => {

    e.preventDefault();

    const delta =
      e.deltaY * -0.001;

    const newScale =
      scale + delta;

    if (
      delta > 0 ||
      newScale >= 1
    ) {

      scale =
        Math.min(
          8,
          newScale
        );

      map.style.transform =
        `scale(${scale}) translate(${originX}px, ${originY}px)`;
    }
  },
  { passive: false }
);

// ============================================================
// W A S D POHYB
// ============================================================

const keysPressed = {};

function isFormElementFocused() {
  const el =
    document.activeElement;

  return (
    el &&
    (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      el.tagName === "BUTTON" ||
      el.isContentEditable
    )
  );
}

function updateTransform() {

  if (
    isFormElementFocused()
  ) {
    return;
  }

  const step =
    (6 * 3) / scale;

  if (
    keysPressed["w"]
  ) {
    originY += step;
  }

  if (
    keysPressed["s"]
  ) {
    originY -= step;
  }

  if (
    keysPressed["a"]
  ) {
    originX += step;
  }

  if (
    keysPressed["d"]
  ) {
    originX -= step;
  }

  map.style.transform =
    `scale(${scale}) translate(${originX}px, ${originY}px)`;
}

setInterval(
  updateTransform,
  16
);

window.addEventListener(
  "keydown",
  e => {
    keysPressed[
      e.key.toLowerCase()
    ] = true;
  }
);

window.addEventListener(
  "keyup",
  e => {
    keysPressed[
      e.key.toLowerCase()
    ] = false;
  }
);

// ============================================================
// TLAČÍTKA
// ============================================================

window.addEventListener(
  "load",
  () => {

    // ----------------------------------------
    // PLÁNOVÁNÍ
    // ----------------------------------------

    const planningButton =
      document.getElementById(
        "planning-toggle"
      );

    if (planningButton) {

      planningButton.onclick =
        () => {

          planningMode =
            !planningMode;

          if (planningMode) {

            planningButton.textContent =
              "📝 Plánování: ZAPNUTO";

            planningButton.style.background =
              "#555";

            alert(
              "Plánovací režim je zapnutý.\n\n" +
              "Nové body a území se zatím neuloží do databáze."
            );

          } else {

            planningButton.textContent =
              "📝 Plánovat";

            planningButton.style.background =
              "";

            // Vyhodíme dočasné prvky
            data =
              data.filter(
                item => !item._temp
              );

            currentPolygon = [];

            document
              .querySelectorAll(
                ".polygon-point"
              )
              .forEach(el =>
                el.remove()
              );

            render();
          }
        };
    }

    // ----------------------------------------
    // ULOŽIT PLÁN
    // ----------------------------------------

    let savePlanButton =
      document.getElementById(
        "save-plan"
      );

    if (!savePlanButton) {

      savePlanButton =
        document.createElement(
          "button"
        );

      savePlanButton.id =
        "save-plan";

      savePlanButton.textContent =
        "💾 Uložit plán";

      savePlanButton.style.display =
        "none";

      savePlanButton.style.width =
        "100%";

      savePlanButton.style.marginBottom =
        "5px";

      const controls =
        document.getElementById(
          "controls"
        );

      if (controls) {
        controls.appendChild(
          savePlanButton
        );
      }
    }

    savePlanButton.onclick =
      async () => {

        const temporary =
          data.filter(
            item => item._temp
          );

        if (
          temporary.length === 0
        ) {

          alert(
            "V plánu není nic k uložení."
          );

          return;
        }

        let successCount = 0;

        for (
          const item of temporary
        ) {

          const cleanItem = {
            ...item
          };

          delete cleanItem._temp;

          const success =
            await saveItem(
              cleanItem
            );

          if (success) {
            successCount++;
          }
        }

        if (
          successCount ===
          temporary.length
        ) {

          data =
            data.filter(
              item => !item._temp
            );

          alert(
            `Plán uložen. Počet položek: ${successCount}`
          );

          planningMode = false;

          if (planningButton) {
            planningButton.textContent =
              "📝 Plánovat";

            planningButton.style.background =
              "";
          }

          savePlanButton.style.display =
            "none";

          render();

        } else {

          alert(
            `Uloženo ${successCount} z ${temporary.length} položek.`
          );
        }
      };

    // ----------------------------------------
    // ZRUŠIT PLÁN
    // ----------------------------------------

    let cancelPlanButton =
      document.getElementById(
        "cancel-plan"
      );

    if (!cancelPlanButton) {

      cancelPlanButton =
        document.createElement(
          "button"
        );

      cancelPlanButton.id =
        "cancel-plan";

      cancelPlanButton.textContent =
        "❌ Zrušit plán";

      cancelPlanButton.style.display =
        "none";

      cancelPlanButton.style.width =
        "100%";

      cancelPlanButton.style.marginBottom =
        "5px";

      const controls =
        document.getElementById(
          "controls"
        );

      if (controls) {
        controls.appendChild(
          cancelPlanButton
        );
      }
    }

    cancelPlanButton.onclick =
      () => {

        data =
          data.filter(
            item => !item._temp
          );

        planningMode =
          false;

        currentPolygon = [];

        if (planningButton) {
          planningButton.textContent =
            "📝 Plánovat";

          planningButton.style.background =
            "";
        }

        savePlanButton.style.display =
          "none";

        cancelPlanButton.style.display =
          "none";

        document
          .querySelectorAll(
            ".polygon-point"
          )
          .forEach(el =>
            el.remove()
          );

        render();
      };

    // ----------------------------------------
    // SHOW ALL
    // ----------------------------------------

    const showAll =
      document.getElementById(
        "show-all"
      );

    if (showAll) {

      showAll.onclick =
        () => {

          if (
            expandedCategories.size ===
            categories.length
          ) {

            expandedCategories.clear();

          } else {

            expandedCategories =
              new Set(categories);
          }

          render();
        };
    }

    // ----------------------------------------
    // SEARCH
    // ----------------------------------------

    const search =
      document.getElementById(
        "search"
      );

    if (search) {

      search.oninput =
        () => render();
    }

    // ----------------------------------------
    // PLÁNOVACÍ REŽIM -
    // ZOBRAZENÍ TLAČÍTEK
    // ----------------------------------------

    if (planningButton) {

      const oldClick =
        planningButton.onclick;

      planningButton.onclick =
        () => {

          planningMode =
            !planningMode;

          if (planningMode) {

            planningButton.textContent =
              "📝 Plánování: ZAPNUTO";

            planningButton.style.background =
              "#555";

            savePlanButton.style.display =
              "block";

            cancelPlanButton.style.display =
              "block";

          } else {

            planningButton.textContent =
              "📝 Plánovat";

            planningButton.style.background =
              "";

            savePlanButton.style.display =
              "none";

            cancelPlanButton.style.display =
              "none";

            data =
              data.filter(
                item => !item._temp
              );

            render();
          }
        };
    }

    // ----------------------------------------
    // START
    // ----------------------------------------

    loadData();
  }
);

// ============================================================
// DRAG & DROP BODŮ
// ============================================================

map.addEventListener(
  "mousedown",
  e => {

    if (
      !e.target.classList.contains(
        "marker"
      )
    ) {
      return;
    }

    const marker =
      e.target;

    const id =
      marker.id.replace(
        "marker-",
        ""
      );

    const r =
      map.getBoundingClientRect();

    const move = e2 => {

      const x =
        (e2.clientX - r.left) /
        r.width;

      const y =
        (e2.clientY - r.top) /
        r.height;

      const safeX =
        Math.max(
          0,
          Math.min(1, x)
        );

      const safeY =
        Math.max(
          0,
          Math.min(1, y)
        );

      marker.style.left =
        `${safeX * 100}%`;

      marker.style.top =
        `${safeY * 100}%`;

      const index =
        data.findIndex(
          i => String(i.id) ===
            String(id)
        );

      if (index !== -1) {

        data[index].x =
          safeX;

        data[index].y =
          safeY;
      }
    };

    const up =
      async () => {

        window.removeEventListener(
          "mousemove",
          move
        );

        window.removeEventListener(
          "mouseup",
          up
        );

        const index =
          data.findIndex(
            i => String(i.id) ===
              String(id)
          );

        if (
          index === -1
        ) {
          return;
        }

        const item =
          data[index];

        // Pokud je to plánovací položka,
        // ještě ji neukládáme.
        if (item._temp) {
          return;
        }

        await saveItem(item);
      };

    window.addEventListener(
      "mousemove",
      move
    );

    window.addEventListener(
      "mouseup",
      up
    );
  }
);
