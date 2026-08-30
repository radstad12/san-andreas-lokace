const viewport = document.getElementById("mapViewport");
const canvas = document.getElementById("mapCanvas");
const mapImage = document.getElementById("mapImage");
const pointsLayer = document.getElementById("pointsLayer");

const categoryList = document.getElementById("categoryList");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const toggleAllBtn = document.getElementById("toggleAllBtn");

const addPointBtn = document.getElementById("addPointBtn");
const pointModeHint = document.getElementById("pointModeHint");

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

const colorWheel = document.getElementById("colorWheel");
const colorWheelCursor = document.getElementById("colorWheelCursor");
const colorPresets = document.getElementById("colorPresets");
const colorPreview = document.getElementById("colorPreview");

const redInput = document.getElementById("redInput");
const greenInput = document.getElementById("greenInput");
const blueInput = document.getElementById("blueInput");

const categoryModal = document.getElementById("categoryModal");
const categoryNameInput = document.getElementById("categoryName");
const closeCategoryBtn = document.getElementById("closeCategoryBtn");
const cancelCategoryBtn = document.getElementById("cancelCategoryBtn");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");

const pointContextMenu = document.getElementById("pointContextMenu");
const editPointBtn = document.getElementById("editPointBtn");
const deletePointBtn = document.getElementById("deletePointBtn");
const closeContextMenuBtn = document.getElementById("closeContextMenuBtn");
const categoryEmojiInput = document.getElementById("categoryEmoji");
const categoryEmojiPresets = document.getElementById("categoryEmojiPresets");

const controlsBtn = document.getElementById("controlsBtn");
const controlsHelp = document.getElementById("controlsHelp");


/* =====================================================
   MAPA
===================================================== */

let scale = 1;
let x = 0;
let y = 0;

const MIN_SCALE = 0.45;
const MAX_SCALE = 10;

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
   FOCUS
===================================================== */

let focusedPointId = null;
let focusedPointTimer = null;


/* =====================================================
   CONTEXT MENU
===================================================== */

let contextPointId = null;


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
  "📌", "🗺️", "🏠", "🏢", "💊", "🚗", "🏍️", "🔫", "💰", "📦", "⭐", "⚠️", "🔥", "☠️", "👑", "🎯", "🛡️", "🚩", "📍", "🔵", "🟢", "🔴"
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
   DATA
===================================================== */

let categories = loadData(
  "verdugosCategories",
  DEFAULT_CATEGORIES
);

let points = loadData(
  "verdugosPoints",
  []
);


/* =====================================================
   STORAGE
===================================================== */

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    const data = JSON.parse(raw);

    return Array.isArray(data)
      ? data
      : fallback;

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
   KATEGORIE
===================================================== */

categories = categories.map(category => ({
  id: category.id || createId(),
  name: category.name || "Bez názvu",
  emoji: category.emoji || "📌",
  visible: category.visible !== false
}));

saveCategories();


function getCategory(id) {
  return categories.find(
    category => category.id === id
  );
}


function countPoints(categoryId) {
  return points.filter(
    point => point.categoryId === categoryId
  ).length;
}


function categoryLabel(category) {
  return `${category.emoji || "📌"} ${category.name}`;
}


/* =====================================================
   RENDER KATEGORIÍ
===================================================== */

function renderCategories() {

  categoryList.innerHTML = "";


  categories.forEach(category => {

    const wrap = document.createElement("div");
    wrap.className = "category-wrap";


    const item = document.createElement("div");
    item.className = "category-item";


    if (!category.visible) {
      item.classList.add("hidden-category");
    }


    const emoji = document.createElement("span");
    emoji.className = "category-emoji";
    emoji.textContent = category.emoji || "📌";


    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = category.name;


    const count = document.createElement("span");
    count.className = "category-count";
    count.textContent = countPoints(category.id);


    const state = document.createElement("span");
    state.className = "category-state";
    state.textContent = category.visible
      ? "zobrazeno"
      : "skryto";


    item.append(
      emoji,
      name,
      count,
      state
    );


    /* -----------------------------------------------
       HOVER NA KATEGORII
       => pulsují všechny body v kategorii
    ------------------------------------------------ */

    item.addEventListener(
      "mouseenter",
      () => {
        highlightCategory(category.id);
      }
    );


    item.addEventListener(
      "mouseleave",
      () => {
        unhighlightCategory(category.id);
      }
    );


    /* -----------------------------------------------
       KLIK
    ------------------------------------------------ */

    item.addEventListener(
      "click",
      () => {

        category.visible =
          !category.visible;

        saveCategories();

        renderCategories();
        renderPoints();

      }
    );


    /* -----------------------------------------------
       PRAVÝ KLIK
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


    wrap.appendChild(item);


    /* =================================================
       PODBODY
    ================================================= */

    const children =
      document.createElement("div");

    children.className =
      "category-points";


    points
      .filter(
        point =>
          point.categoryId ===
          category.id
      )
      .forEach(point => {

        const child =
          document.createElement("div");

        child.className =
          "category-point";

        child.title =
          "Klik = zvýraznit bod a zobrazit tooltip";


        const dot =
          document.createElement("span");

        dot.className =
          "category-point-dot";

        dot.style.backgroundColor =
          point.color ||
          "#ff3b30";


        const text =
          document.createElement("span");

        text.className =
          "category-point-name";

        text.textContent =
          point.name;


        child.append(
          dot,
          text
        );


        /* ---------------------------------------------
           HOVER PODBODU
           NIC NEDĚLÁ
        --------------------------------------------- */


        /* ---------------------------------------------
           KLIK PODBODU
           => zvýraznění + tooltip
        --------------------------------------------- */

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


        /* ---------------------------------------------
           PRAVÝ KLIK PODBODU
        --------------------------------------------- */

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


        children.appendChild(child);

      });


    if (
      children.children.length > 0
    ) {

      wrap.appendChild(children);

    }


    categoryList.appendChild(wrap);

  });


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
        visible: !allVisible
      })
    );


  saveCategories();

  renderCategories();
  renderPoints();
}


/* =====================================================
   CATEGORY PULS
===================================================== */

function highlightCategory(
  categoryId
) {

  const elements =
    pointsLayer.querySelectorAll(
      `[data-category-id="${categoryId}"]`
    );


  elements.forEach(
    element => {

      if (
        element.dataset.preview === "true"
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

  const elements =
    pointsLayer.querySelectorAll(
      `[data-category-id="${categoryId}"]`
    );


  elements.forEach(
    element => {

      element.classList.remove(
        "category-hover-point"
      );

    }
  );

}


/* =====================================================
   FOCUS JEDNOHO BODU
===================================================== */

function highlightPoint(
  id,
  persistent = false
) {

  focusedPointId =
    id;


  clearTimeout(
    focusedPointTimer
  );


  /*
    Zrušíme předchozí highlighty.
  */

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


  element.classList.add(
    "focused-point"
  );


  if (persistent) {

    focusedPointTimer =
      setTimeout(
        () => {

          element.classList.remove(
            "focused-point"
          );

          if (
            focusedPointId === id
          ) {

            focusedPointId = null;

          }

        },
        4000
      );

  }
  else {

    focusedPointTimer =
      setTimeout(
        () => {

          element.classList.remove(
            "focused-point"
          );

        },
        400
      );

  }

}


/* =====================================================
   SMAZAT KATEGORII
===================================================== */

function deleteCategory(id) {

  const category =
    getCategory(id);


  if (!category) {
    return;
  }


  const amount =
    countPoints(id);


  let message =
    `Opravdu chceš smazat kategorii „${category.name}“?`;


  if (amount > 0) {

    message +=
      `\n\nObsahuje ${amount} bodů. Ty budou také odstraněny.`;

  }


  if (
    !confirm(message)
  ) {
    return;
  }


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


  saveCategories();
  savePoints();

  renderCategories();
  renderPoints();

}


/* =====================================================
   CATEGORY MODAL
===================================================== */

function openCategoryModal() {

  closeContextMenu();


  categoryNameInput.value =
    "";


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


  const duplicate =
    categories.some(
      category =>
        category.name.toLowerCase() ===
        name.toLowerCase()
    );


  if (duplicate) {

    alert(
      "Tato kategorie už existuje."
    );

    return;

  }


  const emoji = (categoryEmojiInput?.value.trim() || "📌").slice(0, 2);


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


function renderCategoryEmojiPresets() {
  if (!categoryEmojiPresets || !categoryEmojiInput) return;
  categoryEmojiPresets.innerHTML = "";
  CATEGORY_ICON_PRESETS.forEach(emoji => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-emoji-preset";
    button.textContent = emoji;
    button.title = `Použít ${emoji}`;
    button.addEventListener("click", () => { categoryEmojiInput.value = emoji; });
    categoryEmojiPresets.appendChild(button);
  });
}


/* =====================================================
   POINT MODE
===================================================== */

function startPointMode() {

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
   POINT MODAL - NOVÝ
===================================================== */

function openPointModalAt(
  clientX,
  clientY
) {

  editingPointId =
    null;


  pendingPoint =
    pendingPoint;


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


  setColor(
    "#ff3b30"
  );


  pointCategorySelect.value =
    categories[0]?.id || "";


  pointModal.classList.remove(
    "hidden"
  );


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
   POINT MODAL - EDITACE
===================================================== */

function openEditPoint(
  id
) {

  const point =
    points.find(
      item =>
        item.id === id
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
    Number(point.size) || 6;


  pointSizeInput.value =
    selectedSize;


  pointSizeValue.textContent =
    `${selectedSize} px`;


  setColor(
    point.color ||
    "#ff3b30"
  );


  pointModal.classList.remove(
    "hidden"
  );


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
   SELECT
===================================================== */

function renderCategorySelect() {

  pointCategorySelect.innerHTML =
    "";


  categories.forEach(
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
   MODAL POSITION
===================================================== */

function positionPointModal(
  clientX,
  clientY
) {

  requestAnimationFrame(
    () => {

      const rect =
        pointModalCard.getBoundingClientRect();


      let left =
        clientX +
        16;


      let top =
        clientY +
        16;


      if (
        left +
        rect.width >
        window.innerWidth -
        10
      ) {

        left =
          clientX -
          rect.width -
          16;

      }


      if (
        top +
        rect.height >
        window.innerHeight -
        10
      ) {

        top =
          clientY -
          rect.height -
          16;

      }


      left =
        Math.max(
          10,
          Math.min(
            left,
            window.innerWidth -
            rect.width -
            10
          )
        );


      top =
        Math.max(
          10,
          Math.min(
            top,
            window.innerHeight -
            rect.height -
            10
          )
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
   ULOŽENÍ BODU
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


  if (editingPointId) {

    const point =
      points.find(
        item =>
          item.id ===
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
      point =>
        getCategory(
          point.categoryId
        )?.visible
    );


  const list =
    [...visiblePoints];


  /*
    LIVE PREVIEW
  */

  if (pendingPoint) {

    list.push({

      ...pendingPoint,

      id:
        "__preview__",

      name:
        pointNameInput.value,

      description:
        pointDescriptionInput.value,

      categoryId:
        pointCategorySelect.value,

      color:
        selectedColor,

      size:
        selectedSize,

      preview:
        true

    });

  }


  list.forEach(
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
          Number(
            point.size
          ) || 6
        );


      element.style.width =
        `${size}px`;


      element.style.height =
        `${size}px`;


      element.style.backgroundColor =
        point.color ||
        "#ff3b30";


      /*
        EMOJI
      */

      if (
        category.emoji
      ) {

        const emoji =
          document.createElement(
            "span"
          );


        emoji.className =
          "map-point-emoji";


        emoji.textContent =
          category.emoji;


        const emojiSize =
          Math.max(
            2,
            Math.min(
              size * 0.75,
              10
            )
          );


        emoji.style.fontSize =
          `${emojiSize}px`;


        element.appendChild(
          emoji
        );

      }


      /*
        TOOLTIP
      */

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


        /*
          PRAVÝ KLIK
        */

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
   LIVE SIZE PREVIEW
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
   EDIT
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
   DELETE
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
      points.find(
        item =>
          item.id === id
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


if (closeContextMenuBtn) {
  closeContextMenuBtn.addEventListener("click", closeContextMenu);
}


/* =====================================================
   KLIK MIMO CONTEXT MENU
===================================================== */

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
   MAP CLICK
===================================================== */

viewport.addEventListener(
  "click",
  event => {

    if (!addingPoint) {
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


    const mapX =
      event.clientX -
      rect.left;


    const mapY =
      event.clientY -
      rect.top;


    pendingPoint = {

      x:
        mapX /
        rect.width *
        100,

      y:
        mapY /
        rect.height *
        100,

      clientX:
        event.clientX,

      clientY:
        event.clientY

    };


    stopPointMode();


    renderPoints();


    openPointModalAt(
      event.clientX,
      event.clientY
    );

  }
);


/* =====================================================
   MYŠ - DRAG
===================================================== */

viewport.addEventListener(
  "pointerdown",
  event => {

    if (addingPoint) {
      return;
    }


    /*
      Klik na bod nesmí
      tahat mapu.
    */

    if (
      event.target.closest(
        ".map-point"
      ) ||
      event.target.closest(
        ".point-tooltip"
      ) ||
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

    if (!dragging) {
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


viewport.addEventListener(
  "pointerup",
  stopDragging
);


viewport.addEventListener(
  "pointercancel",
  stopDragging
);


function stopDragging(event) {

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


/* =====================================================
   ZOOM
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
    rect.width / 2;


  const pointerY =
    clientY -
    rect.top -
    rect.height / 2;


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
   TLAČÍTKA ZOOMU
===================================================== */

document
  .getElementById("zoomIn")
  .addEventListener(
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


document
  .getElementById("zoomOut")
  .addEventListener(
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


document
  .getElementById("resetView")
  .addEventListener(
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


    if (moved) {

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

    const tag =
      document.activeElement
        ?.tagName
        ?.toLowerCase();


    if (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select"
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


      if (hidden) {

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

function hexToRgb(hex) {

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
          Math.round(value)
            .toString(16)
            .padStart(2,"0")
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
        : l+s-l*s;


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
      Math.round(r*255),

    g:
      Math.round(g*255),

    b:
      Math.round(b*255)

  };

}


function rgbToHsl(
  r,
  g,
  b
) {

  r /= 255;
  g /= 255;
  b /= 255;


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
    (max+min) / 2;


  let h = 0;
  let s = 0;


  if (
    max !== min
  ) {

    const d =
      max-min;


    s =
      l > .5
        ? d /
          (
            2 -
            max -
            min
          )
        : d /
          (
            max +
            min
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
   NASTAVIT BARVU
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


  redInput.value =
    rgb.r;


  greenInput.value =
    rgb.g;


  blueInput.value =
    rgb.b;


  colorPreview.style.backgroundColor =
    selectedColor;


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
   RGB INPUT
===================================================== */

function updateFromRgb() {

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
   COLOR WHEEL
===================================================== */

function updateWheelCursor() {

  if (!colorWheelCursor) {
    return;
  }


  const rect =
    colorWheel.getBoundingClientRect();


  const radius =
    rect.width / 2;


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


function pickWheel(event) {

  const rect =
    colorWheel.getBoundingClientRect();


  const centerX =
    rect.width / 2;


  const centerY =
    rect.height / 2;


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
      rect.width / 2
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
      rect.width / 2
    );


  const rgb =
    hslToRgb(
      hue,
      wheelSaturation,
      .5
    );


  const color =
    rgbToHex(
      rgb.r,
      rgb.g,
      rgb.b
    );


  selectedColor =
    color;


  redInput.value =
    rgb.r;


  greenInput.value =
    rgb.g;


  blueInput.value =
    rgb.b;


  colorPreview.style.backgroundColor =
    color;


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


/* =====================================================
   PRESETY
===================================================== */

function renderColorPresets() {

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
        () => {

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
   MODAL KATEGORIE EVENTY
===================================================== */

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


/* =====================================================
   BOD EVENTY
===================================================== */

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

redInput.addEventListener(
  "input",
  updateFromRgb
);

greenInput.addEventListener(
  "input",
  updateFromRgb
);

blueInput.addEventListener(
  "input",
  updateFromRgb
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


/* =====================================================
   CATEGORY EVENTY
===================================================== */

addCategoryBtn.addEventListener(
  "click",
  openCategoryModal
);

toggleAllBtn.addEventListener(
  "click",
  toggleAllCategories
);


/* =====================================================
   ESC
===================================================== */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
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

  }
);


/* =====================================================
   START
===================================================== */

renderCategories();

renderPoints();

renderColorPresets();

setColor(
  "#ff3b30"
);

updatePreview();

renderMap();
