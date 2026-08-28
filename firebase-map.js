```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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
let dragState = null;

// ============================================================
// LOKÁLNÍ ZÁLOHA
// ============================================================

const LOCAL_KEY = "verdugos-map-cache-v2";

function loadLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCache() {
  try {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify(data.filter(i => !i._temp))
    );
  } catch (e) {
    console.warn("Local cache nejde uložit:", e);
  }
}

// ============================================================
// IKONY
// ============================================================

function iconForCategories(cats) {
  const icons = {
    "📍 Lokace": "📍",
    "🥷 Území": "🥷",
    "🚗 Ujíždění autem": "🚗",
    "🏍️ Ujíždění na motorce": "🏍️",
    "🏃‍♂️ Útěk pěšky": "🏃‍♂️",
    "📦 Sklady": "📦",
    "🎭 Místa na výslech": "🎭"
  };

  return (Array.isArray(cats) ? cats : [])
    .map(c => icons[c] || "")
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// MAPA
// ============================================================

function setMapTransform() {
  map.style.transform =
    `translate(${originX}px, ${originY}px) scale(${scale})`;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function itemMatchesSearch(item, search) {
  if (!search) return true;

  return (
    (item.name || "").toLowerCase().includes(search) ||
    (item.desc || "").toLowerCase().includes(search)
  );
}

// ============================================================
// NORMALIZACE DAT
// ============================================================

function normalizeLoadedItem(item, key) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const normalized = { ...item };

  if (normalized.id == null) {
    normalized.id = key;
  }

  normalized.id = String(normalized.id);

  if (!Array.isArray(normalized.categories)) {
    normalized.categories =
      normalized.categories
        ? [normalized.categories]
        : [];
  }

  return normalized;
}

// ============================================================
// FIREBASE - NAČÍTÁNÍ
// ============================================================

function loadData() {
  const dbRef = ref(db, "mapData");

  onValue(
    dbRef,
    snapshot => {
      const raw = snapshot.val();

      let remoteItems = raw
        ? Object.entries(raw)
            .map(([key, value]) =>
              normalizeLoadedItem(value, key)
            )
            .filter(Boolean)
        : [];

      // Pokud Firebase nic nevrátil,
      // použijeme lokální zálohu.
      if (remoteItems.length === 0) {
        const local = loadLocalCache();

        if (local.length > 0) {
          remoteItems = local;
        }
      }

      const temporary =
        data.filter(i => i._temp);

      data = [
        ...remoteItems.filter(i => !i._temp),
        ...temporary
      ];

      render();
    },
    error => {
      console.error(
        "Firebase load error:",
        error
      );

      const local =
        loadLocalCache();

      data = [
        ...local,
        ...data.filter(i => i._temp)
      ];

      render();

      showStatus(
        "⚠️ Firebase se nepodařilo načíst. Používám lokální data.",
        true
      );
    }
  );
}

// ============================================================
// FIREBASE - ULOŽENÍ
// ============================================================

async function saveItem(item) {
  const clean = {
    ...item
  };

  delete clean._temp;

  if (!clean.id) {
    clean.id =
      String(Date.now());
  }

  clean.id =
    String(clean.id);

  // Nejdřív zobrazíme položku lokálně.
  const index =
    data.findIndex(
      i => String(i.id) === clean.id
    );

  if (index >= 0) {
    data[index] = clean;
  } else {
    data.push(clean);
  }

  saveLocalCache();
  render();

  try {
    await set(
      ref(
        db,
        `mapData/${clean.id}`
      ),
      clean
    );

    showStatus(
      "✅ Položka byla uložena.",
      false
    );

    return true;

  } catch (error) {

    console.error(
      "Firebase save error:",
      error
    );

    showStatus(
      "⚠️ Položka je uložená lokálně, ale Firebase zápis byl odmítnut: " +
      error.message,
      true
    );

    return false;
  }
}

// ============================================================
// FIREBASE - SMAZÁNÍ
// ============================================================

async function deleteItem(id) {
  const sid =
    String(id);

  data =
    data.filter(
      i => String(i.id) !== sid
    );

  saveLocalCache();
  render();

  try {

    await remove(
      ref(
        db,
        `mapData/${sid}`
      )
    );

    showStatus(
      "✅ Položka odstraněna."
    );

  } catch (error) {

    console.error(
      "Firebase delete error:",
      error
    );

    showStatus(
      "⚠️ Položka byla odstraněna zde, ale Firebase odmítl smazání.",
      true
    );
  }
}

// ============================================================
// STATUS
// ============================================================

function showStatus(
  message,
  isError = false
) {
  let box =
    document.getElementById(
      "app-status"
    );

  if (!box) {
    box =
      document.createElement(
        "div"
      );

    box.id =
      "app-status";

    box.style.cssText =
      `
      position:fixed;
      left:300px;
      bottom:15px;
      z-index:5000;
      padding:10px 14px;
      border-radius:8px;
      background:#222;
      color:#fff;
      max-width:520px;
      font-size:14px;
      box-shadow:0 4px 18px rgba(0,0,0,.4);
      `;

    document.body.appendChild(
      box
    );
  }

  box.textContent =
    message;

  box.style.border =
    isError
      ? "1px solid #b33"
      : "1px solid #3b3";

  clearTimeout(
    showStatus.timer
  );

  showStatus.timer =
    setTimeout(
      () => {
        if (box) {
          box.remove();
        }
      },
      7000
    );
}

// ============================================================
// VYKRESLENÍ
// ============================================================

function render() {
  menu.innerHTML = "";

  map
    .querySelectorAll(
      ".map-overlay-item, .polygon-drawing-point"
    )
    .forEach(
      e => e.remove()
    );

  const search =
    (
      document.getElementById(
        "search"
      )?.value || ""
    )
      .trim()
      .toLowerCase();

  const visible =
    data.filter(
      item =>
        itemMatchesSearch(
          item,
          search
        )
    );

  // Každý bod / území vykreslit pouze jednou.
  for (const item of visible) {

    if (
      item.type === "point"
    ) {
      renderMarker(item);
    }

    if (
      item.type === "polygon"
    ) {
      renderPolygon(item);
    }
  }

  // ==========================================================
  // KATEGORIE
  // ==========================================================

  for (
    const cat of categories
  ) {

    const categoryItems =
      visible.filter(
        item =>
          item.categories?.includes(
            cat
          )
      );

    const header =
      document.createElement(
        "button"
      );

    header.type =
      "button";

    header.className =
      "category-header";

    header.textContent =
      `${cat} (${categoryItems.length})`;

    header.onclick = () => {

      if (
        expandedCategories.has(
          cat
        )
      ) {

        expandedCategories.delete(
          cat
        );

      } else {

        expandedCategories.add(
          cat
        );
      }

      render();
    };

    menu.appendChild(
      header
    );

    const itemsBox =
      document.createElement(
        "div"
      );

    itemsBox.className =
      "category-items";

    itemsBox.style.display =
      expandedCategories.has(cat)
        ? "block"
        : "none";

    for (
      const item of categoryItems
    ) {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "item";

      row.dataset.id =
        String(item.id);

      row.innerHTML =
        `
        <div>
          <span
            class="dot"
            style="background:${item.color || "#00ffff"}"
          ></span>

          ${escapeHtml(
            item.name ||
            "(bez názvu)"
          )}

          ${
            item._temp
              ? " <small>(plán)</small>"
              : ""
          }
        </div>

        <span
          class="delete-btn"
          title="Smazat"
        >
          🗑
        </span>
        `;

      const deleteButton =
        row.querySelector(
          ".delete-btn"
        );

      deleteButton.onclick =
        async e => {

          e.stopPropagation();

          if (
            confirm(
              `Opravdu chceš odstranit „${item.name || "tuto položku"}“?`
            )
          ) {
            await deleteItem(
              item.id
            );
          }
        };

      row.onmouseenter =
        () =>
          highlightItem(
            item
          );

      row.onmouseleave =
        () =>
          unhighlightItem(
            item
          );

      row.onclick =
        () =>
          focusItem(
            item
          );

      row.oncontextmenu =
        e => {

          e.preventDefault();

          openEditForm(
            item
          );
        };

      itemsBox.appendChild(
        row
      );
    }

    menu.appendChild(
      itemsBox
    );
  }
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    s =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[s])
  );
}

// ============================================================
// BOD
// ============================================================

function renderMarker(item) {

  if (
    !Number.isFinite(item.x) ||
    !Number.isFinite(item.y)
  ) {
    return;
  }

  const el =
    document.createElement(
      "div"
    );

  el.className =
    "marker map-overlay-item";

  el.id =
    `marker-${item.id}`;

  el.style.left =
    `${item.x * 100}%`;

  el.style.top =
    `${item.y * 100}%`;

  const size =
    Number(item.size) || 12;

  el.style.width =
    `${size}px`;

  el.style.height =
    `${size}px`;

  el.style.background =
    item.color ||
    "#00ffff";

  const icon =
    document.createElement(
      "span"
    );

  icon.className =
    "marker-icon";

  icon.textContent =
    iconForCategories(
      item.categories
    );

  icon.style.fontSize =
    `${Math.max(
      12,
      size * 0.9
    )}px`;

  el.appendChild(
    icon
  );

  el.title =
    item.name || "";

  el.onmouseenter =
    e =>
      showTooltip(
        e,
        item.desc
          ? `${item.name}: ${item.desc}`
          : item.name
      );

  el.onmouseleave =
    hideTooltip;

  el.oncontextmenu =
    e => {

      e.preventDefault();
      e.stopPropagation();

      openEditForm(
        item
      );
    };

  el.ondblclick =
    e =>
      e.stopPropagation();

  map.appendChild(
    el
  );
}

// ============================================================
// ÚZEMÍ
// ============================================================

function renderPolygon(item) {

  if (
    !Array.isArray(
      item.points
    ) ||
    item.points.length < 3
  ) {
    return;
  }

  const overlay =
    document.createElement(
      "div"
    );

  overlay.className =
    "polygon-overlay map-overlay-item";

  overlay.dataset.id =
    String(item.id);

  // Důležité:
  // clip-path se vztahuje na samotný overlay.
  // Už se tedy nezbarví celá mapa.
  const polygonCss =
    item.points
      .map(
        p =>
          `${p.x * 100}% ${p.y * 100}%`
      )
      .join(", ");

  overlay.style.clipPath =
    `polygon(${polygonCss})`;

  overlay.style.background =
    item.color ||
    "#00ffff";

  overlay.style.opacity =
    "0.32";

  overlay.title =
    item.name || "";

  overlay.onmouseenter =
    e => {

      overlay.style.opacity =
        "0.5";

      showTooltip(
        e,
        item.desc
          ? `${item.name}: ${item.desc}`
          : item.name
      );
    };

  overlay.onmouseleave =
    () => {

      overlay.style.opacity =
        "0.32";

      hideTooltip();
    };

  overlay.oncontextmenu =
    e => {

      e.preventDefault();
      e.stopPropagation();

      openEditForm(
        item
      );
    };

  map.appendChild(
    overlay
  );
}

// ============================================================
// HIGHLIGHT
// ============================================================

function highlightItem(item) {

  if (
    item.type === "point"
  ) {

    const el =
      document.getElementById(
        `marker-${item.id}`
      );

    if (el) {
      el.classList.add(
        "highlight-map-item"
      );
    }

  } else {

    const el =
      document.querySelector(
        `.polygon-overlay[data-id="${CSS.escape(String(item.id))}"]`
      );

    if (el) {
      el.classList.add(
        "highlight-map-item"
      );
    }
  }
}

function unhighlightItem(item) {

  if (
    item.type === "point"
  ) {

    const el =
      document.getElementById(
        `marker-${item.id}`
      );

    if (el) {
      el.classList.remove(
        "highlight-map-item"
      );
    }

  } else {

    const el =
      document.querySelector(
        `.polygon-overlay[data-id="${CSS.escape(String(item.id))}"]`
      );

    if (el) {
      el.classList.remove(
        "highlight-map-item"
      );
    }
  }
}

function focusItem(item) {

  if (
    item.type !== "point"
  ) {
    return;
  }

  const el =
    document.getElementById(
      `marker-${item.id}`
    );

  if (!el) return;

  el.classList.add(
    "highlight-map-item"
  );

  setTimeout(
    () =>
      el.classList.remove(
        "highlight-map-item"
      ),
    1200
  );
}

// ============================================================
// TOOLTIP
// ============================================================

function showTooltip(
  e,
  text
) {

  tooltip.style.display =
    "block";

  tooltip.style.left =
    `${e.clientX + 10}px`;

  tooltip.style.top =
    `${e.clientY + 10}px`;

  tooltip.textContent =
    text || "";
}

function hideTooltip() {
  tooltip.style.display =
    "none";
}

// ============================================================
// FORMULÁŘ
// ============================================================

function buildForm(
  title,
  item = null
) {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.id =
    "form-wrapper";

  wrapper.innerHTML =
    `
    <h3>${title}</h3>

    <label>
      Název:<br>
      <input
        id="form-name"
        type="text"
        autocomplete="off"
      >
    </label>

    <br><br>

    <label>
      Popis:<br>
      <textarea id="form-desc"></textarea>
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
      !item ||
      item.type === "point"
        ? `
          <label>
            Velikost:<br>
            <input
              type="number"
              id="form-size"
              min="4"
              max="40"
              value="12"
            >
          </label>

          <br><br>
        `
        : ""
    }

    <div>
      <b>Kategorie:</b><br>

      ${
        categories
          .map(
            (c, i) =>
              `
              <label
                style="display:block;margin:5px 0"
              >
                <input
                  type="checkbox"
                  class="form-cat"
                  value="${escapeHtml(c)}"
                  id="cat-${i}"
                >

                ${escapeHtml(c)}
              </label>
              `
          )
          .join("")
      }
    </div>

    <br>

    <div style="display:flex;gap:8px">

      <button
        type="button"
        id="form-ok"
      >
        ${item ? "Uložit" : "Přidat"}
      </button>

      <button
        type="button"
        id="form-cancel"
      >
        Zrušit
      </button>

    </div>
    `;

  document.body.appendChild(
    wrapper
  );

  if (item) {

    wrapper.querySelector(
      "#form-name"
    ).value =
      item.name || "";

    wrapper.querySelector(
      "#form-desc"
    ).value =
      item.desc || "";

    wrapper.querySelector(
      "#form-color"
    ).value =
      item.color || "#00ffff";

    const size =
      wrapper.querySelector(
        "#form-size"
      );

    if (size) {
      size.value =
        item.size || 12;
    }

    (
      item.categories || []
    ).forEach(
      cat => {

        const checkbox =
          [
            ...wrapper.querySelectorAll(
              ".form-cat"
            )
          ].find(
            x => x.value === cat
          );

        if (checkbox) {
          checkbox.checked =
            true;
        }
      }
    );
  }

  return wrapper;
}

// ============================================================
// ČTENÍ FORMULÁŘE
// ============================================================

function readForm(
  wrapper,
  type
) {

  const name =
    wrapper
      .querySelector(
        "#form-name"
      )
      .value
      .trim();

  const desc =
    wrapper
      .querySelector(
        "#form-desc"
      )
      .value
      .trim();

  const color =
    wrapper
      .querySelector(
        "#form-color"
      )
      .value;

  const selected =
    [
      ...wrapper.querySelectorAll(
        ".form-cat:checked"
      )
    ].map(
      c => c.value
    );

  if (!name) {
    alert(
      "Zadej název."
    );
    return null;
  }

  if (!selected.length) {
    alert(
      "Vyber alespoň jednu kategorii."
    );
    return null;
  }

  const item = {
    type,
    name,
    desc,
    color,
    categories: selected
  };

  if (
    type === "point"
  ) {

    item.size =
      Number(
        wrapper.querySelector(
          "#form-size"
        )?.value || 12
      );
  }

  return item;
}

// ============================================================
// NOVÝ BOD
// ============================================================

function openNewPointForm(
  coords
) {

  const wrapper =
    buildForm(
      "📍 Nový bod"
    );

  wrapper.querySelector(
    "#form-cancel"
  ).onclick =
    () =>
      wrapper.remove();

  wrapper.querySelector(
    "#form-ok"
  ).onclick =
    async () => {

      const item =
        readForm(
          wrapper,
          "point"
        );

      if (!item) {
        return;
      }

      item.id =
        String(Date.now());

      item.x =
        coords.x;

      item.y =
        coords.y;

      if (planningMode) {

        item._temp =
          true;

        data.push(
          item
        );

        render();

        wrapper.remove();

        updatePlanningButtons();

      } else {

        await saveItem(
          item
        );

        wrapper.remove();
      }
    };
}

// ============================================================
// NOVÉ ÚZEMÍ
// ============================================================

function openNewPolygonForm(
  points
) {

  const wrapper =
    buildForm(
      "🥷 Nové území",
      { type: "polygon" }
    );

  wrapper.querySelector(
    "#form-cancel"
  ).onclick =
    () =>
      wrapper.remove();

  wrapper.querySelector(
    "#form-ok"
  ).onclick =
    async () => {

      const item =
        readForm(
          wrapper,
          "polygon"
        );

      if (!item) {
        return;
      }

      item.id =
        String(Date.now());

      item.points =
        points.map(
          p => ({
            x: p.x,
            y: p.y
          })
        );

      if (planningMode) {

        item._temp =
          true;

        data.push(
          item
        );

        render();

        wrapper.remove();

        updatePlanningButtons();

      } else {

        await saveItem(
          item
        );

        wrapper.remove();
      }
    };
}

// ============================================================
// EDITACE
// ============================================================

function openEditForm(
  item
) {

  const wrapper =
    buildForm(
      "✏️ Upravit položku",
      item
    );

  wrapper.querySelector(
    "#form-cancel"
  ).onclick =
    () =>
      wrapper.remove();

  wrapper.querySelector(
    "#form-ok"
  ).onclick =
    async () => {

      const updated =
        readForm(
          wrapper,
          item.type
        );

      if (!updated) {
        return;
      }

      updated.id =
        String(item.id);

      if (
        item.type === "point"
      ) {

        updated.x =
          item.x;

        updated.y =
          item.y;

      } else {

        updated.points =
          item.points;
      }

      if (item._temp) {

        const index =
          data.findIndex(
            i =>
              String(i.id) ===
              String(item.id)
          );

        if (index >= 0) {

          data[index] = {
            ...updated,
            _temp: true
          };
        }

        render();

        wrapper.remove();

      } else {

        await saveItem(
          updated
        );

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

    if (
      e.target.closest(
        ".map-overlay-item"
      )
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const r =
      map.getBoundingClientRect();

    const x =
      clamp01(
        (e.clientX - r.left) /
        r.width
      );

    const y =
      clamp01(
        (e.clientY - r.top) /
        r.height
      );

    openNewPointForm({
      x,
      y
    });
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

    if (
      e.target.closest(
        ".map-overlay-item"
      )
    ) {
      return;
    }

    const r =
      map.getBoundingClientRect();

    currentPolygon.push({

      x:
        clamp01(
          (e.clientX - r.left) /
          r.width
        ),

      y:
        clamp01(
          (e.clientY - r.top) /
          r.height
        )
    });

    drawPolygonPoints();

    if (
      currentPolygon.length >= 3
    ) {

      if (
        confirm(
          "Uzavřít území?"
        )
      ) {

        const points =
          [
            ...currentPolygon
          ];

        currentPolygon =
          [];

        clearPolygonPoints();

        openNewPolygonForm(
          points
        );
      }
    }
  }
);

// ============================================================
// BODY PRO KRESLENÍ ÚZEMÍ
// ============================================================

function drawPolygonPoints() {

  clearPolygonPoints();

  for (
    const p of currentPolygon
  ) {

    const dot =
      document.createElement(
        "div"
      );

    dot.className =
      "polygon-drawing-point";

    dot.style.left =
      `${p.x * 100}%`;

    dot.style.top =
      `${p.y * 100}%`;

    map.appendChild(
      dot
    );
  }
}

function clearPolygonPoints() {

  map
    .querySelectorAll(
      ".polygon-drawing-point"
    )
    .forEach(
      e => e.remove()
    );
}

// ============================================================
// DRAGOVÁNÍ BODŮ
// ============================================================

map.addEventListener(
  "pointerdown",
  e => {

    const marker =
      e.target.closest(
        ".marker"
      );

    if (!marker) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const id =
      marker.id.replace(
        "marker-",
        ""
      );

    const r =
      map.getBoundingClientRect();

    dragState = {
      id,
      moved: false
    };

    const move =
      ev => {

        if (!dragState) {
          return;
        }

        dragState.moved =
          true;

        const x =
          clamp01(
            (ev.clientX - r.left) /
            r.width
          );

        const y =
          clamp01(
            (ev.clientY - r.top) /
            r.height
          );

        const item =
          data.find(
            i =>
              String(i.id) ===
              String(id)
          );

        if (
          !item ||
          item._temp
        ) {
          return;
        }

        item.x =
          x;

        item.y =
          y;

        marker.style.left =
          `${x * 100}%`;

        marker.style.top =
          `${y * 100}%`;
      };

    const up =
      async () => {

        window.removeEventListener(
          "pointermove",
          move
        );

        window.removeEventListener(
          "pointerup",
          up
        );

        const item =
          data.find(
            i =>
              String(i.id) ===
              String(id)
          );

        if (
          item &&
          dragState?.moved &&
          !item._temp
        ) {

          await saveItem(
            item
          );
        }

        dragState =
          null;
      };

    window.addEventListener(
      "pointermove",
      move
    );

    window.addEventListener(
      "pointerup",
      up
    );
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
      -e.deltaY * 0.001;

    scale =
      Math.max(
        1,
        Math.min(
          6,
          scale + delta
        )
      );

    setMapTransform();
  },
  {
    passive: false
  }
);

// ============================================================
// W A S D
// ============================================================

const keys = {};

window.addEventListener(
  "keydown",
  e => {

    if (
      !isTyping()
    ) {

      keys[
        e.key.toLowerCase()
      ] = true;
    }
  }
);

window.addEventListener(
  "keyup",
  e => {

    keys[
      e.key.toLowerCase()
    ] = false;
  }
);

setInterval(
  () => {

    if (
      isTyping()
    ) {
      return;
    }

    const step =
      4 / scale;

    if (keys.w) {
      originY += step;
    }

    if (keys.s) {
      originY -= step;
    }

    if (keys.a) {
      originX += step;
    }

    if (keys.d) {
      originX -= step;
    }

    if (
      keys.w ||
      keys.s ||
      keys.a ||
      keys.d
    ) {

      setMapTransform();
    }
  },
  16
);

function isTyping() {

  const el =
    document.activeElement;

  return (
    !!el &&
    [
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "BUTTON"
    ].includes(
      el.tagName
    )
  );
}

// ============================================================
// PLÁNOVÁNÍ
// ============================================================

function updatePlanningButtons() {

  const toggle =
    document.getElementById(
      "planning-toggle"
    );

  const save =
    document.getElementById(
      "save-plan"
    );

  const cancel =
    document.getElementById(
      "cancel-plan"
    );

  if (toggle) {

    toggle.textContent =
      planningMode
        ? "📝 Plánování: ZAPNUTO"
        : "📝 Plánovat";
  }

  if (save) {

    save.style.display =
      planningMode
        ? "block"
        : "none";
  }

  if (cancel) {

    cancel.style.display =
      planningMode
        ? "block"
        : "none";
  }
}

// ============================================================
// TLAČÍTKA
// ============================================================

function setupButtons() {

  const controls =
    document.getElementById(
      "controls"
    );

  const toggle =
    document.getElementById(
      "planning-toggle"
    );

  const showAll =
    document.getElementById(
      "show-all"
    );

  const search =
    document.getElementById(
      "search"
    );

  // ----------------------------------------
  // ULOŽIT PLÁN
  // ----------------------------------------

  let savePlan =
    document.getElementById(
      "save-plan"
    );

  if (!savePlan) {

    savePlan =
      document.createElement(
        "button"
      );

    savePlan.id =
      "save-plan";

    savePlan.type =
      "button";

    savePlan.textContent =
      "💾 Uložit plán";

    controls.appendChild(
      savePlan
    );
  }

  // ----------------------------------------
  // ZRUŠIT PLÁN
  // ----------------------------------------

  let cancelPlan =
    document.getElementById(
      "cancel-plan"
    );

  if (!cancelPlan) {

    cancelPlan =
      document.createElement(
        "button"
      );

    cancelPlan.id =
      "cancel-plan";

    cancelPlan.type =
      "button";

    cancelPlan.textContent =
      "❌ Zrušit plán";

    controls.appendChild(
      cancelPlan
    );
  }

  // ----------------------------------------
  // PLÁNOVÁNÍ
  // ----------------------------------------

  toggle.onclick =
    () => {

      planningMode =
        !planningMode;

      if (!planningMode) {

        data =
          data.filter(
            i => !i._temp
          );

        currentPolygon =
          [];

        clearPolygonPoints();

        render();
      }

      updatePlanningButtons();
    };

  // ----------------------------------------
  // ULOŽIT PLÁN
  // ----------------------------------------

  savePlan.onclick =
    async () => {

      const temps =
        data.filter(
          i => i._temp
        );

      if (
        !temps.length
      ) {

        alert(
          "V plánu není nic k uložení."
        );

        return;
      }

      let ok = 0;

      for (
        const item of temps
      ) {

        const copy =
          {
            ...item
          };

        delete copy._temp;

        if (
          await saveItem(
            copy
          )
        ) {

          ok++;
        }
      }

      data =
        data.filter(
          i => !i._temp
        );

      planningMode =
        false;

      updatePlanningButtons();

      render();

      alert(
        `Uloženo ${ok} z ${temps.length} položek.`
      );
    };

  // ----------------------------------------
  // ZRUŠIT PLÁN
  // ----------------------------------------

  cancelPlan.onclick =
    () => {

      data =
        data.filter(
          i => !i._temp
        );

      planningMode =
        false;

      currentPolygon =
        [];

      clearPolygonPoints();

      updatePlanningButtons();

      render();
    };

  // ----------------------------------------
  // ZOBRAZIT VŠE
  // ----------------------------------------

  showAll.onclick =
    () => {

      expandedCategories =
        expandedCategories.size ===
        categories.length
          ? new Set()
          : new Set(categories);

      render();
    };

  // ----------------------------------------
  // HLEDÁNÍ
  // ----------------------------------------

  search.oninput =
    () =>
      render();

  updatePlanningButtons();
}

// ============================================================
// START
// ============================================================

setupButtons();
loadData();
```
