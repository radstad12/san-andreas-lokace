const viewport =
  document.getElementById('mapViewport');

const canvas =
  document.getElementById('mapCanvas');

const mapImage =
  document.getElementById('mapImage');

const pointsLayer =
  document.getElementById('pointsLayer');


/* =====================================================
   KATEGORIE
===================================================== */

const categoryList =
  document.getElementById('categoryList');

const addCategoryBtn =
  document.getElementById('addCategoryBtn');

const toggleAllBtn =
  document.getElementById('toggleAllBtn');


/* =====================================================
   BOD
===================================================== */

const addPointBtn =
  document.getElementById('addPointBtn');

const pointModeHint =
  document.getElementById('pointModeHint');

const pointModal =
  document.getElementById('pointModal');

const pointModalCard =
  document.getElementById('pointModalCard');

const pointModalTitle =
  document.getElementById('pointModalTitle');

const closePointBtn =
  document.getElementById('closePointBtn');

const cancelPointBtn =
  document.getElementById('cancelPointBtn');

const savePointBtn =
  document.getElementById('savePointBtn');

const pointNameInput =
  document.getElementById('pointName');

const pointDescriptionInput =
  document.getElementById('pointDescription');

const pointCategorySelect =
  document.getElementById('pointCategory');

const pointSizeInput =
  document.getElementById('pointSize');

const pointSizeValue =
  document.getElementById('pointSizeValue');


/* =====================================================
   BARVY
===================================================== */

const colorWheel =
  document.getElementById('colorWheel');

const colorWheelCursor =
  document.getElementById('colorWheelCursor');

const colorPresets =
  document.getElementById('colorPresets');

const colorPreview =
  document.getElementById('colorPreview');

const redInput =
  document.getElementById('redInput');

const greenInput =
  document.getElementById('greenInput');

const blueInput =
  document.getElementById('blueInput');


/* =====================================================
   MODAL KATEGORIE
===================================================== */

const categoryModal =
  document.getElementById('categoryModal');

const categoryNameInput =
  document.getElementById('categoryName');

const closeCategoryBtn =
  document.getElementById('closeCategoryBtn');

const cancelCategoryBtn =
  document.getElementById('cancelCategoryBtn');

const saveCategoryBtn =
  document.getElementById('saveCategoryBtn');


/* =====================================================
   CONTEXT MENU BODU
===================================================== */

const pointContextMenu =
  document.getElementById('pointContextMenu');

const editPointBtn =
  document.getElementById('editPointBtn');

const deletePointBtn =
  document.getElementById('deletePointBtn');


/* =====================================================
   MAPA
===================================================== */

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


/* =====================================================
   BOD
===================================================== */

let addingPoint = false;

let pendingPoint = null;

let editingPointId = null;


/* =====================================================
   BARVA
===================================================== */

const COLOR_PRESETS = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#007aff'
];

let selectedColor =
  '#ff3b30';

let selectedSize =
  6;

let colorWheelDragging =
  false;

let wheelHue =
  0;

let wheelSaturation =
  1;


/* =====================================================
   CONTEXT MENU
===================================================== */

let contextPointId =
  null;


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
    id:createId(),
    name:'Území',
    emoji:'🗺️',
    visible:true
  },

  {
    id:createId(),
    name:'Prodej drog',
    emoji:'💊',
    visible:true
  },

  {
    id:createId(),
    name:'Záterasy autem',
    emoji:'🚗',
    visible:true
  },

  {
    id:createId(),
    name:'Ujíždění na motorce',
    emoji:'🏍️',
    visible:true
  }

];


/* =====================================================
   LOCAL STORAGE
===================================================== */

function loadJson(
  key,
  fallback
) {

  try {

    const raw =
      localStorage.getItem(
        key
      );


    if (!raw) {

      return fallback;

    }


    const data =
      JSON.parse(
        raw
      );


    return Array.isArray(data)
      ? data
      : fallback;

  }
  catch {

    return fallback;

  }

}


function saveCategories() {

  localStorage.setItem(
    'verdugosCategories',
    JSON.stringify(
      categories
    )
  );

}


function savePoints() {

  localStorage.setItem(
    'verdugosPoints',
    JSON.stringify(
      points
    )
  );

}


/* =====================================================
   NORMALIZACE KATEGORIÍ
===================================================== */

function normalizeCategory(
  category
) {

  return {

    id:
      category.id ||
      createId(),

    name:
      category.name ||
      'Bez názvu',

    emoji:
      category.emoji ||
      '📌',

    visible:
      category.visible !== false

  };

}


let categories =
  loadJson(
    'verdugosCategories',
    DEFAULT_CATEGORIES
  )
  .map(
    normalizeCategory
  );


let points =
  loadJson(
    'verdugosPoints',
    []
  );


saveCategories();


/* =====================================================
   HELPERY
===================================================== */

function getCategory(
  id
) {

  return categories.find(
    (category) =>
      category.id === id
  );

}


function countPoints(
  categoryId
) {

  return points.filter(
    (point) =>
      point.categoryId ===
      categoryId
  ).length;

}


function categoryLabel(
  category
) {

  return (
    `${category.emoji || '📌'} ${category.name}`
  );

}


/* =====================================================
   KATEGORIE
===================================================== */

function renderCategories() {

  categoryList.innerHTML =
    '';


  categories.forEach(
    (category) => {

      const wrap =
        document.createElement(
          'div'
        );


      wrap.className =
        'category-wrap';


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


      const emoji =
        document.createElement(
          'span'
        );


      emoji.className =
        'category-emoji';


      emoji.textContent =
        category.emoji ||
        '📌';


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


      item.append(
        emoji,
        name,
        count,
        state
      );


      /* LEVÝ KLIK */

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


      /* PRAVÝ KLIK */

      item.addEventListener(
        'contextmenu',
        (event) => {

          event.preventDefault();

          deleteCategory(
            category.id
          );

        }
      );


      wrap.appendChild(
        item
      );


      /* PODBODY */

      const children =
        document.createElement(
          'div'
        );


      children.className =
        'category-points';


      points
        .filter(
          (point) =>
            point.categoryId ===
            category.id
        )
        .forEach(
          (point) => {

            const child =
              document.createElement(
                'div'
              );


            child.className =
              'category-point';


            child.title =
              'Kliknutí = najít a přiblížit bod';


            const dot =
              document.createElement(
                'span'
              );


            dot.className =
              'category-point-dot';


            dot.style.backgroundColor =
              point.color ||
              '#ff3b30';


            const text =
              document.createElement(
                'span'
              );


            text.className =
              'category-point-name';


            text.textContent =
              point.name;


            child.append(
              dot,
              text
            );


            /* CLICK PODBODU */

            child.addEventListener(
              'click',
              (event) => {

                event.stopPropagation();

                focusPoint(
                  point.id
                );

              }
            );


            /* PRAVÝ KLIK PODBODU */

            child.addEventListener(
              'contextmenu',
              (event) => {

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


      categoryList.appendChild(
        wrap
      );

    }
  );


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


/* =====================================================
   SMAZÁNÍ KATEGORIE
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


  const amount =
    countPoints(
      id
    );


  let message =
    `Opravdu chceš smazat kategorii „${category.name}“?`;


  if (amount) {

    message +=
      `\n\nKategorie obsahuje ${amount} bodů. Ty budou také odstraněny.`;

  }


  if (
    !confirm(
      message
    )
  ) {

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


/* =====================================================
   SKRÝT / ZOBRAZIT VŠE
===================================================== */

function toggleAllCategories() {

  const allVisible =
    categories.length > 0 &&
    categories.every(
      (category) =>
        category.visible
    );


  categories =
    categories.map(
      (category) => ({

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
   MODAL KATEGORIE
===================================================== */

function openCategoryModal() {

  categoryModal.classList.remove(
    'hidden'
  );


  categoryNameInput.value =
    '';


  categoryModal.setAttribute(
    'aria-hidden',
    'false'
  );


  setTimeout(
    () => {

      categoryNameInput.focus();

    },
    50
  );

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


  if (
    categories.some(
      (category) =>
        category.name
          .toLowerCase() ===
        name.toLowerCase()
    )
  ) {

    alert(
      'Tato kategorie už existuje.'
    );

    return;

  }


  categories.push({

    id:
      createId(),

    name:
      name,

    emoji:
      '📌',

    visible:
      true

  });


  saveCategories();

  renderCategories();

  closeCategoryModal();

}


/* =====================================================
   SELECT KATEGORIÍ
===================================================== */

function renderCategorySelect() {

  pointCategorySelect.innerHTML =
    '';


  categories.forEach(
    (category) => {

      const option =
        document.createElement(
          'option'
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
   START PŘIDÁVÁNÍ BODU
===================================================== */

function startPointMode() {

  if (
    !categories.length
  ) {

    alert(
      'Nejdříve vytvoř alespoň jednu kategorii.'
    );

    return;

  }


  closeContextMenu();


  addingPoint =
    true;


  pendingPoint =
    null;


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


/* =====================================================
   FORMULÁŘ - NOVÝ BOD
===================================================== */

function openPointModalAt(
  clientX,
  clientY
) {

  renderCategorySelect();


  pointModalTitle.textContent =
    'Přidat bod';


  savePointBtn.textContent =
    'Přidat bod';


  pointNameInput.value =
    '';


  pointDescriptionInput.value =
    '';


  editingPointId =
    null;


  selectedSize =
    6;


  pointSizeInput.value =
    6;


  pointSizeValue.textContent =
    '6 px';


  setColor(
    '#ff3b30'
  );


  pointCategorySelect.value =
    categories[0]?.id || '';


  pointModal.classList.remove(
    'hidden'
  );


  pointModal.setAttribute(
    'aria-hidden',
    'false'
  );


  positionPointModal(
    clientX,
    clientY
  );


  renderPoints();


  setTimeout(
    () => {

      pointNameInput.focus();

    },
    50
  );

}


/* =====================================================
   FORMULÁŘ - EDITACE
===================================================== */

function openEditPoint(
  id,
  clientX,
  clientY
) {

  const point =
    points.find(
      (item) =>
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
      point.y,

    clientX:
      clientX,

    clientY:
      clientY

  };


  renderCategorySelect();


  pointModalTitle.textContent =
    'Editovat bod';


  savePointBtn.textContent =
    'Uložit změny';


  pointNameInput.value =
    point.name || '';


  pointDescriptionInput.value =
    point.description || '';


  pointCategorySelect.value =
    point.categoryId || '';


  selectedSize =
    Number(
      point.size
    ) || 6;


  pointSizeInput.value =
    selectedSize;


  pointSizeValue.textContent =
    `${selectedSize} px`;


  setColor(
    point.color ||
    '#ff3b30'
  );


  pointModal.classList.remove(
    'hidden'
  );


  pointModal.setAttribute(
    'aria-hidden',
    'false'
  );


  positionPointModal(
    clientX,
    clientY
  );


  renderPoints();


  setTimeout(
    () => {

      pointNameInput.focus();

    },
    50
  );

}


/* =====================================================
   POZICE MODALU
===================================================== */

function positionPointModal(
  clientX,
  clientY
) {

  requestAnimationFrame(
    () => {

      const gap =
        16;


      const rect =
        pointModalCard.getBoundingClientRect();


      const vw =
        window.innerWidth;


      const vh =
        window.innerHeight;


      let left =
        clientX + gap;


      let top =
        clientY + gap;


      if (
        left + rect.width >
        vw - 10
      ) {

        left =
          clientX -
          rect.width -
          gap;

      }


      if (
        top + rect.height >
        vh - 10
      ) {

        top =
          clientY -
          rect.height -
          gap;

      }


      left =
        Math.max(
          10,
          Math.min(
            left,
            vw -
            rect.width -
            10
          )
        );


      top =
        Math.max(
          10,
          Math.min(
            top,
            vh -
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
   ZAVŘENÍ BODU
===================================================== */

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


  editingPointId =
    null;


  renderPoints();

}


/* =====================================================
   KLIK NA MAPU - NOVÝ BOD
===================================================== */

function placePoint(
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


  pendingPoint = {

    x:
      (
        event.clientX -
        rect.left
      ) /
      rect.width *
      100,

    y:
      (
        event.clientY -
        rect.top
      ) /
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


/* =====================================================
   ULOŽENÍ / ÚPRAVA BODU
===================================================== */

function savePoint() {

  if (!pendingPoint) {

    return;

  }


  const name =
    pointNameInput.value.trim();


  if (!name) {

    alert(
      'Napiš název bodu.'
    );

    pointNameInput.focus();

    return;

  }


  const description =
    pointDescriptionInput
      .value
      .trim();


  const categoryId =
    pointCategorySelect.value;


  if (!categoryId) {

    alert(
      'Vyber kategorii.'
    );

    return;

  }


  /*
    EDITACE EXISTUJÍCÍHO BODU
  */

  if (
    editingPointId
  ) {

    const point =
      points.find(
        (item) =>
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


  /*
    NOVÝ BOD
  */

  else {

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
   VYKRESLENÍ BODŮ
===================================================== */

function renderPoints() {

  pointsLayer.innerHTML =
    '';


  const visiblePoints =
    points.filter(
      (point) =>
        getCategory(
          point.categoryId
        )?.visible
    );


  const list =
    pendingPoint

      ? [

          ...visiblePoints,

          {

            ...pendingPoint,

            id:
              '__preview__',

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

          }

        ]

      : visiblePoints;


  list.forEach(
    (point) => {

      const category =
        getCategory(
          point.categoryId
        );


      if (!category) {

        return;

      }


      const element =
        document.createElement(
          'div'
        );


      element.className =
        'map-point' +

        (
          point.preview
            ? ' map-point-preview'
            : ''
        ) +

        (
          category.emoji
            ? ' has-emoji'
            : ''
        );


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
        '#ff3b30';


      /*
        Emoji už není větší
        než samotný bod.
      */

      if (
        category.emoji
      ) {

        const emoji =
          document.createElement(
            'span'
          );


        emoji.className =
          'map-point-emoji';


        emoji.textContent =
          category.emoji;


        const emojiSize =
          Math.max(
            3,
            Math.min(
              size,
              12
            )
          );


        emoji.style.fontSize =
          `${emojiSize}px`;


        element.appendChild(
          emoji
        );

      }


      /*
        Tooltip
      */

      if (
        !point.preview
      ) {

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


        element.appendChild(
          tooltip
        );


        element.dataset.pointId =
          point.id;


        /*
          Pravý klik na bod
        */

        element.addEventListener(
          'contextmenu',
          (event) => {

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
   LIVE PREVIEW
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
   FOCUS BODU + ZOOM
===================================================== */

function focusPoint(
  id
) {

  const point =
    points.find(
      (item) =>
        item.id === id
    );


  if (!point) {

    return;

  }


  const category =
    getCategory(
      point.categoryId
    );


  /*
    Když byla kategorie skrytá,
    nejprve ji zobrazíme.
  */

  if (
    category &&
    !category.visible
  ) {

    category.visible =
      true;

    saveCategories();

    renderCategories();

    renderPoints();

  }


  /*
    Najdeme bod na obrazovce.
  */

  const element =
    pointsLayer.querySelector(
      `[data-point-id="${id}"]`
    );


  if (!element) {

    return;

  }


  const er =
    element.getBoundingClientRect();


  const vr =
    viewport.getBoundingClientRect();


  /*
    Nejdřív bod vystředíme.
  */

  x +=

    (
      vr.left +
      vr.width / 2
    ) -

    (
      er.left +
      er.width / 2
    );


  y +=

    (
      vr.top +
      vr.height / 2
    ) -

    (
      er.top +
      er.height / 2
    );


  /*
    Potom přiblížíme.
  */

  const targetScale =
    Math.min(
      6,
      Math.max(
        scale * 2,
        2
      )
    );


  const centerX =
    vr.left +
    vr.width / 2;


  const centerY =
    vr.top +
    vr.height / 2;


  const ratio =
    targetScale /
    scale;


  x =
    centerX -
    (
      centerX -
      (
        vr.left +
        vr.width / 2
      )
    ) *
    ratio +
    x;


  y =
    centerY -
    (
      centerY -
      (
        vr.top +
        vr.height / 2
      )
    ) *
    ratio +
    y;


  scale =
    targetScale;


  /*
    Jednodušší druhé vystředění
    po změně zoomu.
  */

  const updated =
    pointsLayer.querySelector(
      `[data-point-id="${id}"]`
    );


  if (updated) {

    const newRect =
      updated.getBoundingClientRect();


    x +=
      (
        vr.left +
        vr.width / 2
      ) -

      (
        newRect.left +
        newRect.width / 2
      );


    y +=
      (
        vr.top +
        vr.height / 2
      ) -

      (
        newRect.top +
        newRect.height / 2
      );

  }


  renderMap();

}


/* =====================================================
   CONTEXT MENU BODU
===================================================== */

function openContextMenu(
  clientX,
  clientY,
  pointId
) {

  contextPointId =
    pointId;


  pointContextMenu.classList.remove(
    'hidden'
  );


  const rect =
    pointContextMenu.getBoundingClientRect();


  let left =
    clientX;


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


  pointContextMenu.style.left =
    `${Math.max(10,left)}px`;


  pointContextMenu.style.top =
    `${Math.max(10,top)}px`;

}


function closeContextMenu() {

  pointContextMenu.classList.add(
    'hidden'
  );


  contextPointId =
    null;

}


/* =====================================================
   EDITACE Z CONTEXT MENU
===================================================== */

editPointBtn.addEventListener(
  'click',
  () => {

    if (!contextPointId) {

      return;

    }


    const id =
      contextPointId;


    const point =
      points.find(
        (item) =>
          item.id === id
      );


    if (!point) {

      closeContextMenu();

      return;

    }


    closeContextMenu();


    openEditPoint(
      id,
      window.innerWidth / 2,
      window.innerHeight / 2
    );

  }
);


/* =====================================================
   SMAZÁNÍ Z CONTEXT MENU
===================================================== */

deletePointBtn.addEventListener(
  'click',
  () => {

    if (!contextPointId) {

      return;

    }


    const id =
      contextPointId;


    closeContextMenu();


    deletePoint(
      id
    );

  }
);


function deletePoint(
  id
) {

  const point =
    points.find(
      (item) =>
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
      (item) =>
        item.id !== id
    );


  savePoints();

  renderPoints();

  renderCategories();

}


/* =====================================================
   ZAVŘENÍ CONTEXT MENU KLIKEM
===================================================== */

document.addEventListener(
  'click',
  (event) => {

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
   RGB
===================================================== */

function hexToRgb(
  hex
) {

  const value =
    hex.replace(
      '#',
      ''
    );


  return {

    r:
      parseInt(
        value.slice(
          0,
          2
        ),
        16
      ),

    g:
      parseInt(
        value.slice(
          2,
          4
        ),
        16
      ),

    b:
      parseInt(
        value.slice(
          4,
          6
        ),
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

    [r,g,b]
      .map(
        (value) =>
          Math.round(
            value
          )
          .toString(16)
          .padStart(
            2,
            '0'
          )
      )
      .join('')

  );

}


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

    r = l;

    g = l;

    b = l;

  }

  else {

    const hue2rgb =
      (
        p,
        q,
        t
      ) => {

        if (t < 0) {
          t += 1;
        }

        if (t > 1) {
          t -= 1;
        }

        if (
          t < 1 / 6
        ) {

          return (
            p +
            (
              q -
              p
            ) *
            6 *
            t
          );

        }

        if (
          t < 1 / 2
        ) {

          return q;

        }

        if (
          t < 2 / 3
        ) {

          return (
            p +
            (
              q -
              p
            ) *
            (
              2 / 3 -
              t
            ) *
            6
          );

        }

        return p;

      };


    const q =
      l < 0.5
        ? l *
          (1+s)

        : l +
          s -
          l*s;


    const p =
      2*l -
      q;


    r =
      hue2rgb(
        p,
        q,
        h +
        1/3
      );


    g =
      hue2rgb(
        p,
        q,
        h
      );


    b =
      hue2rgb(
        p,
        q,
        h -
        1/3
      );

  }


  return {

    r:
      Math.round(
        r * 255
      ),

    g:
      Math.round(
        g * 255
      ),

    b:
      Math.round(
        b * 255
      )

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
      r,g,b
    );


  const min =
    Math.min(
      r,g,b
    );


  const lightness =
    (
      max +
      min
    ) / 2;


  let hue = 0;

  let saturation = 0;


  if (
    max !== min
  ) {

    const difference =
      max -
      min;


    saturation =
      lightness > 0.5

        ? difference /
          (
            2 -
            max -
            min
          )

        : difference /
          (
            max +
            min
          );


    switch(max) {

      case r:

        hue =
          (
            g -
            b
          ) /
          difference +
          (
            g < b
              ? 6
              : 0
          );

        break;


      case g:

        hue =
          (
            b -
            r
          ) /
          difference +
          2;

        break;


      default:

        hue =
          (
            r -
            g
          ) /
          difference +
          4;

    }


    hue /= 6;

  }


  return {

    h:
      hue * 360,

    s:
      saturation,

    l:
      lightness

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


  redInput.value =
    r;


  greenInput.value =
    g;


  blueInput.value =
    b;


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


/* =====================================================
   PICK WHEEL
===================================================== */

function pickWheel(
  event
) {

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

    hue += 360;

  }


  wheelHue =
    hue;


  wheelSaturation =
    radius /
    (rect.width / 2);


  const rgb =
    hslToRgb(
      hue,
      wheelSaturation,
      0.5
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


  colorWheelCursor.style.left =
    `${event.clientX - rect.left}px`;


  colorWheelCursor.style.top =
    `${event.clientY - rect.top}px`;


  renderColorPresets();

  renderPoints();

}


/* =====================================================
   PRESETY
===================================================== */

function renderColorPresets() {

  colorPresets.innerHTML =
    '';


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

addPointBtn.addEventListener(
  'click',
  startPointMode
);


addCategoryBtn.addEventListener(
  'click',
  openCategoryModal
);


toggleAllBtn.addEventListener(
  'click',
  toggleAllCategories
);


saveCategoryBtn.addEventListener(
  'click',
  addCategory
);


cancelCategoryBtn.addEventListener(
  'click',
  closeCategoryModal
);


closeCategoryBtn.addEventListener(
  'click',
  closeCategoryModal
);


savePointBtn.addEventListener(
  'click',
  savePoint
);


cancelPointBtn.addEventListener(
  'click',
  closePointModal
);


closePointBtn.addEventListener(
  'click',
  closePointModal
);


pointSizeInput.addEventListener(
  'input',
  updatePreview
);


redInput.addEventListener(
  'input',
  updateFromRgb
);


greenInput.addEventListener(
  'input',
  updateFromRgb
);


blueInput.addEventListener(
  'input',
  updateFromRgb
);


pointNameInput.addEventListener(
  'input',
  renderPoints
);


pointDescriptionInput.addEventListener(
  'input',
  renderPoints
);


pointCategorySelect.addEventListener(
  'change',
  renderPoints
);


/* =====================================================
   COLOR WHEEL EVENTS
===================================================== */

colorWheel.addEventListener(
  'pointerdown',
  (event) => {

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
  'pointermove',
  (event) => {

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
  'pointerup',
  () => {

    colorWheelDragging =
      false;

  }
);


colorWheel.addEventListener(
  'pointercancel',
  () => {

    colorWheelDragging =
      false;

  }
);


/* =====================================================
   KLIK NA MAPU
===================================================== */

viewport.addEventListener(
  'click',
  (event) => {

    if (
      addingPoint
    ) {

      placePoint(
        event
      );

    }

  }
);


/* =====================================================
   ESC
===================================================== */

document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key !==
      'Escape'
    ) {

      return;

    }


    if (
      !pointModal.classList.contains(
        'hidden'
      )
    ) {

      closePointModal();

    }


    else if (
      addingPoint
    ) {

      stopPointMode();

    }


    if (
      !categoryModal.classList.contains(
        'hidden'
      )
    ) {

      closeCategoryModal();

    }


    closeContextMenu();

  }
);


/* =====================================================
   MAPA - ZOOM
===================================================== */

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
   MAPA - TLAČÍTKA
===================================================== */

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


document
  .getElementById('resetView')
  .addEventListener(
    'click',
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
   TAŽENÍ MAPY
===================================================== */

viewport.addEventListener(
  'pointerdown',
  (event) => {

    if (
      addingPoint
    ) {

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

    if (
      !dragging
    ) {

      return;

    }


    x =
      startMapX +
      event.clientX -
      startX;


    y =
      startMapY +
      event.clientY -
      startY;


    renderMap();

  }
);


function stopDragging(
  event
) {

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


/* =====================================================
   RENDER MAP
===================================================== */

function renderMap() {

  canvas.style.transform =

    `translate3d(
      calc(-50% + ${x}px),
      calc(-50% + ${y}px),
      0
    )
    scale(${scale})`;

}


/* =====================================================
   START
===================================================== */

renderCategories();

renderPoints();

renderColorPresets();

setColor(
  '#ff3b30'
);

updatePreview();

renderMap();
