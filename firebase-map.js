
const map = document.getElementById("map");
const mapInner = document.getElementById("map-inner");

let scale = 1;
let originX = 0;
let originY = 0;

const keysPressed = {};

function updateTransform() {
  const step = 2 / scale;
  if (keysPressed['w']) originY += step;
  if (keysPressed['s']) originY -= step;
  if (keysPressed['a']) originX += step;
  if (keysPressed['d']) originX -= step;

  mapInner.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
}

setInterval(updateTransform, 16); // ~60fps

map.addEventListener("wheel", e => {
  e.preventDefault();
  const rect = map.getBoundingClientRect();
  const mouseX = rect.width / 2;
  const mouseY = rect.height / 2;

  const prevScale = scale;
  scale += e.deltaY * -0.001;
  scale = Math.min(Math.max(1, scale), 8);

  if (scale === 1) {
    originX = 0;
    originY = 0;
  } else {
    const dx = (mouseX - rect.left) / prevScale;
    const dy = (mouseY - rect.top) / prevScale;
    originX -= dx * (scale - prevScale);
    originY -= dy * (scale - prevScale);
  }

  mapInner.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
}, { passive: false });

window.addEventListener("keydown", e => {
  keysPressed[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
  keysPressed[e.key.toLowerCase()] = false;
});

window.onload = () => {
  scale = 1;
  originX = 0;
  originY = 0;
  mapInner.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
};
