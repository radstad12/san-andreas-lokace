// =====================================================
// ELEMENTY STRÁNKY
// =====================================================

const viewport =
  document.getElementById(
    'mapViewport'
  );

const canvas =
  document.getElementById(
    'mapCanvas'
  );

const mapImage =
  document.getElementById(
    'mapImage'
  );

const pointsLayer =
  document.getElementById(
    'pointsLayer'
  );


// =====================================================
// KATEGORIE
// =====================================================

const categoryList =
  document.getElementById(
    'categoryList'
  );

const addCategoryBtn =
  document.getElementById(
    'addCategoryBtn'
  );

const toggleAllBtn =
  document.getElementById(
    'toggleAllBtn'
  );


// =====================================================
// BOD
// =====================================================

const addPointBtn =
  document.getElementById(
    'addPointBtn'
  );

const pointModeHint =
  document.getElementById(
    'pointModeHint'
  );

const pointModal =
  document.getElementById(
    'pointModal'
  );

const closePointBtn =
  document.getElementById(
    'closePointBtn'
  );

const cancelPointBtn =
  document.getElementById(
    'cancelPointBtn'
  );

const savePointBtn =
  document.getElementById(
    'savePointBtn'
  );

const pointNameInput =
  document.getElementById(
    'pointName'
  );

const pointDescriptionInput =
  document.getElementById(
    'pointDescription'
  );

const pointCategorySelect =
  document.getElementById(
    'pointCategory'
  );


// =====================================================
// BARVY
// =====================================================

const colorWheel =
  document.getElementById(
    'colorWheel'
  );

const colorWheelCursor =
  document.getElementById(
    'colorWheelCursor'
  );

const colorPresets =
  document.getElementById(
    'colorPresets'
  );

const colorPreview =
  document.getElementById(
    'colorPreview'
  );

const redInput =
  document.getElementById(
    'redInput'
  );

const greenInput =
  document.getElementById(
    'greenInput'
  );

const blueInput =
  document.getElementById(
    'blueInput'
  );


// =====================================================
// VELIKOST
// =====================================================

const pointSizeInput =
  document.getElementById(
    'pointSize'
  );

const pointSizeValue =
  document.getElementById(
    'pointSizeValue'
  );


// =====================================================
// MODAL KATEGORIE
// =====================================================

const categoryModal =
  document.getElementById(
    'categoryModal'
  );

const categoryNameInput =
  document.getElementById(
    'categoryName'
  );

const closeCategoryBtn =
  document.getElementById(
    'closeCategoryBtn'
  );

const cancelCategoryBtn =
  document.getElementById(
    'cancelCategoryBtn'
  );

const saveCategoryBtn =
  document.getElementById(
    'saveCategoryBtn'
  );


// =====================================================
// MAPA - PROMĚNNÉ
// =====================================================

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


// =====================================================
// PŘIDÁVÁNÍ BODU
// =====================================================

let addingPoint = false;

let pendingPoint = null;


// =====================================================
// BARVA
// =====================================================

const COLOR_PRESETS = [

  '#ff3b30',

  '#ff9500',

  '#ffcc00',

  '#34c759',

  '#007aff'

];


let selectedColor =
  COLOR_PRESETS[0];

let selectedSize = 6;


// HSV/HSL hodnoty pro kolečko

let wheelHue = 0;

let wheelSaturation = 1;

let wheelLightness = 0.5;

let colorWheelDragging = false;


// =====================================================
// ID
// =====================================================

function createId() {

  return (

    Date.now().toString() +

    Math.random()
      .toString(36)
      .slice(2)

  );

}


// =====================================================
// VÝCHOZÍ KATEGORIE
// =====================================================

const DEFAULT_CATEGORIES = [

  {
    id:
      createId(),

    name:
      '🗺️ Území',

    visible:
      true

  },

  {
    id:
      createId(),

    name:
      '💊 Prodej drog',

    visible:
      true

  },

  {
    id:
      createId(),

    name:
      '🚗 Záterasy autem',

    visible:
      true

  },

  {
    id:
      createId(),

    name:
      '🏍️ Ujíždění na motorce',

    visible:
      true

  }

];


// =====================================================
// NAČÍTÁNÍ KATEGORIÍ
// =====================================================

function loadCategories() {

  try {

    const saved =
      localStorage.getItem(
        'verdugosCategories'
      );


    if (!saved) {

      localStorage.setItem(
        'verdugosCategories',
        JSON.stringify(
          DEFAULT_CATEGORIES
        )
      );

      return [
        ...DEFAULT_CATEGORIES
      ];

    }


    const parsed =
      JSON.parse(saved);


    if (
      !Array.isArray(parsed) ||
      parsed.length === 0
    ) {

      localStorage.setItem(
        'verdugosCategories',
        JSON.stringify(
          DEFAULT_CATEGORIES
        )
      );

      return [
        ...DEFAULT_CATEGORIES
      ];

    }


    return parsed;

  }
  catch (error) {

    console.error(
      'Chyba při načítání kategorií:',
      error
    );

    return [
      ...DEFAULT_CATEGORIES
    ];

  }

}


let categories =
  loadCategories();


// =====================================================
// NAČÍTÁNÍ BODŮ
// =====================================================

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

  }
  catch (error) {

    console.error(
      'Chyba při načítání bodů:',
      error
    );

    return [];

  }

}


let points =
  loadPoints();


// =====================================================
// ULOŽENÍ
// =====================================================

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


// =====================================================
// MIGRACE STARÝCH KATEGORIÍ
// =====================================================

function migrateCategoryNames() {

  const replacements = {

    'Území':
      '🗺️ Území',

    'Prodej drog':
      '💊 Prodej drog',

    'Záterasy autem':
      '🚗 Záterasy autem',

    'Ujíždění na motorce':
      '🏍️ Ujíždění na motorce'

  };


  let changed = false;


  categories =
    categories.map(
      (category) => {

        if (
          replacements[
            category.name
          ]
        ) {

          changed = true;


          return {

            ...category,

            name:
              replacements[
                category.name
              ]

          };

        }


        return category;

      }
    );


  if (changed) {

    saveCategories();

  }

}


// =====================================================
// POČET BODŮ
// =====================================================

function countPoints(
  categoryId
) {

  return points.filter(

    (point) =>

      point.categoryId ===
      categoryId

  ).length;

}


// =====================================================
// VYKRESLENÍ KATEGORIÍ
// =====================================================

function renderCategories() {

  categoryList.innerHTML =
    '';


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


      /*
        Emoji je uložené v názvu.
        Samotná ikona je proto prázdná.
      */


      icon.textContent =
        '';


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


      // -----------------------------------
      // LEVÝ KLIK
      // -----------------------------------

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


      // -----------------------------------
      // PRAVÝ KLIK
      // -----------------------------------

      item.addEventListener(
        'contextmenu',
        (event) => {

          event.preventDefault();


          const amount =
            countPoints(
              category.id
            );


          let message =
            `Opravdu chceš smazat kategorii „${category.name}“?`;


          if (
            amount > 0
          ) {

            message +=
              `\n\nObsahuje ${amount} bodů. Tyto body budou také odstraněny.`;

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


// =====================================================
// SKRÝT / ZOBRAZIT VŠE
// =====================================================

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


// =====================================================
// MODAL KATEGORIE
// =====================================================

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


  const exists =
    categories.some(
      (category) =>
        category.name
          .toLowerCase() ===
        name.toLowerCase()
    );


  if (exists) {

    alert(
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


// =====================================================
// BARVY - RGB
// =====================================================

function clamp(
  value,
  min,
  max
) {

  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {

    return min;

  }


  return Math.max(
    min,
    Math.min(
      max,
      Math.round(number)
    )
  );

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

          Number(
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


function hexToRgb(hex) {

  const clean =
    hex.replace(
      '#',
      ''
    );


  return {

    r:
      parseInt(
        clean.slice(0,2),
        16
      ),

    g:
      parseInt(
        clean.slice(2,4),
        16
      ),

    b:
      parseInt(
        clean.slice(4,6),
        16
      )

  };

}


// =====================================================
// HSL -> RGB
// =====================================================

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
          t < 1/6
        ) {

          return (
            p +
            (
              q - p
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
              q - p
            ) *
            (
              2/3 - t
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
      2*l-q;


    r =
      hue2rgb(
        p,
        q,
        h + 1/3
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
        h - 1/3
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


// =====================================================
// RGB -> HSL
// =====================================================

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


  let h = 0;

  let s = 0;

  const l =
    (max+min)/2;


  if (
    max !== min
  ) {

    const d =
      max-min;


    s =
      l > 0.5

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


      case b:

        h =
          (
            r-g
          ) /
          d +
          4;

        break;

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


// =====================================================
// NASTAVENÍ RGB
// =====================================================

function setRgbValues(
  r,
  g,
  b
) {

  redInput.value =
    clamp(
      r,
      0,
      255
    );


  greenInput.value =
    clamp(
      g,
      0,
      255
    );


  blueInput.value =
    clamp(
      b,
      0,
      255
    );


  selectedColor =
    rgbToHex(
      redInput.value,
      greenInput.value,
      blueInput.value
    );


  updateColorPreview();

  renderColorPresets();

}


function updateColorFromRgb() {

  const r =
    clamp(
      redInput.value,
      0,
      255
    );


  const g =
    clamp(
      greenInput.value,
      0,
      255
    );


  const b =
    clamp(
      blueInput.value,
      0,
      255
    );


  selectedColor =
    rgbToHex(
      r,
      g,
      b
    );


  updateColorPreview();

  renderColorPresets();


  const hsl =
    rgbToHsl(
      r,
      g,
      b
    );


  wheelHue =
    hsl.h;

  wheelSaturation =
    hsl.s;

  wheelLightness =
    hsl.l;


  updateWheelBackground();

}


// =====================================================
// BAREVNÉ KOLEČKO
// =====================================================

function updateWheelBackground() {

  const currentHue =
    wheelHue;


  colorWheel.style.background =

    `
    conic-gradient(
      from 0deg,
      red,
      yellow,
      lime,
      cyan,
      blue,
      magenta,
      red
    )
    `;


  /*
    Posun ukazatele podle aktuálního
    odstínu a sytosti.
  */

  const rect =
    colorWheel.getBoundingClientRect();


  const radius =
    rect.width / 2;


  const distance =
    wheelSaturation *
    radius;


  const angle =
    (
      currentHue -
      90
    ) *
    Math.PI /
    180;


  const cursorX =
    radius +
    Math.cos(angle) *
    distance;


  const cursorY =
    radius +
    Math.sin(angle) *
    distance;


  colorWheelCursor.style.left =
    `${cursorX}px`;


  colorWheelCursor.style.top =
    `${cursorY}px`;

}


function pickColorFromWheel(
  event
) {

  const rect =
    colorWheel.getBoundingClientRect();


  const centerX =
    rect.width / 2;


  const centerY =
    rect.height / 2;


  const mouseX =
    event.clientX -
    rect.left;


  const mouseY =
    event.clientY -
    rect.top;


  const dx =
    mouseX-centerX;


  const dy =
    mouseY-centerY;


  const radius =
    Math.sqrt(
      dx*dx +
      dy*dy
    );


  const maxRadius =
    rect.width/2;


  const limitedRadius =
    Math.min(
      radius,
      maxRadius
    );


  let angle =
    Math.atan2(
      dy,
      dx
    ) *
    180 /
    Math.PI;


  /*
    Úhel převedeme na odstín.
  */

  angle += 90;


  if (
    angle < 0
  ) {

    angle += 360;

  }


  wheelHue =
    angle;


  /*
    Vzdálenost od středu
    určuje sytost.
  */

  wheelSaturation =
    limitedRadius /
    maxRadius;


  wheelLightness =
    0.5;


  const rgb =
    hslToRgb(
      wheelHue,
      wheelSaturation,
      wheelLightness
    );


  setRgbValues(
    rgb.r,
    rgb.g,
    rgb.b
  );


  /*
    Ukazatel položíme
    přesně na kurzor.
  */

  colorWheelCursor.style.left =
    `${mouseX}px`;


  colorWheelCursor.style.top =
    `${mouseY}px`;

}


// =====================================================
// MYŠ NA BAREVNÉM KOLEČKU
// =====================================================

colorWheel.addEventListener(
  'pointerdown',
  (event) => {

    colorWheelDragging =
      true;


    colorWheel.setPointerCapture(
      event.pointerId
    );


    pickColorFromWheel(
      event
    );

  }
);


colorWheel.addEventListener(
  'pointermove',
  (event) => {

    if (
      !colorWheelDragging
    ) {

      return;

    }


    pickColorFromWheel(
      event
    );

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


// =====================================================
// PRESET BARVY
// =====================================================

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

          const rgb =
            hexToRgb(
              color
            );


          setRgbValues(
            rgb.r,
            rgb.g,
            rgb.b
          );


          updateWheelBackground();

        }
      );


      colorPresets.appendChild(
        button
      );

    }
  );

}


function updateColorPreview() {

  colorPreview.style.backgroundColor =
    selectedColor;

}


// =====================================================
// VELIKOST
// =====================================================

function updateSizePreview() {

  selectedSize =
    Number(
      pointSizeInput.value
    );


  pointSizeValue.textContent =
    `${selectedSize} px`;

}


pointSizeInput.addEventListener(
  'input',
  updateSizePreview
);


// =====================================================
// SELECT KATEGORIÍ
// =====================================================

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
        category.name;


      pointCategorySelect.appendChild(
        option
      );

    }
  );

}


// =====================================================
// REŽIM PŘIDÁVÁNÍ BODU
// =====================================================

function startAddingPoint() {

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


function stopAddingPoint() {

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


// =====================================================
// OTEVŘENÍ FORMULÁŘE BODU
// =====================================================

function openPointModal() {

  renderCategorySelect();


  pointNameInput.value =
    '';


  pointDescriptionInput.value =
    '';


  pointSizeInput.value =
    6;


  selectedSize =
    6;


  pointSizeValue.textContent =
    '6 px';


  /*
    Výchozí barva
  */

  setRgbValues(
    255,
    59,
    48
  );


  const hsl =
    rgbToHsl(
      255,
      59,
      48
    );


  wheelHue =
    hsl.h;

  wheelSaturation =
    hsl.s;

  wheelLightness =
    hsl.l;


  renderCategorySelect();

  renderColorPresets();

  updateColorPreview();

  updateWheelBackground();


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


  setTimeout(
    () => {

      pointNameInput.focus();

    },
    50
  );

}


// =====================================================
// ZAVŘENÍ FORMULÁŘE BODU
// =====================================================

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


// =====================================================
// KLIK NA MAPU PRO VYTVOŘENÍ BODU
// =====================================================

function placePoint(
  event
) {

  if (!addingPoint) {

    return;

  }


  /*
    Ověříme, že jsme klikli
    opravdu na mapový obrázek.
  */

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


  /*
    Uložíme pozici v procentech.
    Díky tomu bude bod sedět i po zoomu.
  */

  pendingPoint = {

    x:
      (
        relativeX /
        rect.width
      ) *
      100,

    y:
      (
        relativeY /
        rect.height
      ) *
      100

  };


  stopAddingPoint();

  openPointModal();

}


// =====================================================
// ULOŽENÍ BODU
// =====================================================

function savePoint() {

  if (
    !pendingPoint
  ) {

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


  savePoints();


  renderPoints();

  renderCategories();


  closePointModal();

}


// =====================================================
// VYKRESLENÍ BODŮ
// =====================================================

function renderPoints() {

  pointsLayer.innerHTML =
    '';


  points.forEach(
    (point) => {

      const category =
        categories.find(
          (item) =>
            item.id ===
            point.categoryId
        );


      /*
        Pokud kategorie neexistuje,
        bod nevykreslíme.
      */

      if (!category) {

        return;

      }


      /*
        Pokud je kategorie skrytá,
        skryjeme i její body.
      */

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


      /*
        Starší body, které nemají
        uloženou velikost, dostanou 6 px.
      */

      const size =
        Number(
          point.size
        ) || 6;


      pointElement.style.width =
        `${size}px`;


      pointElement.style.height =
        `${size}px`;


      // -----------------------------------
      // TOOLTIP
      // -----------------------------------

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


      // -----------------------------------
      // PRAVÝ KLIK = SMAZÁNÍ
      // -----------------------------------

      pointElement.addEventListener(
        'contextmenu',
        (event) => {

          event.preventDefault();

          event.stopPropagation();


          const confirmed =
            window.confirm(
              `Opravdu chceš smazat bod „${point.name}“?`
            );


          if (!confirmed) {

            return;

          }


          points =
            points.filter(
              (item) =>
                item.id !==
                point.id
            );


          savePoints();

          renderPoints();

          renderCategories();

        }
      );


      pointsLayer.appendChild(
        pointElement
      );

    }
  );

}


// =====================================================
// EVENTY KATEGORIÍ
// =====================================================

addCategoryBtn.addEventListener(
  'click',
  openCategoryModal
);


toggleAllBtn.addEventListener(
  'click',
  toggleAllCategories
);


closeCategoryBtn.addEventListener(
  'click',
  closeCategoryModal
);


cancelCategoryBtn.addEventListener(
  'click',
  closeCategoryModal
);


saveCategoryBtn.addEventListener(
  'click',
  addCategory
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


// =====================================================
// EVENTY BODU
// =====================================================

addPointBtn.addEventListener(
  'click',
  startAddingPoint
);


closePointBtn.addEventListener(
  'click',
  closePointModal
);


cancelPointBtn.addEventListener(
  'click',
  closePointModal
);


savePointBtn.addEventListener(
  'click',
  savePoint
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


// =====================================================
// KLIK NA MAPU
// =====================================================

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


// =====================================================
// ESC
// =====================================================

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

      stopAddingPoint();

    }

  }
);


// =====================================================
// MAPA
// =====================================================

function renderMap() {

  canvas.style.transform =

    `translate(
      calc(-50% + ${x}px),
      calc(-50% + ${y}px)
    )
    scale(${scale})`;

}


// =====================================================
// ZOOM
// =====================================================

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


// =====================================================
// PLUS
// =====================================================

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


// =====================================================
// MÍNUS
// =====================================================

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


// =====================================================
// DOMŮ
// =====================================================

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


// =====================================================
// KOLEČKO = ZOOM
// =====================================================

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


// =====================================================
// TAŽENÍ MAPY
// =====================================================

viewport.addEventListener(
  'pointerdown',
  (event) => {

    /*
      Při přidávání bodu nechceme
      začít tahat mapu.
    */

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


// =====================================================
// KONEC TAŽENÍ
// =====================================================

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


// =====================================================
// START
// =====================================================

migrateCategoryNames();

renderCategories();

renderPoints();

renderColorPresets();

setRgbValues(
  255,
  59,
  48
);

updateSizePreview();

updateColorPreview();

renderMap();
