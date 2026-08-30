/* =====================================================
   VERDUGOS MAP
   Kompletní app.js
===================================================== */

const viewport = document.getElementById("mapViewport");
const canvas = document.getElementById("mapCanvas");
const mapImage = document.getElementById("mapImage");
const pointsLayer = document.getElementById("pointsLayer");

/* Sidebar */
const categoryList = document.getElementById("categoryList");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const toggleAllBtn = document.getElementById("toggleAllBtn");

/* Point mode */
const addPointBtn = document.getElementById("addPointBtn");
const addTerritoryBtn = document.getElementById("addTerritoryBtn");
const pointModeHint = document.getElementById("pointModeHint");
const territoryLayer = document.getElementById("territoryLayer");

/* Point modal */
const pointModal = document.getElementById("pointModal");
const pointModalCard = document.getElementById("pointModalCard");
const pointModalTitle = document.getElementById("pointModalTitle");

const closePointBtn = document.getElementById("closePointBtn");
const cancelPointBtn = document.getElementById("cancelPointBtn");
const savePointBtn = document.getElementById("savePointBtn");

const pointNameInput = document.getElementById("pointName");
const pointDescriptionInput = document.getElementById("pointDescription");
const pointCategorySelect = document.getElementById("pointCategory");

const pointSizeInput = document.getElementById("pointSize");
const pointSizeValue = document.getElementById("pointSizeValue");

/* Colors */
const colorWheel = document.getElementById("colorWheel");
const colorWheelCursor = document.getElementById("colorWheelCursor");
const colorPresets = document.getElementById("colorPresets");
const colorPreview = document.getElementById("colorPreview");

const redInput = document.getElementById("redInput");
const greenInput = document.getElementById("greenInput");
const blueInput = document.getElementById("blueInput");

/* Category modal */
const categoryModal = document.getElementById("categoryModal");
const categoryNameInput = document.getElementById("categoryName");
const categoryEmojiInput = document.getElementById("categoryEmoji");
const categoryEmojiPresets = document.getElementById("categoryEmojiPresets");

const closeCategoryBtn = document.getElementById("closeCategoryBtn");
const cancelCategoryBtn = document.getElementById("cancelCategoryBtn");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");

/* Context menu */
const pointContextMenu = document.getElementById("pointContextMenu");
const editPointBtn = document.getElementById("editPointBtn");
const deletePointBtn = document.getElementById("deletePointBtn");
const closeContextMenuBtn = document.getElementById("closeContextMenuBtn");

/* Controls */
const controlsBtn = document.getElementById("controlsBtn");
const controlsHelp = document.getElementById("controlsHelp");


/* =====================================================
   MAPA - POZICE
===================================================== */

let scale = 1;
let x = 0;
let y = 0;

const MIN_SCALE = 0.45;
const MAX_SCALE = 10;


/* =====================================================
   MAPA - DRAG
===================================================== */

let dragging = false;

let startX = 0;
let startY = 0;

let startMapX = 0;
let startMapY = 0;


/* =====================================================
   BODY
===================================================== */

let addingPoint = false;

let pendingPoint = null;

let editingPointId = null;


/* =====================================================
   HIGHLIGHT
===================================================== */

let focusedPointId = null;

let focusedPointTimer = null;


/* =====================================================
   CONTEXT MENU
===================================================== */

let contextPointId = null;


/* =====================================================
   ÚZEMÍ
===================================================== */

let addingTerritory = false;
let territoryVertices = [];
let territoryFormOpen = false;
let territoryModal = null;

const TERRITORY_STATUSES = {
  friendly: {
    label: "Přátelské",
    emoji: "🛡️",
    color: "#2f80ff"
  },
  hostile: {
    label: "Nepřátelské",
    emoji: "❗",
    color: "#e53935"
  },
  neutral: {
    label: "Neutrální",
    emoji: "🤝",
    color: "#f28c28"
  },
  ours: {
    label: "Naše",
    emoji: "🏠",
    color: "#39b54a"
  }
};

let territories = loadData(
  "verdugosTerritories",
  []
).map(territory => ({
  id: territory.id || createId(),
  points: Array.isArray(territory.points) ? territory.points : [],
  name: territory.name || "Bez názvu",
  description: territory.description || "",
  status: territory.status || "neutral"
}));

function saveTerritories() {
  localStorage.setItem(
    "verdugosTerritories",
    JSON.stringify(territories)
  );
}

saveTerritories();


/* =====================================================
   BARVY
===================================================== */

const COLOR_PRESETS = [
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#007aff"
];


const CATEGORY_ICON_PRESETS = [
  "📌",
  "🗺️",
  "🏠",
  "🏢",
  "💊",
  "🚗",
  "🏍️",
  "🔫",
  "💰",
  "📦",
  "⭐",
  "⚠️",
  "🔥",
  "☠️",
  "👑",
  "🎯",
  "🛡️",
  "🚩",
  "📍",
  "🔵",
  "🟢",
  "🔴"
];


let selectedColor = "#ff3b30";

let selectedSize = 6;

let wheelHue = 0;

let wheelSaturation = 1;

let colorWheelDragging = false;


/* =====================================================
   WASD
===================================================== */

const WASD_SPEED = 25;

const pressedKeys = new Set();

let wasdAnimationId = null;


/* =====================================================
   ID
===================================================== */

function createId() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


/* =====================================================
   DEFAULT KATEGORIE
===================================================== */

const DEFAULT_CATEGORIES = [
  {
    id: createId(),
    name: "Území",
    emoji: "🗺️",
    visible: true
  },

  {
    id: createId(),
    name: "Prodej drog",
    emoji: "💊",
    visible: true
  },

  {
    id: createId(),
    name: "Záterasy autem",
    emoji: "🚗",
    visible: true
  },

  {
    id: createId(),
    name: "Ujíždění na motorce",
    emoji: "🏍️",
    visible: true
  }
];


/* =====================================================
   STORAGE
===================================================== */

function loadData(key, fallback) {

  try {

    const raw =
      localStorage.getItem(key);


    if (!raw) {
      return fallback;
    }


    const data =
      JSON.parse(raw);


    if (
      Array.isArray(data)
    ) {

      return data;

    }


    return fallback;

  } catch {

    return fallback;

  }

}


function saveCategories() {

  localStorage.setItem(
    "verdugosCategories",
    JSON.stringify(categories)
  );

}


function savePoints() {

  localStorage.setItem(
    "verdugosPoints",
    JSON.stringify(points)
  );

}


/* =====================================================
   DATA
===================================================== */

let categories =
  loadData(
    "verdugosCategories",
    DEFAULT_CATEGORIES
  ).map(category => ({
    ...category,
    visible: true
  }));
saveCategories();


let points =
  loadData(
    "verdugosPoints",
    []
  );


/* =====================================================
   NORMALIZACE
===================================================== */

categories =
  categories.map(
    category => ({

      id:
        category.id ||
        createId(),

      name:
        category.name ||
        "Bez názvu",

      emoji:
        category.emoji ||
        "📌",

      visible:
        category.visible !== false

    })
  );


points =
  points.map(
    point => ({

      id:
        point.id ||
        createId(),

      x:
        Number(point.x) || 0,

      y:
        Number(point.y) || 0,

      name:
        point.name ||
        "Bez názvu",

      description:
        point.description ||
        "",

      categoryId:
        point.categoryId ||
        "",

      color:
        point.color ||
        "#ff3b30",

      size:
        Number(point.size) ||
        6

    })
  );


saveCategories();

savePoints();


/* =====================================================
   HELPERY
===================================================== */

function getCategory(id) {

  return categories.find(
    category =>
      category.id === id
  );

}


function getPoint(id) {

  return points.find(
    point =>
      point.id === id
  );

}


function countPoints(
  categoryId
) {

  return points.filter(
    point =>
      point.categoryId ===
      categoryId
  ).length;

}


function categoryLabel(
  category
) {

  return (
    `${category.emoji || "📌"} ${category.name}`
  );

}


/* =====================================================
   KATEGORIE
===================================================== */

function renderCategories() {

  categoryList.innerHTML = "";


  categories.forEach(
    category => {

      const wrap =
        document.createElement(
          "div"
        );


      wrap.className =
        "category-wrap";


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "category-item";


      if (
        !category.visible
      ) {

        item.classList.add(
          "hidden-category"
        );

      }


      const emoji =
        document.createElement(
          "span"
        );


      emoji.className =
        "category-emoji";


      emoji.textContent =
        category.emoji ||
        "📌";


      const name =
        document.createElement(
          "span"
        );


      name.className =
        "category-name";


      name.textContent =
        category.name;


      const count =
        document.createElement(
          "span"
        );


      count.className =
        "category-count";


      count.textContent =
        countPoints(
          category.id
        );


      const state =
        document.createElement(
          "span"
        );


      state.className =
        "category-state";


      state.textContent =
        category.visible
          ? "zobrazeno"
          : "skryto";


      item.append(
        emoji,
        name,
        count,
        state
      );


      /* -----------------------------------------------
         HOVER KATEGORIE
         => pulsují všechny body
      ------------------------------------------------ */

      item.addEventListener(
        "mouseenter",
        () => {

          highlightCategory(
            category.id
          );

        }
      );


      item.addEventListener(
        "mouseleave",
        () => {

          unhighlightCategory(
            category.id
          );

        }
      );


      /* -----------------------------------------------
         KLIK KATEGORIE
         => zobrazit / skrýt
      ------------------------------------------------ */

      item.addEventListener(
        "click",
        () => {

          category.visible =
            !category.visible;


          saveCategories();


          renderCategories();

          renderPoints();

          ensureTerritoryLayer();

        }
      );


      /* -----------------------------------------------
         PRAVÝ KLIK
         => smazat
      ------------------------------------------------ */

      item.addEventListener(
        "contextmenu",
        event => {

          event.preventDefault();


          deleteCategory(
            category.id
          );

        }
      );


      wrap.appendChild(
        item
      );


      /* =================================================
         PODBODY
      ================================================= */

      const children =
        document.createElement(
          "div"
        );


      children.className =
        "category-points";


      const categoryPoints =
        points.filter(
          point =>
            point.categoryId ===
            category.id
        );


      categoryPoints.forEach(
        point => {

          const child =
            document.createElement(
              "div"
            );


          child.className =
            "category-point";


          const dot =
            document.createElement(
              "span"
            );


          dot.className =
            "category-point-dot";


          dot.style.backgroundColor =
            point.color ||
            "#ff3b30";


          const text =
            document.createElement(
              "span"
            );


          text.className =
            "category-point-name";


          text.textContent =
            point.name;


          child.append(
            dot,
            text
          );


          /*
            HOVER PODBODU:
            schválně nic.
          */


          /*
            KLIK PODBODU:
            zvýraznit bod + tooltip.
          */

          child.addEventListener(
            "click",
            event => {

              event.stopPropagation();


              highlightPoint(
                point.id,
                true
              );

            }
          );


          /*
            PRAVÝ KLIK PODBODU
          */

          child.addEventListener(
            "contextmenu",
            event => {

              event.preventDefault();

              event.stopPropagation();


              openContextMenu(
                event.clientX,
                event.clientY,
                point.id
              );

            }
          );


          children.appendChild(
            child
          );

        }
      );


      if (
        children.children.length
      ) {

        wrap.appendChild(
          children
        );

      }


      /* -----------------------------------------------
         ÚZEMÍ POD KATEGORIÍ ÚZEMÍ
      ------------------------------------------------ */

      if (
        category.name.trim().toLowerCase() === "území"
      ) {

        const territoryChildren =
          document.createElement("div");

        territoryChildren.className =
          "category-points territory-category-points";

        territories.forEach(territory => {

          const status =
            TERRITORY_STATUSES[territory.status] ||
            TERRITORY_STATUSES.neutral;

          const child =
            document.createElement("div");

          child.className =
            "category-point territory-list-item";

          const icon =
            document.createElement("span");

          icon.className =
            "territory-list-icon";

          icon.textContent =
            status.emoji;

          const text =
            document.createElement("span");

          text.className =
            "category-point-name";

          text.textContent =
            territory.name;

          child.append(icon, text);

          child.addEventListener("click", event => {
            event.stopPropagation();
            focusTerritory(territory.id);
          });

          child.addEventListener("contextmenu", event => {
            event.preventDefault();
            event.stopPropagation();
            deleteTerritory(territory.id);
          });

          territoryChildren.appendChild(child);

        });

        if (territoryChildren.children.length) {
          wrap.appendChild(territoryChildren);
        }
      }


      categoryList.appendChild(
        wrap
      );

    }
  );


  updateToggleAllButton();

}


/* =====================================================
   SKRÝT / ZOBRAZIT VŠE
===================================================== */

function updateToggleAllButton() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      category =>
        category.visible
    );


  toggleAllBtn.textContent =
    allVisible
      ? "Skrýt vše"
      : "Zobrazit vše";

}


function toggleAllCategories() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      category =>
        category.visible
    );


  categories =
    categories.map(
      category => ({

        ...category,

        visible:
          !allVisible

      })
    );


  saveCategories();


  renderCategories();

  renderPoints();

}


/* =====================================================
   PULS KATEGORIE
===================================================== */

function highlightCategory(
  categoryId
) {

  pointsLayer
    .querySelectorAll(
      `[data-category-id="${categoryId}"]`
    )
    .forEach(
      element => {

        if (
          element.dataset.preview ===
          "true"
        ) {

          return;

        }


        element.classList.add(
          "category-hover-point"
        );

      }
    );

}


function unhighlightCategory(
  categoryId
) {

  pointsLayer
    .querySelectorAll(
      `[data-category-id="${categoryId}"]`
    )
    .forEach(
      element => {

        element.classList.remove(
          "category-hover-point"
        );

      }
    );

}


/* =====================================================
   ZVÝRAZNĚNÍ BODU
===================================================== */

function highlightPoint(
  id,
  persistent = false
) {

  clearTimeout(
    focusedPointTimer
  );


  pointsLayer
    .querySelectorAll(
      ".map-point.focused-point"
    )
    .forEach(
      element => {

        element.classList.remove(
          "focused-point"
        );

      }
    );


  const element =
    pointsLayer.querySelector(
      `[data-point-id="${id}"]`
    );


  if (!element) {
    return;
  }


  focusedPointId =
    id;


  element.classList.add(
    "focused-point"
  );


  if (
    persistent
  ) {

    focusedPointTimer =
      setTimeout(
        () => {

          element.classList.remove(
            "focused-point"
          );


          if (
            focusedPointId === id
          ) {

            focusedPointId =
              null;

          }

        },
        4000
      );

  }

}


/* =====================================================
   DELETE CATEGORY
===================================================== */

function deleteCategory(
  id
) {

  const category =
    getCategory(
      id
    );


  if (!category) {
    return;
  }


  const count =
    countPoints(
      id
    );


  let message =
    `Opravdu chceš smazat kategorii „${category.name}“?`;


  if (
    count > 0
  ) {

    message +=
      `\n\nObsahuje ${count} bodů. Ty budou také odstraněny.`;

  }


  if (
    !confirm(message)
  ) {

    return;

  }


  const deletingTerritoryCategory =
    category.name.trim().toLowerCase() === "území";


  categories =
    categories.filter(
      category =>
        category.id !== id
    );


  points =
    points.filter(
      point =>
        point.categoryId !== id
    );


  if (deletingTerritoryCategory) {
    territories = [];
    saveTerritories();
  }


  saveCategories();

  savePoints();


  renderCategories();

  renderPoints();

}


/* =====================================================
   CATEGORY MODAL
===================================================== */

function openCategoryModal() {

  categoryNameInput.value =
    "";


  if (
    categoryEmojiInput
  ) {

    categoryEmojiInput.value =
      "📌";

  }


  renderCategoryEmojiPresets();


  categoryModal.classList.remove(
    "hidden"
  );


  categoryModal.setAttribute(
    "aria-hidden",
    "false"
  );


  setTimeout(
    () =>
      categoryNameInput.focus(),
    50
  );

}


function closeCategoryModal() {

  categoryModal.classList.add(
    "hidden"
  );


  categoryModal.setAttribute(
    "aria-hidden",
    "true"
  );

}


function addCategory() {

  const name =
    categoryNameInput.value.trim();


  if (!name) {

    categoryNameInput.focus();

    return;

  }


  const exists =
    categories.some(
      category =>
        category.name.toLowerCase() ===
        name.toLowerCase()
    );


  if (exists) {

    alert(
      "Tato kategorie už existuje."
    );

    return;

  }


  let emoji =
    categoryEmojiInput?.value.trim() ||
    "📌";


  /*
    Pro běžné emoji necháme první
    znak / emoji sekvenci.
  */

  emoji =
    emoji.slice(0, 4);


  categories.push({

    id:
      createId(),

    name,

    emoji,

    visible:
      true

  });


  saveCategories();


  renderCategories();


  closeCategoryModal();

}


/* =====================================================
   CATEGORY EMOJI PRESETS
===================================================== */

function renderCategoryEmojiPresets() {

  if (
    !categoryEmojiPresets
  ) {

    return;

  }


  categoryEmojiPresets.innerHTML =
    "";


  CATEGORY_ICON_PRESETS.forEach(
    emoji => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "category-emoji-preset";


      button.textContent =
        emoji;


      button.addEventListener(
        "click",
        event => {

          event.preventDefault();


          if (
            categoryEmojiInput
          ) {

            categoryEmojiInput.value =
              emoji;

          }

        }
      );


      categoryEmojiPresets.appendChild(
        button
      );

    }
  );

}


/* =====================================================
   SELECT KATEGORIÍ
===================================================== */

function renderCategorySelect() {

  pointCategorySelect.innerHTML =
    "";


  categories
    .filter(category =>
      category.name.trim().toLowerCase() !== "území"
    )
    .forEach(
    category => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        category.id;


      option.textContent =
        categoryLabel(
          category
        );


      pointCategorySelect.appendChild(
        option
      );

    }
  );

}


/* =====================================================
   PŘIDÁNÍ BODU - START
===================================================== */

function startPointMode() {

  if (addingTerritory) {
    stopTerritoryMode();
  }

  if (
    categories.length === 0
  ) {

    alert(
      "Nejdříve vytvoř kategorii."
    );

    return;

  }


  closeContextMenu();


  addingPoint =
    true;


  pendingPoint =
    null;


  viewport.classList.add(
    "add-point-mode"
  );


  pointModeHint.classList.remove(
    "hidden"
  );


  addPointBtn.classList.add(
    "active"
  );

}


function stopPointMode() {

  addingPoint =
    false;


  viewport.classList.remove(
    "add-point-mode"
  );


  pointModeHint.classList.add(
    "hidden"
  );


  addPointBtn.classList.remove(
    "active"
  );

}


/* =====================================================
   KLIK NA MAPU
===================================================== */

function placeNewPoint(
  event
) {

  if (!addingPoint) {
    return;
  }


  const rect =
    mapImage.getBoundingClientRect();


  if (

    event.clientX <
    rect.left ||

    event.clientX >
    rect.right ||

    event.clientY <
    rect.top ||

    event.clientY >
    rect.bottom

  ) {

    return;

  }


  const px =
    event.clientX -
    rect.left;


  const py =
    event.clientY -
    rect.top;


  pendingPoint = {

    x:
      px /
      rect.width *
      100,

    y:
      py /
      rect.height *
      100,

    clientX:
      event.clientX,

    clientY:
      event.clientY

  };


  stopPointMode();


  renderPoints();


  openPointModal(
    event.clientX,
    event.clientY
  );

}



/* =====================================================
   ÚZEMÍ - VYKRESLENÍ
===================================================== */

function ensureTerritoryLayer() {
  if (!territoryLayer) {
    return;
  }

  territoryLayer.innerHTML = "";

  const territoryCategory =
    categories.find(category =>
      category.name.trim().toLowerCase() === "území"
    );

  if (
    territoryCategory &&
    territoryCategory.visible
  ) {
    territories.forEach(territory => {
      drawTerritory(territory);
    });
  }

  if (addingTerritory) {
    drawTerritoryPreview();
  }
}


function svgElement(name) {
  return document.createElementNS(
    "http://www.w3.org/2000/svg",
    name
  );
}


function drawTerritory(territory) {
  if (
    !territoryLayer ||
    !Array.isArray(territory.points) ||
    territory.points.length < 3
  ) {
    return;
  }

  const status =
    TERRITORY_STATUSES[territory.status] ||
    TERRITORY_STATUSES.neutral;

  const polygon = svgElement("polygon");

  polygon.setAttribute(
    "points",
    territory.points
      .map(point =>
        `${point.x * 10},${point.y * 10}`
      )
      .join(" ")
  );

  polygon.setAttribute(
    "fill",
    status.color
  );

  polygon.setAttribute(
    "fill-opacity",
    "0.22"
  );

  polygon.setAttribute(
    "stroke",
    status.color
  );

  polygon.setAttribute(
    "stroke-opacity",
    "0.9"
  );

  polygon.setAttribute(
    "stroke-width",
    "3"
  );

  polygon.classList.add(
    "territory-shape"
  );

  polygon.dataset.territoryId =
    territory.id;

  polygon.addEventListener(
    "click",
    event => {
      event.stopPropagation();
      focusTerritory(
        territory.id
      );
    }
  );

  polygon.addEventListener(
    "contextmenu",
    event => {
      event.preventDefault();
      event.stopPropagation();
      deleteTerritory(
        territory.id
      );
    }
  );

  territoryLayer.appendChild(
    polygon
  );

  const center =
    territory.points.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }),
      {x:0,y:0}
    );

  center.x /=
    territory.points.length;

  center.y /=
    territory.points.length;

  const label =
    svgElement("text");

  label.setAttribute(
    "x",
    center.x * 10
  );

  label.setAttribute(
    "y",
    center.y * 10
  );

  label.setAttribute(
    "text-anchor",
    "middle"
  );

  label.setAttribute(
    "dominant-baseline",
    "central"
  );

  label.setAttribute(
    "font-size",
    "22"
  );

  label.setAttribute(
    "class",
    "territory-emoji"
  );

  label.textContent =
    status.emoji;

  label.style.pointerEvents =
    "none";

  territoryLayer.appendChild(
    label
  );
}


function drawTerritoryPreview() {
  if (
    !addingTerritory ||
    territoryVertices.length < 1 ||
    !territoryLayer
  ) {
    return;
  }

  const points =
    territoryVertices
      .map(point =>
        `${point.x * 10},${point.y * 10}`
      )
      .join(" ");

  const status =
    TERRITORY_STATUSES.neutral;

  const polygon =
    svgElement("polygon");

  polygon.setAttribute(
    "points",
    points
  );

  polygon.setAttribute(
    "fill",
    status.color
  );

  polygon.setAttribute(
    "fill-opacity",
    "0.12"
  );

  polygon.setAttribute(
    "stroke",
    status.color
  );

  polygon.setAttribute(
    "stroke-opacity",
    "0.75"
  );

  polygon.setAttribute(
    "stroke-width",
    "2"
  );

  polygon.setAttribute(
    "stroke-dasharray",
    "8 6"
  );

  polygon.classList.add(
    "territory-preview"
  );

  territoryLayer.appendChild(
    polygon
  );

  territoryVertices.forEach(
    (point, index) => {

      const circle =
        svgElement("circle");

      circle.setAttribute(
        "cx",
        point.x * 10
      );

      circle.setAttribute(
        "cy",
        point.y * 10
      );

      circle.setAttribute(
        "r",
        index === 0
          ? "8"
          : "5"
      );

      circle.setAttribute(
        "class",
        index === 0
          ? "territory-vertex territory-start-vertex"
          : "territory-vertex"
      );

      circle.style.pointerEvents =
        "none";

      territoryLayer.appendChild(
        circle
      );

    }
  );
}


/* =====================================================
   ÚZEMÍ - START / STOP
===================================================== */

function startTerritoryMode() {

  closeContextMenu();
  closePointModal();

  addingTerritory =
    true;

  territoryVertices =
    [];

  viewport.classList.add(
    "add-territory-mode"
  );

  if (pointModeHint) {
    pointModeHint.textContent =
      "Klikáním vytvoř obrys území. Klikni znovu na první bod pro uzavření.";
    pointModeHint.classList.remove(
      "hidden"
    );
  }

  if (addTerritoryBtn) {
    addTerritoryBtn.classList.add(
      "active"
    );
  }

  ensureTerritoryLayer();
}


function stopTerritoryMode() {

  addingTerritory =
    false;

  territoryVertices =
    [];

  viewport.classList.remove(
    "add-territory-mode"
  );

  if (pointModeHint) {
    pointModeHint.textContent =
      "Klikni na mapu na místo, kam chceš přidat bod.";
    pointModeHint.classList.add(
      "hidden"
    );
  }

  if (addTerritoryBtn) {
    addTerritoryBtn.classList.remove(
      "active"
    );
  }

  ensureTerritoryLayer();
}


function addTerritoryVertex(
  event
) {

  if (!addingTerritory) {
    return;
  }

  if (
    event.target.closest &&
    event.target.closest(".map-controls")
  ) {
    return;
  }

  const rect =
    mapImage.getBoundingClientRect();

  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    return;
  }

  const x =
    (
      (event.clientX - rect.left) /
      rect.width
    ) * 100;

  const y =
    (
      (event.clientY - rect.top) /
      rect.height
    ) * 100;

  if (territoryVertices.length >= 3) {

    const first =
      territoryVertices[0];

    const distance =
      Math.hypot(
        first.x - x,
        first.y - y
      );

    if (distance <= 2.2) {
      finishTerritory(
        event.clientX,
        event.clientY
      );
      return;
    }
  }

  territoryVertices.push({
    x,
    y
  });

  ensureTerritoryLayer();
}


function finishTerritory(
  clientX,
  clientY
) {

  if (
    territoryVertices.length < 3
  ) {
    return;
  }

  addingTerritory =
    false;

  viewport.classList.remove(
    "add-territory-mode"
  );

  if (addTerritoryBtn) {
    addTerritoryBtn.classList.remove(
      "active"
    );
  }

  if (pointModeHint) {
    pointModeHint.classList.add(
      "hidden"
    );
  }

  ensureTerritoryLayer();

  openTerritoryModal(
    clientX,
    clientY
  );
}


/* =====================================================
   ÚZEMÍ - MODAL
===================================================== */

function ensureTerritoryModal() {

  if (territoryModal) {
    return territoryModal;
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "territoryModal";

  overlay.className =
    "territory-modal hidden";

  overlay.setAttribute(
    "aria-hidden",
    "true"
  );

  overlay.innerHTML = `
    <div class="modal-card territory-modal-card" id="territoryModalCard">

      <div class="modal-header">
        <h3>Přidat území</h3>

        <button
          id="closeTerritoryBtn"
          class="close-btn"
          type="button"
          aria-label="Zavřít"
        >×</button>
      </div>

      <label for="territoryName">
        Jméno
      </label>

      <input
        id="territoryName"
        type="text"
        autocomplete="off"
        placeholder="Např. Barrio"
      >

      <label for="territoryDescription">
        Popisek
      </label>

      <textarea
        id="territoryDescription"
        placeholder="Krátký popis území..."
      ></textarea>

      <label>
        Typ území
      </label>

      <div class="territory-status-grid">

        <button
          type="button"
          class="territory-status-option"
          data-status="friendly"
        >
          <span class="territory-status-icon">🛡️</span>
          <span>Přátelské</span>
        </button>

        <button
          type="button"
          class="territory-status-option"
          data-status="hostile"
        >
          <span class="territory-status-icon">❗</span>
          <span>Nepřátelské</span>
        </button>

        <button
          type="button"
          class="territory-status-option"
          data-status="neutral"
        >
          <span class="territory-status-icon">🤝</span>
          <span>Neutrální</span>
        </button>

        <button
          type="button"
          class="territory-status-option"
          data-status="ours"
        >
          <span class="territory-status-icon">🏠</span>
          <span>Naše</span>
        </button>

      </div>

      <div class="territory-preview-row">
        <span>Barva území</span>
        <span id="territoryColorPreview" class="territory-color-preview"></span>
      </div>

      <div class="modal-actions">
        <button
          id="cancelTerritoryBtn"
          class="secondary-btn"
          type="button"
        >Zrušit</button>

        <button
          id="saveTerritoryBtn"
          class="primary-btn"
          type="button"
        >Přidat území</button>
      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  territoryModal =
    overlay;

  const statusButtons =
    overlay.querySelectorAll(
      ".territory-status-option"
    );

  let selectedStatus =
    "neutral";

  overlay.dataset.status =
    selectedStatus;

  statusButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();
          event.stopPropagation();

          selectedStatus =
            button.dataset.status;

          overlay.dataset.status =
            selectedStatus;

          statusButtons.forEach(
            other => {
              other.classList.toggle(
                "selected",
                other === button
              );
            }
          );

          const status =
            TERRITORY_STATUSES[
              selectedStatus
            ];

          const preview =
            overlay.querySelector(
              "#territoryColorPreview"
            );

          preview.style.background =
            status.color;

          drawTerritoryFormPreview(
            selectedStatus
          );
        }
      );

    }
  );

  const initial =
    overlay.querySelector(
      '[data-status="neutral"]'
    );

  initial.classList.add(
    "selected"
  );

  overlay.querySelector(
    "#closeTerritoryBtn"
  ).addEventListener(
    "click",
    closeTerritoryModal
  );

  overlay.querySelector(
    "#cancelTerritoryBtn"
  ).addEventListener(
    "click",
    closeTerritoryModal
  );

  overlay.querySelector(
    "#saveTerritoryBtn"
  ).addEventListener(
    "click",
    saveTerritory
  );

  overlay.querySelector(
    "#territoryName"
  ).addEventListener(
    "input",
    renderTerritoryModalPreview
  );

  overlay.querySelector(
    "#territoryDescription"
  ).addEventListener(
    "input",
    renderTerritoryModalPreview
  );

  return overlay;
}


function drawTerritoryFormPreview(
  statusKey
) {

  const status =
    TERRITORY_STATUSES[
      statusKey
    ];

  if (
    !territoryVertices.length ||
    !territoryLayer
  ) {
    return;
  }

  /*
    Po výběru statusu okamžitě překreslíme náhled
    danou barvou a emoji.
  */

  ensureTerritoryLayer();

  const points =
    territoryVertices
      .map(point =>
        `${point.x * 10},${point.y * 10}`
      )
      .join(" ");

  const polygon =
    svgElement("polygon");

  polygon.setAttribute(
    "points",
    points
  );

  polygon.setAttribute(
    "fill",
    status.color
  );

  polygon.setAttribute(
    "fill-opacity",
    "0.25"
  );

  polygon.setAttribute(
    "stroke",
    status.color
  );

  polygon.setAttribute(
    "stroke-opacity",
    "0.95"
  );

  polygon.setAttribute(
    "stroke-width",
    "3"
  );

  polygon.classList.add(
    "territory-preview"
  );

  territoryLayer.appendChild(
    polygon
  );

  const center =
    territoryVertices.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }),
      {x:0,y:0}
    );

  center.x /=
    territoryVertices.length;

  center.y /=
    territoryVertices.length;

  const label =
    svgElement("text");

  label.setAttribute(
    "x",
    center.x * 10
  );

  label.setAttribute(
    "y",
    center.y * 10
  );

  label.setAttribute(
    "text-anchor",
    "middle"
  );

  label.setAttribute(
    "dominant-baseline",
    "central"
  );

  label.setAttribute(
    "font-size",
    "22"
  );

  label.classList.add(
    "territory-emoji"
  );

  label.textContent =
    status.emoji;

  label.style.pointerEvents =
    "none";

  territoryLayer.appendChild(
    label
  );
}


function renderTerritoryModalPreview() {
  drawTerritoryFormPreview(
    territoryModal?.dataset.status ||
    "neutral"
  );
}


function openTerritoryModal(
  clientX,
  clientY
) {

  ensureTerritoryModal();

  const nameInput =
    territoryModal.querySelector(
      "#territoryName"
    );

  const descriptionInput =
    territoryModal.querySelector(
      "#territoryDescription"
    );

  nameInput.value =
    "";

  descriptionInput.value =
    "";

  territoryModal.dataset.status =
    "neutral";

  territoryModal
    .querySelectorAll(
      ".territory-status-option"
    )
    .forEach(
      button => {
        button.classList.toggle(
          "selected",
          button.dataset.status ===
          "neutral"
        );
      }
    );

  const preview =
    territoryModal.querySelector(
      "#territoryColorPreview"
    );

  preview.style.background =
    TERRITORY_STATUSES.neutral.color;

  territoryModal.classList.remove(
    "hidden"
  );

  territoryModal.setAttribute(
    "aria-hidden",
    "false"
  );

  territoryFormOpen =
    true;

  positionTerritoryModal(
    clientX,
    clientY
  );

  setTimeout(
    () => nameInput.focus(),
    50
  );

  renderTerritoryFormPreview();
}


function positionTerritoryModal(
  clientX,
  clientY
) {

  const card =
    territoryModal.querySelector(
      "#territoryModalCard"
    );

  requestAnimationFrame(
    () => {

      const rect =
        card.getBoundingClientRect();

      const gap =
        16;

      let left =
        clientX + gap;

      let top =
        clientY;

      if (
        left + rect.width >
        window.innerWidth - 10
      ) {
        left =
          window.innerWidth -
          rect.width -
          10;
      }

      if (
        top + rect.height >
        window.innerHeight - 10
      ) {
        top =
          window.innerHeight -
          rect.height -
          10;
      }

      card.style.left =
        `${Math.max(10,left)}px`;

      card.style.top =
        `${Math.max(10,top)}px`;
    }
  );
}


function closeTerritoryModal() {

  if (!territoryModal) {
    return;
  }

  territoryModal.classList.add(
    "hidden"
  );

  territoryModal.setAttribute(
    "aria-hidden",
    "true"
  );

  territoryFormOpen =
    false;

  stopTerritoryMode();

  ensureTerritoryLayer();
}


function saveTerritory() {

  if (
    territoryVertices.length < 3
  ) {
    return;
  }

  const name =
    territoryModal
      .querySelector(
        "#territoryName"
      )
      .value
      .trim();

  if (!name) {

    alert(
      "Napiš jméno území."
    );

    return;
  }

  const description =
    territoryModal
      .querySelector(
        "#territoryDescription"
      )
      .value
      .trim();

  const status =
    territoryModal.dataset.status ||
    "neutral";

  territories.push({

    id:
      createId(),

    points:
      territoryVertices.map(point => ({
        x:point.x,
        y:point.y
      })),

    name,

    description,

    status

  });

  saveTerritories();

  closeTerritoryModal();

  renderCategories();

  ensureTerritoryLayer();
}


function focusTerritory(
  id
) {

  const element =
    territoryLayer?.querySelector(
      `[data-territory-id="${id}"]`
    );

  if (!element) {
    return;
  }

  element.classList.remove(
    "territory-focused"
  );

  void element.offsetWidth;

  element.classList.add(
    "territory-focused"
  );

  setTimeout(
    () => {
      element.classList.remove(
        "territory-focused"
      );
    },
    2500
  );
}


function deleteTerritory(
  id
) {

  const territory =
    territories.find(
      item => item.id === id
    );

  if (!territory) {
    return;
  }

  if (
    !confirm(
      `Opravdu chceš smazat území „${territory.name}“?`
    )
  ) {
    return;
  }

  territories =
    territories.filter(
      item => item.id !== id
    );

  saveTerritories();

  renderCategories();

  ensureTerritoryLayer();
}


/* =====================================================
   POINT MODAL NOVÝ
===================================================== */

function openPointModal(
  clientX,
  clientY
) {

  editingPointId =
    null;


  pointModalTitle.textContent =
    "Přidat bod";


  savePointBtn.textContent =
    "Přidat bod";


  renderCategorySelect();


  pointNameInput.value =
    "";


  pointDescriptionInput.value =
    "";


  selectedSize =
    6;


  pointSizeInput.value =
    6;


  pointSizeValue.textContent =
    "6 px";


  if (
    categories.length > 0
  ) {

    pointCategorySelect.value =
      categories[0].id;

  }


  pointModal.classList.remove(
    "hidden"
  );


  pointModal.style.pointerEvents =
    "auto";

  pointModalCard.style.pointerEvents =
    "auto";


  pointModal.setAttribute(
    "aria-hidden",
    "false"
  );


  positionPointModal(
    clientX,
    clientY
  );


  renderPoints();


  setTimeout(
    () =>
      pointNameInput.focus(),
    50
  );

}


/* =====================================================
   EDITACE BODU
===================================================== */

function openEditPoint(
  id
) {

  const point =
    getPoint(
      id
    );


  if (!point) {
    return;
  }


  editingPointId =
    id;


  pendingPoint = {

    x:
      point.x,

    y:
      point.y

  };


  renderCategorySelect();


  pointModalTitle.textContent =
    "Editovat bod";


  savePointBtn.textContent =
    "Uložit změny";


  pointNameInput.value =
    point.name || "";


  pointDescriptionInput.value =
    point.description || "";


  pointCategorySelect.value =
    point.categoryId || "";


  selectedSize =
    Number(
      point.size
    ) || 6;


  pointSizeInput.value =
    selectedSize;


  pointSizeValue.textContent =
    `${selectedSize} px`;


  pointModal.classList.remove(
    "hidden"
  );


  pointModal.style.pointerEvents =
    "auto";

  pointModalCard.style.pointerEvents =
    "auto";


  pointModal.setAttribute(
    "aria-hidden",
    "false"
  );


  positionPointModal(
    window.innerWidth / 2,
    window.innerHeight / 2
  );


  renderPoints();

}


/* =====================================================
   POSITION MODAL
===================================================== */

function positionPointModal(
  clientX,
  clientY
) {

  requestAnimationFrame(
    () => {

      const rect =
        pointModalCard.getBoundingClientRect();


      const gap =
        16;

      const padding =
        10;


      /*
        Primární pozice je vždy napravo od bodu.
        Pokud se formulář nevejde, zarovná se
        k pravému okraji viewportu, ale stále
        zůstane celý viditelný.
      */

      let left =
        clientX + gap;

      let top =
        clientY;


      if (
        left + rect.width >
        window.innerWidth - padding
      ) {

        left =
          window.innerWidth -
          rect.width -
          padding;

      }


      if (
        top + rect.height >
        window.innerHeight - padding
      ) {

        top =
          window.innerHeight -
          rect.height -
          padding;

      }


      left =
        Math.max(
          padding,
          left
        );


      top =
        Math.max(
          padding,
          top
        );


      pointModalCard.style.left =
        `${left}px`;


      pointModalCard.style.top =
        `${top}px`;

    }
  );

}



/* =====================================================
   CLOSE POINT MODAL
===================================================== */

function closePointModal() {

  pointModal.classList.add(
    "hidden"
  );


  pointModal.style.pointerEvents =
    "none";


  pointModal.setAttribute(
    "aria-hidden",
    "true"
  );


  pendingPoint =
    null;


  editingPointId =
    null;


  renderPoints();

}


/* =====================================================
   ULOŽIT BOD
===================================================== */

function savePoint() {

  if (!pendingPoint) {
    return;
  }


  const name =
    pointNameInput.value.trim();


  if (!name) {

    alert(
      "Napiš název bodu."
    );

    pointNameInput.focus();

    return;

  }


  const categoryId =
    pointCategorySelect.value;

  const selectedCategory =
    getCategory(categoryId);

  if (
    !categoryId ||
    !selectedCategory ||
    selectedCategory.name.trim().toLowerCase() === "území"
  ) {
    alert(
      "Pro vytvoření území použij tlačítko „Přidat území“."
    );
    return;
  }


  if (!categoryId) {

    alert(
      "Vyber kategorii."
    );

    return;

  }


  const description =
    pointDescriptionInput
      .value
      .trim();


  if (
    editingPointId
  ) {

    const point =
      getPoint(
        editingPointId
      );


    if (point) {

      point.name =
        name;


      point.description =
        description;


      point.categoryId =
        categoryId;


      point.color =
        selectedColor;


      point.size =
        selectedSize;

    }

  }

  else {

    points.push({

      id:
        createId(),

      x:
        pendingPoint.x,

      y:
        pendingPoint.y,

      name,

      description,

      categoryId,

      color:
        selectedColor,

      size:
        selectedSize

    });

  }


  savePoints();


  closePointModal();


  renderPoints();

  renderCategories();

}


/* =====================================================
   RENDER BODY
===================================================== */

function renderPoints() {

  pointsLayer.innerHTML =
    "";


  const visiblePoints =
    points.filter(
      point => {

        const category =
          getCategory(
            point.categoryId
          );


        return (
          category &&
          category.visible
        );

      }
    );


  const renderList =
    [...visiblePoints];


  /*
    Live preview při vytváření/editaci.
  */

  if (
    pendingPoint
  ) {

    renderList.push({

      ...pendingPoint,

      id:
        "__preview__",

      preview:
        true,

      name:
        pointNameInput.value,

      description:
        pointDescriptionInput.value,

      categoryId:
        pointCategorySelect.value,

      color:
        selectedColor,

      size:
        selectedSize

    });

  }


  renderList.forEach(
    point => {

      const category =
        getCategory(
          point.categoryId
        );


      if (!category) {
        return;
      }


      const element =
        document.createElement(
          "div"
        );


      element.className =
        "map-point";


      element.dataset.pointId =
        point.id;


      element.dataset.categoryId =
        point.categoryId;


      if (
        point.preview
      ) {

        element.dataset.preview =
          "true";


        element.classList.add(
          "map-point-preview"
        );

      }


      if (
        point.id ===
        focusedPointId
      ) {

        element.classList.add(
          "focused-point"
        );

      }


      element.style.left =
        `${point.x}%`;


      element.style.top =
        `${point.y}%`;


      const size =
        Math.max(
          2,
          Number(point.size) ||
          6
        );


      element.style.width =
        `${size}px`;


      element.style.height =
        `${size}px`;


      /*
        Barevné kolečko už není hlavní
        vizuální prvek. Zobrazuje se
        ikonka kategorie.
      */

      element.style.backgroundColor =
        point.color ||
        "#ff3b30";


      /* ---------------------------------------------
         IKONA KATEGORIE
      --------------------------------------------- */

      const icon =
        document.createElement(
          "span"
        );


      icon.className =
        "map-point-icon";


      icon.textContent =
        category.emoji ||
        "📌";


      const iconSize =
        Math.max(
          10,
          Math.min(
            size * 1.8,
            30
          )
        );


      icon.style.fontSize =
  `${Math.round(iconSize)}px`;


      element.appendChild(
        icon
      );


      /* ---------------------------------------------
         TOOLTIP
      --------------------------------------------- */

      if (
        !point.preview
      ) {

        const tooltip =
          document.createElement(
            "div"
          );


        tooltip.className =
          "point-tooltip";


        const title =
          document.createElement(
            "div"
          );


        title.className =
          "point-tooltip-title";


        title.textContent =
          point.name;


        tooltip.appendChild(
          title
        );


        if (
          point.description
        ) {

          const description =
            document.createElement(
              "div"
            );


          description.className =
            "point-tooltip-description";


          description.textContent =
            point.description;


          tooltip.appendChild(
            description
          );

        }


        element.appendChild(
          tooltip
        );


        /* -----------------------------------------
           PRAVÝ KLIK
        ----------------------------------------- */

        element.addEventListener(
          "contextmenu",
          event => {

            event.preventDefault();

            event.stopPropagation();


            openContextMenu(
              event.clientX,
              event.clientY,
              point.id
            );

          }
        );

      }


      pointsLayer.appendChild(
        element
      );

    }
  );

}


/* =====================================================
   LIVE SIZE
===================================================== */

function updatePreview() {

  selectedSize =
    Number(
      pointSizeInput.value
    ) || 6;


  pointSizeValue.textContent =
    `${selectedSize} px`;


  renderPoints();

}


/* =====================================================
   CONTEXT MENU
===================================================== */

function openContextMenu(
  clientX,
  clientY,
  pointId
) {

  contextPointId =
    pointId;


  pointContextMenu.classList.remove(
    "hidden"
  );


  const rect =
    pointContextMenu.getBoundingClientRect();


  let left =
    clientX;


  let top =
    clientY;


  if (
    left +
    rect.width >
    window.innerWidth -
    10
  ) {

    left =
      window.innerWidth -
      rect.width -
      10;

  }


  if (
    top +
    rect.height >
    window.innerHeight -
    10
  ) {

    top =
      window.innerHeight -
      rect.height -
      10;

  }


  pointContextMenu.style.left =
    `${Math.max(
      10,
      left
    )}px`;


  pointContextMenu.style.top =
    `${Math.max(
      10,
      top
    )}px`;

}


function closeContextMenu() {

  pointContextMenu.classList.add(
    "hidden"
  );


  contextPointId =
    null;

}


/* =====================================================
   CONTEXT MENU - EDIT
===================================================== */

editPointBtn.addEventListener(
  "click",
  () => {

    if (!contextPointId) {
      return;
    }


    const id =
      contextPointId;


    closeContextMenu();


    openEditPoint(
      id
    );

  }
);


/* =====================================================
   CONTEXT MENU - DELETE
===================================================== */

deletePointBtn.addEventListener(
  "click",
  () => {

    if (!contextPointId) {
      return;
    }


    const id =
      contextPointId;


    closeContextMenu();


    const point =
      getPoint(
        id
      );


    if (!point) {
      return;
    }


    if (
      !confirm(
        `Opravdu chceš smazat bod „${point.name}“?`
      )
    ) {

      return;

    }


    points =
      points.filter(
        item =>
          item.id !== id
      );


    savePoints();


    renderPoints();

    renderCategories();

  }
);


/* =====================================================
   CONTEXT MENU - CLOSE
===================================================== */

if (
  closeContextMenuBtn
) {

  closeContextMenuBtn.addEventListener(
    "click",
    () => {

      closeContextMenu();

    }
  );

}


document.addEventListener(
  "click",
  event => {

    if (
      !pointContextMenu.contains(
        event.target
      )
    ) {

      closeContextMenu();

    }

  }
);


/* =====================================================
   MAPA - MOUSE DRAG
===================================================== */

viewport.addEventListener(
  "pointerdown",
  event => {

    /*
      Pokud právě přidáváme bod,
      místo dragování umístíme bod
      až na click.
    */

    if (
      addingPoint
    ) {

      return;

    }


    /*
      Klik na ikonku bodu nesmí
      začít drag mapy.
    */

    if (
      event.target.closest(
        ".map-point"
      )
    ) {

      return;

    }


    /*
      Klik na ovládání také ne.
    */

    if (
      event.target.closest(
        ".map-controls"
      )
    ) {

      return;

    }


    dragging =
      true;


    startX =
      event.clientX;


    startY =
      event.clientY;


    startMapX =
      x;


    startMapY =
      y;


    viewport.classList.add(
      "is-dragging"
    );


    viewport.setPointerCapture(
      event.pointerId
    );

  }
);


viewport.addEventListener(
  "pointermove",
  event => {

    if (
      !dragging
    ) {

      return;

    }


    x =
      startMapX +
      (
        event.clientX -
        startX
      );


    y =
      startMapY +
      (
        event.clientY -
        startY
      );


    renderMap();

  }
);


function stopDragging(
  event
) {

  dragging =
    false;


  viewport.classList.remove(
    "is-dragging"
  );


  if (
    event &&
    viewport.hasPointerCapture(
      event.pointerId
    )
  ) {

    viewport.releasePointerCapture(
      event.pointerId
    );

  }

}


viewport.addEventListener(
  "pointerup",
  stopDragging
);


viewport.addEventListener(
  "pointercancel",
  stopDragging
);


/* =====================================================
   MAPA - KLIK PRO PŘIDÁNÍ
===================================================== */

viewport.addEventListener(
  "click",
  event => {

    if (addingTerritory) {

      addTerritoryVertex(
        event
      );

      return;
    }


    if (
      !addingPoint
    ) {

      return;

    }


    placeNewPoint(
      event
    );

  }
);


/* =====================================================
   MAPA - ZOOM
===================================================== */

viewport.addEventListener(
  "wheel",
  event => {

    event.preventDefault();


    const factor =
      event.deltaY < 0
        ? 1.12
        : 1 / 1.12;


    zoomAt(
      scale * factor,
      event.clientX,
      event.clientY
    );

  },
  {
    passive:false
  }
);


function zoomAt(
  nextScale,
  clientX,
  clientY
) {

  const rect =
    viewport.getBoundingClientRect();


  const pointerX =
    clientX -
    rect.left -
    rect.width /
    2;


  const pointerY =
    clientY -
    rect.top -
    rect.height /
    2;


  const oldScale =
    scale;


  scale =
    Math.max(
      MIN_SCALE,
      Math.min(
        MAX_SCALE,
        nextScale
      )
    );


  const ratio =
    scale /
    oldScale;


  x =
    pointerX -
    (
      pointerX -
      x
    ) *
    ratio;


  y =
    pointerY -
    (
      pointerY -
      y
    ) *
    ratio;


  renderMap();

}


/* =====================================================
   MAPA - RENDER
===================================================== */

function renderMap() {

  const transform =
    `translate3d(
      calc(-50% + ${x}px),
      calc(-50% + ${y}px),
      0
    ) scale(${scale})`;

  canvas.style.transform =
    transform;

}


/* =====================================================
   ZOOM TLAČÍTKA
===================================================== */

const zoomInBtn =
  document.getElementById(
    "zoomIn"
  );


const zoomOutBtn =
  document.getElementById(
    "zoomOut"
  );


const resetViewBtn =
  document.getElementById(
    "resetView"
  );


if (
  zoomInBtn
) {

  zoomInBtn.addEventListener(
    "click",
    () => {

      const rect =
        viewport.getBoundingClientRect();


      zoomAt(

        scale * 1.2,

        rect.left +
        rect.width / 2,

        rect.top +
        rect.height / 2

      );

    }
  );

}


if (
  zoomOutBtn
) {

  zoomOutBtn.addEventListener(
    "click",
    () => {

      const rect =
        viewport.getBoundingClientRect();


      zoomAt(

        scale / 1.2,

        rect.left +
        rect.width / 2,

        rect.top +
        rect.height / 2

      );

    }
  );

}


if (
  resetViewBtn
) {

  resetViewBtn.addEventListener(
    "click",
    () => {

      scale =
        1;


      x =
        0;


      y =
        0;


      renderMap();

    }
  );

}


/* =====================================================
   WASD
===================================================== */

function startWASD() {

  if (
    wasdAnimationId !== null
  ) {

    return;

  }


  function move() {

    let moved =
      false;


    if (
      pressedKeys.has("w")
    ) {

      y +=
        WASD_SPEED;

      moved =
        true;

    }


    if (
      pressedKeys.has("s")
    ) {

      y -=
        WASD_SPEED;

      moved =
        true;

    }


    if (
      pressedKeys.has("a")
    ) {

      x +=
        WASD_SPEED;

      moved =
        true;

    }


    if (
      pressedKeys.has("d")
    ) {

      x -=
        WASD_SPEED;

      moved =
        true;

    }


    if (
      moved
    ) {

      renderMap();

    }


    if (
      pressedKeys.size > 0
    ) {

      wasdAnimationId =
        requestAnimationFrame(
          move
        );

    }
    else {

      wasdAnimationId =
        null;

    }

  }


  wasdAnimationId =
    requestAnimationFrame(
      move
    );

}


document.addEventListener(
  "keydown",
  event => {

    const activeTag =
      document.activeElement
        ?.tagName
        ?.toLowerCase();


    /*
      WASD nechceme zachytávat
      při psaní do formuláře.
    */

    if (

      activeTag === "input" ||
      activeTag === "textarea" ||
      activeTag === "select"

    ) {

      return;

    }


    const key =
      event.key.toLowerCase();


    if (
      !["w","a","s","d"].includes(
        key
      )
    ) {

      return;

    }


    event.preventDefault();


    pressedKeys.add(
      key
    );


    startWASD();

  }
);


document.addEventListener(
  "keyup",
  event => {

    pressedKeys.delete(
      event.key.toLowerCase()
    );

  }
);


/* =====================================================
   OVLÁDÁNÍ
===================================================== */

if (
  controlsBtn &&
  controlsHelp
) {

  controlsBtn.addEventListener(
    "click",
    () => {

      const hidden =
        controlsHelp.classList.contains(
          "hidden"
        );


      if (
        hidden
      ) {

        controlsHelp.classList.remove(
          "hidden"
        );


        controlsBtn.setAttribute(
          "aria-expanded",
          "true"
        );


        controlsBtn.textContent =
          "⚙️ Skrýt ovládání";

      }

      else {

        controlsHelp.classList.add(
          "hidden"
        );


        controlsBtn.setAttribute(
          "aria-expanded",
          "false"
        );


        controlsBtn.textContent =
          "⚙️ Ovládání";

      }

    }
  );

}


/* =====================================================
   RGB
===================================================== */

function hexToRgb(
  hex
) {

  const value =
    hex.replace(
      "#",
      ""
    );


  return {

    r:
      parseInt(
        value.slice(0,2),
        16
      ),

    g:
      parseInt(
        value.slice(2,4),
        16
      ),

    b:
      parseInt(
        value.slice(4,6),
        16
      )

  };

}


function rgbToHex(
  r,
  g,
  b
) {

  return (
    "#" +

    [r,g,b]
      .map(
        value =>
          Math.round(
            value
          )
          .toString(16)
          .padStart(
            2,
            "0"
          )
      )
      .join("")
  );

}


/* =====================================================
   HSL
===================================================== */

function hslToRgb(
  h,
  s,
  l
) {

  h /= 360;


  let r;
  let g;
  let b;


  if (
    s === 0
  ) {

    r =
      l;

    g =
      l;

    b =
      l;

  }

  else {

    const hue =
      (
        p,
        q,
        t
      ) => {

        if (
          t < 0
        ) {

          t += 1;

        }


        if (
          t > 1
        ) {

          t -= 1;

        }


        if (
          t < 1/6
        ) {

          return (
            p +
            (q-p) *
            6 *
            t
          );

        }


        if (
          t < 1/2
        ) {

          return q;

        }


        if (
          t < 2/3
        ) {

          return (
            p +
            (q-p) *
            (
              2/3 -
              t
            ) *
            6
          );

        }


        return p;

      };


    const q =
      l < .5

        ? l *
          (1+s)

        : l +
          s -
          l*s;


    const p =
      2*l-q;


    r =
      hue(
        p,
        q,
        h+1/3
      );


    g =
      hue(
        p,
        q,
        h
      );


    b =
      hue(
        p,
        q,
        h-1/3
      );

  }


  return {

    r:
      Math.round(
        r*255
      ),

    g:
      Math.round(
        g*255
      ),

    b:
      Math.round(
        b*255
      )

  };

}


function rgbToHsl(
  r,
  g,
  b
) {

  r /=
    255;

  g /=
    255;

  b /=
    255;


  const max =
    Math.max(
      r,
      g,
      b
    );


  const min =
    Math.min(
      r,
      g,
      b
    );


  const l =
    (max+min) /
    2;


  let h =
    0;


  let s =
    0;


  if (
    max !== min
  ) {

    const d =
      max-min;


    s =
      l > .5

        ? d /
          (
            2-max-min
          )

        : d /
          (
            max+min
          );


    switch(max) {

      case r:

        h =
          (
            g-b
          ) /
          d +
          (
            g < b
              ? 6
              : 0
          );

        break;


      case g:

        h =
          (
            b-r
          ) /
          d +
          2;

        break;


      default:

        h =
          (
            r-g
          ) /
          d +
          4;

    }


    h /= 6;

  }


  return {

    h:
      h*360,

    s,

    l

  };

}


/* =====================================================
   SET COLOR
===================================================== */

function setColor(
  hex
) {

  const rgb =
    hexToRgb(
      hex
    );


  selectedColor =
    rgbToHex(
      rgb.r,
      rgb.g,
      rgb.b
    );


  if (redInput) redInput.value = rgb.r;


  if (greenInput) greenInput.value = rgb.g;


  if (blueInput) blueInput.value = rgb.b;


  if (colorPreview) colorPreview.style.backgroundColor = selectedColor;


  const hsl =
    rgbToHsl(
      rgb.r,
      rgb.g,
      rgb.b
    );


  wheelHue =
    hsl.h;


  wheelSaturation =
    hsl.s;


  updateWheelCursor();


  renderColorPresets();


  renderPoints();

}


/* =====================================================
   RGB -> COLOR
===================================================== */

function updateFromRgb() {

  if (!redInput || !greenInput || !blueInput) return;

  const r =
    Math.max(
      0,
      Math.min(
        255,
        Number(
          redInput.value
        ) || 0
      )
    );


  const g =
    Math.max(
      0,
      Math.min(
        255,
        Number(
          greenInput.value
        ) || 0
      )
    );


  const b =
    Math.max(
      0,
      Math.min(
        255,
        Number(
          blueInput.value
        ) || 0
      )
    );


  setColor(
    rgbToHex(
      r,
      g,
      b
    )
  );

}


/* =====================================================
   COLOR WHEEL CURSOR
===================================================== */

function updateWheelCursor() {

  if (
    !colorWheelCursor
  ) {

    return;

  }


  const rect =
    colorWheel.getBoundingClientRect();


  const radius =
    rect.width /
    2;


  const distance =
    wheelSaturation *
    radius;


  const angle =
    (
      wheelHue -
      90
    ) *
    Math.PI /
    180;


  colorWheelCursor.style.left =
    `${
      radius +
      Math.cos(angle) *
      distance
    }px`;


  colorWheelCursor.style.top =
    `${
      radius +
      Math.sin(angle) *
      distance
    }px`;

}


/* =====================================================
   COLOR WHEEL PICK
===================================================== */

function pickWheel(
  event
) {

  const rect =
    colorWheel.getBoundingClientRect();


  const centerX =
    rect.width /
    2;


  const centerY =
    rect.height /
    2;


  const dx =
    event.clientX -
    rect.left -
    centerX;


  const dy =
    event.clientY -
    rect.top -
    centerY;


  const radius =
    Math.min(
      Math.hypot(
        dx,
        dy
      ),
      rect.width /
      2
    );


  let hue =
    Math.atan2(
      dy,
      dx
    ) *
    180 /
    Math.PI +
    90;


  if (
    hue < 0
  ) {

    hue +=
      360;

  }


  wheelHue =
    hue;


  wheelSaturation =
    radius /
    (
      rect.width /
      2
    );


  const rgb =
    hslToRgb(
      hue,
      wheelSaturation,
      .5
    );


  selectedColor =
    rgbToHex(
      rgb.r,
      rgb.g,
      rgb.b
    );


  if (redInput) redInput.value = rgb.r;


  if (greenInput) greenInput.value = rgb.g;


  if (blueInput) blueInput.value = rgb.b;


  colorPreview.style.backgroundColor =
    selectedColor;


  colorWheelCursor.style.left =
    `${
      event.clientX -
      rect.left
    }px`;


  colorWheelCursor.style.top =
    `${
      event.clientY -
      rect.top
    }px`;


  renderColorPresets();


  renderPoints();

}


if (
  colorWheel
) {

  colorWheel.addEventListener(
    "pointerdown",
    event => {

      colorWheelDragging =
        true;


      colorWheel.setPointerCapture(
        event.pointerId
      );


      pickWheel(
        event
      );

    }
  );


  colorWheel.addEventListener(
    "pointermove",
    event => {

      if (
        colorWheelDragging
      ) {

        pickWheel(
          event
        );

      }

    }
  );


  colorWheel.addEventListener(
    "pointerup",
    () => {

      colorWheelDragging =
        false;

    }
  );


  colorWheel.addEventListener(
    "pointercancel",
    () => {

      colorWheelDragging =
        false;

    }
  );

}


/* =====================================================
   PRESETY BAREV
===================================================== */

function renderColorPresets() {

  if (
    !colorPresets
  ) {

    return;

  }


  colorPresets.innerHTML =
    "";


  COLOR_PRESETS.forEach(
    color => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "color-preset";


      button.style.backgroundColor =
        color;


      if (
        color.toLowerCase() ===
        selectedColor.toLowerCase()
      ) {

        button.classList.add(
          "selected"
        );

      }


      button.addEventListener(
        "click",
        event => {

          event.preventDefault();


          setColor(
            color
          );

        }
      );


      colorPresets.appendChild(
        button
      );

    }
  );

}


/* =====================================================
   EVENTY
===================================================== */

addCategoryBtn.addEventListener(
  "click",
  openCategoryModal
);


toggleAllBtn.addEventListener(
  "click",
  toggleAllCategories
);


saveCategoryBtn.addEventListener(
  "click",
  addCategory
);


cancelCategoryBtn.addEventListener(
  "click",
  closeCategoryModal
);


closeCategoryBtn.addEventListener(
  "click",
  closeCategoryModal
);


if (addTerritoryBtn) {
  addTerritoryBtn.addEventListener(
    "click",
    startTerritoryMode
  );
}


addPointBtn.addEventListener(
  "click",
  startPointMode
);


savePointBtn.addEventListener(
  "click",
  savePoint
);


cancelPointBtn.addEventListener(
  "click",
  closePointModal
);


closePointBtn.addEventListener(
  "click",
  closePointModal
);


pointSizeInput.addEventListener(
  "input",
  updatePreview
);


pointNameInput.addEventListener(
  "input",
  renderPoints
);


pointDescriptionInput.addEventListener(
  "input",
  renderPoints
);


pointCategorySelect.addEventListener(
  "change",
  renderPoints
);


if (redInput) { redInput.addEventListener("input", updateFromRgb); }


if (greenInput) { greenInput.addEventListener("input", updateFromRgb); }


if (blueInput) { blueInput.addEventListener("input", updateFromRgb); }


/* =====================================================
   ESC
===================================================== */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {

      return;

    }


    closeContextMenu();


    if (
      !pointModal.classList.contains(
        "hidden"
      )
    ) {

      closePointModal();

    }


    if (
      !categoryModal.classList.contains(
        "hidden"
      )
    ) {

      closeCategoryModal();

    }


    if (
      addingPoint
    ) {

      stopPointMode();

    }


    if (
      addingTerritory
    ) {

      stopTerritoryMode();

    }


    if (
      territoryFormOpen
    ) {

      closeTerritoryModal();

    }

  }
);


/* =====================================================
   INIT
===================================================== */

renderCategories();

renderCategoryEmojiPresets();

renderCategorySelect();

renderPoints();

renderColorPresets();

updatePreview();

ensureTerritoryLayer();

renderMap();

/* =====================================================
   MAPA - NAČTENÍ PŘED ZOBRAZENÍM
===================================================== */

if (mapImage) {

  mapImage.decoding = "sync";

  if (mapImage.complete) {

    renderMap();

  } else {

    mapImage.addEventListener(
      "load",
      () => {

        renderMap();

      },
      {
        once: true
      }
    );

  }

}

/* =====================================================
   PRVNÍ OSTRÉ VYKRESLENÍ
===================================================== */

function sharpenInitialRender() {

  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      renderMap();

      if (pointsLayer) {

        pointsLayer
          .querySelectorAll(".map-point-icon")
          .forEach(icon => {

            void icon.offsetWidth;

          });

      }

    });

  });

}


if (document.fonts && document.fonts.ready) {

  document.fonts.ready.then(() => {

    sharpenInitialRender();

  });

}
else {

  window.addEventListener(
    "load",
    sharpenInitialRender,
    {
      once:true
    }
  );

}
