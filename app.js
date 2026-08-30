const viewport = document.getElementById('mapViewport');
const canvas = document.getElementById('mapCanvas');
const mapImage = document.getElementById('mapImage');
const pointsLayer = document.getElementById('pointsLayer');

const categoryList = document.getElementById('categoryList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const toggleAllBtn = document.getElementById('toggleAllBtn');

const addPointBtn = document.getElementById('addPointBtn');
const pointModeHint = document.getElementById('pointModeHint');
const pointModal = document.getElementById('pointModal');
const pointModalCard = document.getElementById('pointModalCard');
const closePointBtn = document.getElementById('closePointBtn');
const cancelPointBtn = document.getElementById('cancelPointBtn');
const savePointBtn = document.getElementById('savePointBtn');
const pointNameInput = document.getElementById('pointName');
const pointDescriptionInput = document.getElementById('pointDescription');
const pointCategorySelect = document.getElementById('pointCategory');
const pointSizeInput = document.getElementById('pointSize');
const pointSizeValue = document.getElementById('pointSizeValue');

const colorWheel = document.getElementById('colorWheel');
const colorWheelCursor = document.getElementById('colorWheelCursor');
const colorPresets = document.getElementById('colorPresets');
const colorPreview = document.getElementById('colorPreview');
const redInput = document.getElementById('redInput');
const greenInput = document.getElementById('greenInput');
const blueInput = document.getElementById('blueInput');

const categoryModal = document.getElementById('categoryModal');
const categoryNameInput = document.getElementById('categoryName');
const closeCategoryBtn = document.getElementById('closeCategoryBtn');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');


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
   BODY
===================================================== */

let addingPoint = false;
let pendingPoint = null;

let selectedColor = '#ff3b30';
let selectedSize = 6;

let colorWheelDragging = false;

let wheelHue = 0;
let wheelSaturation = 1;


/* =====================================================
   BARVY
===================================================== */

const COLOR_PRESETS = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#007aff'
];


/* =====================================================
   DEFAULT KATEGORIE
===================================================== */

const DEFAULT_CATEGORIES = [
  {
    id: createId(),
    name: 'Území',
    emoji: '🗺️',
    visible: true
  },
  {
    id: createId(),
    name: 'Prodej drog',
    emoji: '💊',
    visible: true
  },
  {
    id: createId(),
    name: 'Záterasy autem',
    emoji: '🚗',
    visible: true
  },
  {
    id: createId(),
    name: 'Ujíždění na motorce',
    emoji: '🏍️',
    visible: true
  }
];


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
   LOCAL STORAGE
===================================================== */

function saveCategories() {

  localStorage.setItem(
    'verdugosCategories',
    JSON.stringify(categories)
  );

}


function savePoints() {

  localStorage.setItem(
    'verdugosPoints',
    JSON.stringify(points)
  );

}


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
      JSON.parse(raw);

    return Array.isArray(data)
      ? data
      : fallback;

  } catch {

    return fallback;

  }

}


/* =====================================================
   NORMALIZACE KATEGORIÍ
===================================================== */

function normalizeCategory(
  category
) {

  let name =
    category.name ||
    'Bez názvu';

  let emoji =
    category.emoji ||
    '📌';


  /*
    Starší verze mohly mít emoji
    přímo v názvu.
  */

  const match =
    name.match(
      /^(.{1,2})\s*(.*)$/u
    );


  if (
    !category.emoji &&
    match &&
    /\p{Extended_Pictographic}/u.test(
      match[1]
    )
  ) {

    emoji =
      match[1];

    name =
      match[2] ||
      name;

  }


  return {

    id:
      category.id ||
      createId(),

    name:
      name,

    emoji:
      emoji,

    visible:
      category.visible !== false

  };

}


/* =====================================================
   NAČTENÍ
===================================================== */

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
   POMOCNÉ FUNKCE
===================================================== */

function countPoints(
  categoryId
) {

  return points.filter(
    (point) =>
      point.categoryId ===
      categoryId
  ).length;

}


function getCategory(
  id
) {

  return categories.find(
    (category) =>
      category.id === id
  );

}


function categoryLabel(
  category
) {

  return (
    `${category.emoji || '📌'} ${category.name}`
  );

}


/* =====================================================
   VYKRESLENÍ KATEGORIÍ
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


      /*
        Levý klik:
        zobrazit / skrýt kategorii.
      */

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


      /*
        Pravý klik:
        smazat kategorii.
      */

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


      /*
        PODKATEGORIE / BODY
      */

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
              'Kliknutím najede mapa na bod · pravý klik smaže bod';


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


            /*
              Kliknutí na bod
              v levém menu.
            */

            child.addEventListener(
              'click',
              (event) => {

                event.stopPropagation();

                focusPoint(
                  point.id
                );

              }
            );


            /*
              Pravý klik na bod
              v levém menu.
            */

            child.addEventListener(
              'contextmenu',
              (event) => {

                event.preventDefault();

                event.stopPropagation();

                deletePoint(
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
    getCategory(id);


  if (!category) {

    return;

  }


  const amount =
    countPoints(id);


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
   SMAZÁNÍ BODU
===================================================== */

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
   TOGGLE VŠE
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


  categoryModal.setAttribute(
    'aria-hidden',
    'false'
  );


  categoryNameInput.value =
    '';


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
   SELECT KATEGORIE PRO BOD
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
   ZAČÁTEK PŘIDÁVÁNÍ BODU
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
   FORMULÁŘ BODU
===================================================== */

function openPointModalAt(
  clientX,
  clientY
) {

  renderCategorySelect();


  pointNameInput.value =
    '';


  pointDescriptionInput.value =
    '';


  pointCategorySelect.value =
    categories[0]?.id ||
    '';


  selectedSize =
    6;


  pointSizeInput.value =
    6;


  pointSizeValue.textContent =
    '6 px';


  setColor(
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


  renderPoints();

}


/* =====================================================
   UMÍSTĚNÍ FORMULÁŘE
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


      /*
        Když není místo vpravo,
        dáme formulář vlevo.
      */

      if (
        left + rect.width >
        vw - 10
      ) {

        left =
          clientX -
          rect.width -
          gap;

      }


      /*
        Když není místo dole,
        dáme formulář nahoru.
      */

      if (
        top + rect.height >
        vh - 10
      ) {

        top =
          clientY -
          rect.height -
          gap;

      }


      /*
        Udržíme formulář
        uvnitř obrazovky.
      */

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
   KLIK NA MAPU
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
        (
          event.clientX -
          rect.left
        ) /
        rect.width
      ) *
      100,

    y:
      (
        (
          event.clientY -
          rect.top
        ) /
        rect.height
      ) *
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
      'Napiš název bodu.'
    );


    pointNameInput.focus();

    return;

  }


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
      pointDescriptionInput
        .value
        .trim(),

    categoryId:
      categoryId,

    color:
      selectedColor,

    size:
      selectedSize

  });


  savePoints();


  closePointModal();


  renderPoints();

  renderCategories();

}


/* =====================================================
   BODY NA MAPĚ
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
              '',

            description:
              '',

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
        Emoji kategorie
        uprostřed bodu.
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


        emoji.style.fontSize =
          `${Math.max(
            8,
            Math.min(
              18,
              size * 1.35
            )
          )}px`;


        element.appendChild(
          emoji
        );

      }


      /*
        Tooltip.
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


        /*
          Pravý klik = smazání.
        */

        element.addEventListener(
          'contextmenu',
          (event) => {

            event.preventDefault();

            event.stopPropagation();

            deletePoint(
              point.id
            );

          }
        );

      }


      /*
        Uložíme ID bodu
        pro focusování.
      */

      if (
        !point.preview
      ) {

        element.dataset.pointId =
          point.id;

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
   BARVY
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
            (
              q-p
            ) *
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
            (
              q-p
            ) *
            (
              2/3-t
            ) *
            6
          );

        }

        return p;

      };


    const q =
      l < .5
        ? l*(1+s)
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


  const lightness =
    (max+min)/2;


  let hue = 0;
  let saturation = 0;


  if (
    max !== min
  ) {

    const d =
      max-min;


    saturation =
      lightness > .5
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

        hue =
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

        hue =
          (
            b-r
          ) /
          d +
          2;

        break;


      default:

        hue =
          (
            r-g
          ) /
          d +
          4;

    }


    hue /= 6;

  }


  return {

    h:
      hue*360,

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
   PICK COLOR Z WHEEL
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
      .5
    );


  setColor(
    rgbToHex(
      rgb.r,
      rgb.g,
      rgb.b
    )
  );


  colorWheelCursor.style.left =
    `${event.clientX - rect.left}px`;


  colorWheelCursor.style.top =
    `${event.clientY - rect.top}px`;

}


/* =====================================================
   PRESET BARVY
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
   FOCUS BODU
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


  const element =
    pointsLayer.querySelector(
      `[data-point-id="${id}"]`
    );


  if (element) {

    const elementRect =
      element.getBoundingClientRect();


    const viewportRect =
      viewport.getBoundingClientRect();


    x +=

      (
        viewportRect.left +
        viewportRect.width / 2
      ) -

      (
        elementRect.left +
        elementRect.width / 2
      );


    y +=

      (
        viewportRect.top +
        viewportRect.height / 2
      ) -

      (
        elementRect.top +
        elementRect.height / 2
      );


    renderMap();

  }

}


/* =====================================================
   MAPA
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


function zoomAt(
  next,
  clientX,
  clientY
) {

  const rect =
    viewport.getBoundingClientRect();


  const px =
    clientX -
    rect.left -
    rect.width / 2;


  const py =
    clientY -
    rect.top -
    rect.height / 2;


  const old =
    scale;


  scale =
    Math.max(
      MIN_SCALE,
      Math.min(
        MAX_SCALE,
        next
      )
    );


  const ratio =
    scale /
    old;


  x =
    px -
    (
      px -
      x
    ) *
    ratio;


  y =
    py -
    (
      py -
      y
    ) *
    ratio;


  renderMap();

}


/* =====================================================
   EVENTY
===================================================== */

function setupEvents() {

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


  viewport.addEventListener(
    'click',
    placePoint
  );


  viewport.addEventListener(
    'wheel',
    (event) => {

      event.preventDefault();


      zoomAt(

        scale *
        (
          event.deltaY < 0
            ? 1.12
            : 1 / 1.12
        ),

        event.clientX,

        event.clientY

      );

    },
    {
      passive:false
    }
  );


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


  viewport.addEventListener(
    'pointerup',
    stopDrag
  );


  viewport.addEventListener(
    'pointercancel',
    stopDrag
  );


  document
    .getElementById(
      'zoomIn'
    )
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
    .getElementById(
      'zoomOut'
    )
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
    .getElementById(
      'resetView'
    )
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

    }
  );

}


/* =====================================================
   UKONČENÍ DRAG
===================================================== */

function stopDrag(
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


/* =====================================================
   START
===================================================== */

setupEvents();

renderCategories();

renderPoints();

renderColorPresets();

setColor(
  '#ff3b30'
);

updatePreview();

renderMap();
