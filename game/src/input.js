// Keyboard + mouse input. The hero steers with the mouse (chase view) or the
// arrow keys / WASD; W/S or Up/Down work the throttle, Space or click fires the
// blaster, P pauses, M mutes, R restarts, Enter starts.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouseX: 0.5, // normalised 0..1 across the canvas
    mouseY: 0.5,
    mouseDown: false,
    steerX: 0, // -1..1 from keys
    steerY: 0,
    throttleUp: false,
    throttleDown: false,
    fire: false,
    pressed: new Set(), // edge-triggered keys, consumed by the game each frame
  };

  function keyName(e) {
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (!keys.has(k)) input.pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - r.left) / r.width;
    input.mouseY = (e.clientY - r.top) / r.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    input.mouseDown = true;
    const r = canvas.getBoundingClientRect();
    input.mouseX = (e.clientX - r.left) / r.width;
    input.mouseY = (e.clientY - r.top) / r.height;
  });
  window.addEventListener('mouseup', () => { input.mouseDown = false; });

  input.poll = () => {
    const k = keys;
    input.steerX = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0);
    input.steerY = (k.has('arrowup') || k.has('w') ? 1 : 0) - (k.has('arrowdown') || k.has('s') ? 1 : 0);
    input.throttleUp = k.has('w') || k.has('arrowup');
    input.throttleDown = k.has('s') || k.has('arrowdown');
    input.fire = k.has(' ') || input.mouseDown;
  };

  input.consume = (name) => {
    if (input.pressed.has(name)) { input.pressed.delete(name); return true; }
    return false;
  };
  input.clearPressed = () => input.pressed.clear();
  return input;
}
