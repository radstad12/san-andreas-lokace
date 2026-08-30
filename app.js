const viewport = document.getElementById('mapViewport');
const canvas = document.getElementById('mapCanvas');

const categoryList = document.getElementById('categoryList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const toggleAllBtn = document.getElementById('toggleAllBtn');

const categoryModal = document.getElementById('categoryModal');
const categoryNameInput = document.getElementById('categoryName');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');

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
// KATEGORIE
// ========================================

const DEFAULT_CATEGORIES = [
  {
    id: crypto.randomUUID(),
    name: 'Území',
    visible: true
  },
  {
    id: crypto.randomUUID(),
    name: 'Prodej drog',
    visible: true
  },
  {
    id: crypto.randomUUID(),
    name: 'Záterasy autem',
    visible: true
  },
  {
    id: crypto.randomUUID(),
    name: 'Ujíždění na motorce',
    visible: true
  }
];

let categories = loadCategories();

function loadCategories() {
  try {
    const saved = localStorage.getItem('verdugosCategories');

    if (!saved) {
      return DEFAULT_CATEGORIES;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return DEFAULT_CATEGORIES;
    }

    return parsed;

  } catch (error) {
    console.error('Nepodařilo se načíst kategorie:', error);
    return DEFAULT_CATEGORIES;
  }
}

function saveCategories() {
  localStorage.setItem(
    'verdugosCategories',
    JSON.stringify(categories)
  );
}


// ========================================
// VYKRESLENÍ KATEGORIÍ
// ========================================

function renderCategories() {

  categoryList.innerHTML = '';

  categories.forEach((category) => {

    const item = document.createElement('div');

    item.className = 'category-item';

    if (!category.visible) {
      item.classList.add('hidden-category');
    }

    item.dataset.id = category.id;

    item.title =
      'Levý klik = zobrazit/skrýt · Pravý klik = smazat';


    // ikonka
    const icon = document.createElement('span');

    icon.className = 'category-icon';


    // název
    const name = document.createElement('span');

    name.className = 'category-name';

    name.textContent = category.name;


    // stav
    const state = document.createElement('span');

    state.className = 'category-state';

    state.textContent =
      category.visible
        ? 'zobrazeno'
        : 'skryto';


    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(state);


    // LEVÝ KLIK
    item.addEventListener('click', () => {

      toggleCategory(category.id);

    });


    // PRAVÝ KLIK
    item.addEventListener('contextmenu', (event) => {

      event.preventDefault();

      confirmDeleteCategory(category.id);

    });


    categoryList.appendChild(item);

  });


  updateToggleAllButton();
}


// ========================================
// ZOBRAZIT / SKRÝT KATEGORII
// ========================================

function toggleCategory(id) {

  categories = categories.map((category) => {

    if (category.id !== id) {
      return category;
    }

    return {
      ...category,
      visible: !category.visible
    };

  });

  saveCategories();

  renderCategories();
}


// ========================================
// ZOBRAZIT / SKRÝT VŠE
// ========================================

function toggleAllCategories() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      (category) => category.visible
    );


  categories = categories.map((category) => {

    return {
      ...category,
      visible: !allVisible
    };

  });


  saveCategories();

  renderCategories();
}


function updateToggleAllButton() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      (category) => category.visible
    );

  toggleAllBtn.textContent =
    allVisible
      ? 'Skrýt vše'
      : 'Zobrazit vše';
}


// ========================================
// SMAZÁNÍ KATEGORIE
// ========================================

function confirmDeleteCategory(id) {

  const category =
    categories.find(
      (item) => item.id === id
    );


  if (!category) {
    return;
  }


  const confirmed = window.confirm(
    `Opravdu chceš smazat kategorii „${category.name}“?`
  );


  if (!confirmed) {
    return;
  }


  categories =
    categories.filter(
      (item) => item.id !== id
    );


  saveCategories();

  renderCategories();
}


// ========================================
// PŘIDÁNÍ KATEGORIE
// ========================================

function openCategoryModal() {

  categoryModal.classList.remove('hidden');

  categoryModal.setAttribute(
    'aria-hidden',
    'false'
  );


  categoryNameInput.value = '';

  categoryNameInput.focus();
}


function closeCategoryModal() {

  categoryModal.classList.add('hidden');

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
        category.name.toLowerCase() ===
        name.toLowerCase()
    );


  if (duplicate) {

    window.alert(
      'Kategorie s tímto názvem už existuje.'
    );

    return;
  }


  categories.push({

    id: crypto.randomUUID(),

    name: name,

    visible: true

  });


  saveCategories();

  renderCategories();

  closeCategoryModal();
}


// ========================================
// EVENTY KATEGORIÍ
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


// kliknutí mimo okno
categoryModal.addEventListener(
  'click',
  (event) => {

    if (event.target === categoryModal) {

      closeCategoryModal();

    }

  }
);


// ENTER / ESC
categoryNameInput.addEventListener(
  'keydown',
  (event) => {

    if (event.key === 'Enter') {

      addCategory();

    }


    if (event.key === 'Escape') {

      closeCategoryModal();

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
    ) scale(${scale})`;

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


  const oldScale = scale;


  scale =
    Math.max(
      MIN_SCALE,
      Math.min(
        MAX_SCALE,
        nextScale
      )
    );


  const ratio =
    scale / oldScale;


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
// ZOOM TLAČÍTKA
// ========================================

document
  .getElementById('zoomIn')
  .addEventListener('click', () => {

    const rect =
      viewport.getBoundingClientRect();


    zoomAt(

      scale * 1.2,

      rect.left +
      rect.width / 2,

      rect.top +
      rect.height / 2

    );

  });


document
  .getElementById('zoomOut')
  .addEventListener('click', () => {

    const rect =
      viewport.getBoundingClientRect();


    zoomAt(

      scale / 1.2,

      rect.left +
      rect.width / 2,

      rect.top +
      rect.height / 2

    );

  });


// ========================================
// RESET MAPY
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
// KOLEČKO MYŠI = ZOOM
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
// TAŽENÍ MAPY
// ========================================

viewport.addEventListener(
  'pointerdown',
  (event) => {

    dragging = true;

    viewport.classList.add(
      'is-dragging'
    );


    startX =
      event.clientX;

    startY =
      event.clientY;


    startMapX = x;

    startMapY = y;


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
      (event.clientX - startX);


    y =
      startMapY +
      (event.clientY - startY);


    renderMap();

  }
);


function stopDragging(event) {

  dragging = false;


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

renderCategories();

renderMap();
