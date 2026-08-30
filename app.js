const viewport = document.getElementById('mapViewport');
const canvas = document.getElementById('mapCanvas');

let scale = 1;
let x = 0;
let y = 0;
let dragging = false;

let startX = 0;
let startY = 0;
let startMapX = 0;
let startMapY = 0;

const MIN_SCALE = 0.45;
const MAX_SCALE = 4;

function render() {
  canvas.style.transform =
    `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`;
}

function zoomAt(nextScale, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();

  const pointerX =
    clientX - rect.left - rect.width / 2;

  const pointerY =
    clientY - rect.top - rect.height / 2;

  const oldScale = scale;

  scale = Math.max(
    MIN_SCALE,
    Math.min(MAX_SCALE, nextScale)
  );

  const ratio = scale / oldScale;

  x = pointerX - (pointerX - x) * ratio;
  y = pointerY - (pointerY - y) * ratio;

  render();
}

document.getElementById('zoomIn').addEventListener('click', () => {
  const rect = viewport.getBoundingClientRect();

  zoomAt(
    scale * 1.2,
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
});

document.getElementById('zoomOut').addEventListener('click', () => {
  const rect = viewport.getBoundingClientRect();

  zoomAt(
    scale / 1.2,
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
});

document.getElementById('resetView').addEventListener('click', () => {
  scale = 1;
  x = 0;
  y = 0;

  render();
});

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
  { passive: false }
);

viewport.addEventListener('pointerdown', (event) => {
  dragging = true;

  viewport.classList.add('is-dragging');

  startX = event.clientX;
  startY = event.clientY;

  startMapX = x;
  startMapY = y;

  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener('pointermove', (event) => {
  if (!dragging) return;

  x = startMapX + (event.clientX - startX);
  y = startMapY + (event.clientY - startY);

  render();
});

function stopDragging(event) {
  dragging = false;

  viewport.classList.remove('is-dragging');

  if (
    event &&
    viewport.hasPointerCapture(event.pointerId)
  ) {
    viewport.releasePointerCapture(event.pointerId);
  }
}

viewport.addEventListener('pointerup', stopDragging);
viewport.addEventListener('pointercancel', stopDragging);

render();
