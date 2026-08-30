const viewport = document.getElementById('mapViewport');
const canvas = document.getElementById('mapCanvas');

const categoryList = document.getElementById('categoryList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const toggleAllBtn = document.getElementById('toggleAllBtn');

const addPointBtn = document.getElementById('addPointBtn');
const pointModeHint = document.getElementById('pointModeHint');
const pointsLayer = document.getElementById('pointsLayer');
const mapImage = document.getElementById('mapImage');

const pointModal = document.getElementById('pointModal');
const closePointBtn = document.getElementById('closePointBtn');
const cancelPointBtn = document.getElementById('cancelPointBtn');
const savePointBtn = document.getElementById('savePointBtn');

const pointNameInput = document.getElementById('pointName');
const pointDescriptionInput = document.getElementById('pointDescription');
const pointCategorySelect = document.getElementById('pointCategory');

const colorPresets = document.getElementById('colorPresets');
const redInput = document.getElementById('redInput');
const greenInput = document.getElementById('greenInput');
const blueInput = document.getElementById('blueInput');
const colorPreview = document.getElementById('colorPreview');

const categoryModal = document.getElementById('categoryModal');
const categoryNameInput = document.getElementById('categoryName');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');


// ========================================
// MAPA
// ========================================

let scale = 1;
let x = 0;
let y = 0;

let dragging = false;

let startX = 0;
let startY = 0;

let startMapX = 0;
let startMapY = 0;

const MIN_SCALE = 0.45;
const MAX_SCALE = 10;


// ========================================
// BODY
// ========================================

const COLOR_PRESETS = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#007aff'
];

let addingPoint = false;
let pendingPoint = null;
let selectedColor = COLOR_PRESETS[0];


// ========================================
// ID
// ========================================

function createId() {
  return (
    Date.now().toString() +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


// ========================================
// VÝCHOZÍ KATEGORIE
// ========================================

const DEFAULT_CATEGORIES = [
  {
    id: createId(),
    name: '🗺️ Území',
    visible: true
  },
  {
    id: createId(),
    name: '💊 Prodej drog',
    visible: true
  },
  {
    id: createId(),
    name: '🚗 Záterasy autem',
    visible: true
  },
  {
    id: createId(),
    name: '🏍️ Ujíždění na motorce',
    visible: true
  }
];


// ========================================
// NAČTENÍ KATEGORIÍ
// ========================================

function loadCategories() {
  try {

    const saved =
      localStorage.getItem(
        'verdugosCategories'
      );

    if (!saved) {
      return DEFAULT_CATEGORIES;
    }

    const parsed =
      JSON.parse(saved);

    if (
      !Array.isArray(parsed)
    ) {
      return DEFAULT_CATEGORIES;
    }

    return parsed;

  } catch (error) {

    console.error(
      'Chyba při načítání kategorií:',
      error
    );

    return DEFAULT_CATEGORIES;
  }
}


let categories =
  loadCategories();


// ========================================
// NAČTENÍ BODŮ
// ========================================

function loadPoints() {
  try {

    const saved =
      localStorage.getItem(
        'verdugosPoints'
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed;

  } catch (error) {

    console.error(
      'Chyba při načítání bodů:',
      error
    );

    return [];
  }
}


let points =
  loadPoints();


// ========================================
// ULOŽENÍ KATEGORIÍ
// ========================================

function saveCategories() {

  localStorage.setItem(
    'verdugosCategories',
    JSON.stringify(categories)
  );

}


// ========================================
// ULOŽENÍ BODŮ
// ========================================

function savePoints() {

  localStorage.setItem(
    'verdugosPoints',
    JSON.stringify(points)
  );

}


// ========================================
// MIGRACE STARÝCH NÁZVŮ
// ========================================

function normalizeCategoryName(name) {

  const map = {
    'Území': '🗺️ Území',
    'Prodej drog': '💊 Prodej drog',
    'Záterasy autem': '🚗 Záterasy autem',
    'Ujíždění na motorce':
      '🏍️ Ujíždění na motorce'
  };

  return map[name] || name;
}


function migrateCategoryNames() {

  let changed = false;

  categories =
    categories.map(
      (category) => {

        const nextName =
          normalizeCategoryName(
            category.name
          );

        if (
          nextName !==
          category.name
        ) {

          changed = true;

          return {
            ...category,
            name: nextName
          };
        }

        return category;

      }
    );


  if (changed) {
    saveCategories();
  }
}


// ========================================
// POČET BODŮ V KATEGORII
// ========================================

function countPoints(categoryId) {

  return points.filter(
    (point) =>
      point.categoryId ===
      categoryId
  ).length;

}


// ========================================
// VYKRESLENÍ KATEGORIÍ
// ========================================

function renderCategories() {

  categoryList.innerHTML = '';


  categories.forEach(
    (category) => {

      const item =
        document.createElement(
          'div'
        );


      item.className =
        'category-item';


      if (
        !category.visible
      ) {

        item.classList.add(
          'hidden-category'
        );

      }


      item.dataset.id =
        category.id;


      item.title =
        'Levý klik = zobrazit/skrýt • Pravý klik = smazat';


      const icon =
        document.createElement(
          'span'
        );

      icon.className =
        'category-icon';


      const name =
        document.createElement(
          'span'
        );

      name.className =
        'category-name';

      name.textContent =
        category.name;


      const count =
        document.createElement(
          'span'
        );

      count.className =
        'category-count';

      count.textContent =
        countPoints(
          category.id
        );


      const state =
        document.createElement(
          'span'
        );

      state.className =
        'category-state';

      state.textContent =
        category.visible
          ? 'zobrazeno'
          : 'skryto';


      item.appendChild(
        icon
      );

      item.appendChild(
        name
      );

      item.appendChild(
        count
      );

      item.appendChild(
        state
      );


      // --------------------------------
      // LEVÝ KLIK
      // --------------------------------

      item.addEventListener(
        'click',
        () => {

          category.visible =
            !category.visible;

          saveCategories();

          renderCategories();

          renderPoints();

        }
      );


      // --------------------------------
      // PRAVÝ KLIK
      // --------------------------------

      item.addEventListener(
        'contextmenu',
        (event) => {

          event.preventDefault();


          const categoryPointCount =
            countPoints(
              category.id
            );


          let message =
            `Opravdu chceš smazat kategorii „${category.name}“?`;


          if (
            categoryPointCount > 0
          ) {

            message +=
              `\n\nTato kategorie obsahuje ${categoryPointCount} bodů. Ty budou také odstraněny.`;

          }


          const confirmed =
            window.confirm(
              message
            );


          if (!confirmed) {
            return;
          }


          categories =
            categories.filter(
              (item) =>
                item.id !==
                category.id
            );


          points =
            points.filter(
              (point) =>
                point.categoryId !==
                category.id
            );


          saveCategories();

          savePoints();

          renderCategories();

          renderPoints();

        }
      );


      categoryList.appendChild(
        item
      );

    }
  );


  updateToggleAllButton();

}


// ========================================
// SKRÝT / ZOBRAZIT VŠE
// ========================================

function updateToggleAllButton() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      (category) =>
        category.visible
    );


  toggleAllBtn.textContent =
    allVisible
      ? 'Skrýt vše'
      : 'Zobrazit vše';

}


function toggleAllCategories() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      (category) =>
        category.visible
    );


  categories =
    categories.map(
      (category) => {

        return {
          ...category,
          visible:
            !allVisible
        };

      }
    );


  saveCategories();

  renderCategories();

  renderPoints();

}


// ========================================
// KATEGORIE - SELECT V FORMULÁŘI
// ========================================

function renderCategorySelect() {

  pointCategorySelect.innerHTML = '';


  categories.forEach(
    (category) => {

      const option =
        document.createElement(
          'option'
        );


      option.value =
        category.id;


      option.textContent =
        category.name;


      pointCategorySelect.appendChild(
        option
      );

    }
  );

}


// ========================================
// PŘIDAT KATEGORII
// ========================================

function openCategoryModal() {

  categoryModal.classList.remove(
    'hidden'
  );

  categoryModal.setAttribute(
    'aria-hidden',
    'false'
  );

  categoryNameInput.value =
    '';

  categoryNameInput.focus();

}


function closeCategoryModal() {

  categoryModal.classList.add(
    'hidden'
  );

  categoryModal.setAttribute(
    'aria-hidden',
    'true'
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
      (category) =>
        category.name
          .toLowerCase() ===
        name.toLowerCase()
    );


  if (duplicate) {

    window.alert(
      'Kategorie s tímto názvem už existuje.'
    );

    return;
  }


  categories.push({

    id:
      createId(),

    name:
      name,

    visible:
      true

  });


  saveCategories();

  renderCategories();

  closeCategoryModal();

}


// ========================================
// SMAZÁNÍ KATEGORIE
// ========================================

function confirmDeleteCategory(id) {

  const category =
    categories.find(
      (item) =>
        item.id === id
    );


  if (!category) {
    return;
  }


  const confirmed =
    window.confirm(
      `Opravdu chceš smazat kategorii „${category.name}“?`
    );


  if (!confirmed) {
    return;
  }


  categories =
    categories.filter(
      (item) =>
        item.id !== id
    );


  points =
    points.filter(
      (point) =>
        point.categoryId !== id
    );


  saveCategories();

  savePoints();

  renderCategories();

  renderPoints();

}


// ========================================
// BARVY
// ========================================

function renderColorPresets() {

  colorPresets.innerHTML = '';


  COLOR_PRESETS.forEach(
    (color) => {

      const button =
        document.createElement(
          'button'
        );


      button.type =
        'button';


      button.className =
        'color-preset';


      button.style.backgroundColor =
        color;


      button.title =
        color;


      if (
        color.toLowerCase() ===
        selectedColor.toLowerCase()
      ) {

        button.classList.add(
          'selected'
        );

      }


      button.addEventListener(
        'click',
        () => {

          selectedColor =
            color;


          setRgbFromHex(
            color
          );


          updateColorPreview();

          renderColorPresets();

        }
      );


      colorPresets.appendChild(
        button
      );

    }
  );

}


// ========================================
// HEX / RGB
// ========================================

function hexToRgb(hex) {

  const clean =
    hex.replace(
      '#',
      ''
    );


  return {

    r:
      parseInt(
        clean.slice(0, 2),
        16
      ),

    g:
      parseInt(
        clean.slice(2, 4),
        16
      ),

    b:
      parseInt(
        clean.slice(4, 6),
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
    '#' +

    [r, g, b]
      .map(
        (value) =>
          Number(value)
            .toString(16)
            .padStart(2, '0')
      )
      .join('')
  );

}


function clampColor(value) {

  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {

    return 0;

  }


  return Math.max(
    0,
    Math.min(
      255,
      Math.round(number)
    )
  );

}


function setRgbFromHex(hex) {

  const rgb =
    hexToRgb(hex);


  redInput.value =
    rgb.r;

  greenInput.value =
    rgb.g;

  blueInput.value =
    rgb.b;

}


function updateColorFromRgb() {

  const r =
    clampColor(
      redInput.value
    );


  const g =
    clampColor(
      greenInput.value
    );


  const b =
    clampColor(
      blueInput.value
    );


  redInput.value =
    r;

  greenInput.value =
    g;

  blueInput.value =
    b;


  selectedColor =
    rgbToHex(
      r,
      g,
      b
    );


  updateColorPreview();

  renderColorPresets();

}


function updateColorPreview() {

  colorPreview.style.backgroundColor =
    selectedColor;

}


// ========================================
// REŽIM PŘIDÁNÍ BODU
// ========================================

function startPointMode() {

  if (
    categories.length === 0
  ) {

    alert(
      'Nejdříve vytvoř alespoň jednu kategorii.'
    );

    return;

  }


  addingPoint =
    true;


  viewport.classList.add(
    'add-point-mode'
  );


  pointModeHint.classList.remove(
    'hidden'
  );


  addPointBtn.classList.add(
    'active'
  );

}


function stopPointMode() {

  addingPoint =
    false;


  viewport.classList.remove(
    'add-point-mode'
  );


  pointModeHint.classList.add(
    'hidden'
  );


  addPointBtn.classList.remove(
    'active'
  );

}


// ========================================
// OTEVŘENÍ FORMULÁŘE BODU
// ========================================

function openPointModal() {

  renderCategorySelect();

  renderColorPresets();

  setRgbFromHex(
    selectedColor
  );

  updateColorPreview();


  pointNameInput.value =
    '';

  pointDescriptionInput.value =
    '';


  if (
    categories.length > 0
  ) {

    pointCategorySelect.value =
      categories[0].id;

  }


  pointModal.classList.remove(
    'hidden'
  );


  pointModal.setAttribute(
    'aria-hidden',
    'false'
  );


  pointNameInput.focus();

}


// ========================================
// ZAVŘENÍ FORMULÁŘE
// ========================================

function closePointModal() {

  pointModal.classList.add(
    'hidden'
  );


  pointModal.setAttribute(
    'aria-hidden',
    'true'
  );


  pendingPoint =
    null;

}


// ========================================
// KLIK NA MAPU PŘI PŘIDÁVÁNÍ
// ========================================

function handleMapPointPlacement(event) {

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


  const relativeX =
    event.clientX -
    rect.left;


  const relativeY =
    event.clientY -
    rect.top;


  pendingPoint = {

    x:
      (relativeX / rect.width) *
      100,

    y:
      (relativeY / rect.height) *
      100

  };


  stopPointMode();

  openPointModal();

}


// ========================================
// ULOŽENÍ BODU
// ========================================

function savePoint() {

  const name =
    pointNameInput.value.trim();


  if (!name) {

    alert(
      'Napiš název bodu.'
    );

    pointNameInput.focus();

    return;

  }


  if (!pendingPoint) {

    closePointModal();

    return;

  }


  const description =
    pointDescriptionInput.value.trim();


  const categoryId =
    pointCategorySelect.value;


  if (!categoryId) {

    alert(
      'Vyber kategorii.'
    );

    return;

  }


  points.push({

    id:
      createId(),

    x:
      pendingPoint.x,

    y:
      pendingPoint.y,

    name:
      name,

    description:
      description,

    categoryId:
      categoryId,

    color:
      selectedColor

  });


  savePoints();

  renderPoints();

  renderCategories();

  closePointModal();

}


// ========================================
// VYKRESLENÍ BODŮ
// ========================================

function renderPoints() {

  pointsLayer.innerHTML = '';


  points.forEach(
    (point) => {

      const category =
        categories.find(
          (item) =>
            item.id ===
            point.categoryId
        );


      if (!category) {
        return;
      }


      if (
        !category.visible
      ) {

        return;

      }


      const pointElement =
        document.createElement(
          'div'
        );


      pointElement.className =
        'map-point';


      pointElement.style.left =
        `${point.x}%`;


      pointElement.style.top =
        `${point.y}%`;


      pointElement.style.backgroundColor =
        point.color ||
        '#ff3b30';


      const tooltip =
        document.createElement(
          'div'
        );


      tooltip.className =
        'point-tooltip';


      const title =
        document.createElement(
          'div'
        );


      title.className =
        'point-tooltip-title';


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
            'div'
          );


        description.className =
          'point-tooltip-description';


        description.textContent =
          point.description;


        tooltip.appendChild(
          description
        );

      }


      pointElement.appendChild(
        tooltip
      );


      pointsLayer.appendChild(
        pointElement
      );

    }
  );

}


// ========================================
// EVENTY - KATEGORIE
// ========================================

addCategoryBtn.addEventListener(
  'click',
  openCategoryModal
);


toggleAllBtn.addEventListener(
  'click',
  toggleAllCategories
);


cancelCategoryBtn.addEventListener(
  'click',
  closeCategoryModal
);


saveCategoryBtn.addEventListener(
  'click',
  addCategory
);


// ========================================
// EVENTY - BODY
// ========================================

addPointBtn.addEventListener(
  'click',
  startPointMode
);


cancelPointBtn.addEventListener(
  'click',
  closePointModal
);


closePointBtn.addEventListener(
  'click',
  closePointModal
);


savePointBtn.addEventListener(
  'click',
  savePoint
);


// ========================================
// RGB
// ========================================

redInput.addEventListener(
  'input',
  updateColorFromRgb
);


greenInput.addEventListener(
  'input',
  updateColorFromRgb
);


blueInput.addEventListener(
  'input',
  updateColorFromRgb
);


// ========================================
// KLIK MIMO MODAL
// ========================================

pointModal.addEventListener(
  'click',
  (event) => {

    if (
      event.target ===
      pointModal
    ) {

      closePointModal();

    }

  }
);


categoryModal.addEventListener(
  'click',
  (event) => {

    if (
      event.target ===
      categoryModal
    ) {

      closeCategoryModal();

    }

  }
);


// ========================================
// ENTER / ESC
// ========================================

document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key ===
      'Escape'
    ) {

      if (
        !pointModal.classList.contains(
          'hidden'
        )
      ) {

        closePointModal();

      }


      if (
        !categoryModal.classList.contains(
          'hidden'
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

  }
);


// ========================================
// MAPA
// ========================================

function renderMap() {

  canvas.style.transform =
    `translate(
      calc(-50% + ${x}px),
      calc(-50% + ${y}px)
    )
    scale(${scale})`;

}


// ========================================
// ZOOM
// ========================================

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
    (pointerX - x) *
    ratio;


  y =
    pointerY -
    (pointerY - y) *
    ratio;


  renderMap();

}


// ========================================
// PLUS
// ========================================

document
  .getElementById('zoomIn')
  .addEventListener(
    'click',
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


// ========================================
// MÍNUS
// ========================================

document
  .getElementById('zoomOut')
  .addEventListener(
    'click',
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


// ========================================
// DOMŮ
// ========================================

document
  .getElementById('resetView')
  .addEventListener(
    'click',
    () => {

      scale = 1;

      x = 0;

      y = 0;

      renderMap();

    }
  );


// ========================================
// KOLEČKO = ZOOM
// ========================================

viewport.addEventListener(
  'wheel',
  (event) => {

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
    passive: false
  }
);


// ========================================
// KLIK NA MAPU
// ========================================

viewport.addEventListener(
  'click',
  (event) => {

    if (addingPoint) {

      handleMapPointPlacement(
        event
      );

    }

  }
);


// ========================================
// TAŽENÍ MAPY
// ========================================

viewport.addEventListener(
  'pointerdown',
  (event) => {

    if (addingPoint) {
      return;
    }


    dragging =
      true;


    viewport.classList.add(
      'is-dragging'
    );


    startX =
      event.clientX;

    startY =
      event.clientY;


    startMapX =
      x;

    startMapY =
      y;


    viewport.setPointerCapture(
      event.pointerId
    );

  }
);


viewport.addEventListener(
  'pointermove',
  (event) => {

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


// ========================================
// KONEC TAŽENÍ
// ========================================

function stopDragging(event) {

  dragging =
    false;


  viewport.classList.remove(
    'is-dragging'
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
  'pointerup',
  stopDragging
);


viewport.addEventListener(
  'pointercancel',
  stopDragging
);


// ========================================
// START
// ========================================

migrateCategoryNames();

renderCategories();

renderPoints();

renderColorPresets();

setRgbFromHex(
  selectedColor
);

updateColorPreview();

renderMap();
