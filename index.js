const ctx = document.querySelector('canvas').getContext('2d');
let state = null;

document.addEventListener('keydown', e => {
  console.log(e);
  if (e.code === 'KeyR') { document.querySelector('span').textContent = 0; init(); }
  if (e.code === 'Space') { state.canon.fire = true; }
  if (e.code === 'ArrowLeft') { state.canon.v = -1; return; }
  if (e.code === 'ArrowRight') { state.canon.v = 1; return; }
});

document.addEventListener('keyup', e => {
  if (e.code === 'Space') { state.canon.fire = false; }
  if (e.code === 'ArrowLeft' && state.canon.v === -1) { state.canon.v = 0; return; }
  if (e.code === 'ArrowRight' && state.canon.v === 1) { state.canon.v = 0; return; }
});

const rectsIntersect = (a, b) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;

const dropBomb = () => {
  let ready = false;
  while (!ready) {
    const randomCol = Math.floor(Math.random() * 10);
    for (let i = 4; i >= 0; i--) {
      if (!state.aliens[i][randomCol].dead) {
        state.bombs.push({ x: state.aliens[i][randomCol].x + 5, y: state.aliens[i][randomCol].y, w: 5, h: 5 });
        ready = true;
        break;
      }
    }
  }
};

const update = () => {
  const aliensFlat = state.aliens.flat();

  if (state.canon.fire && Date.now() - (state.lastS + state.freq) > 0) {
    state.shots.push({ x: state.canon.x + 4, y: state.canon.y, w: state.bW, h: state.bH });
    state.lastS = Date.now();
  }

  state.shots = state.shots.filter(s => s.y > 0 && !s.gone);
  state.bombs = state.bombs.filter(b => b.y < ctx.canvas.height);

  if (aliensFlat.some(a => !a.dead && (rectsIntersect(a, state.canon) || a.y + a.h >= ctx.canvas.height))) { state.over = true; return; }
  if (aliensFlat.every(a => a.dead)) { init(state.canon.x, state.canon.y, state.score, state.aV * 1.2); return; }
  if (aliensFlat.some(a => !a.dead && (a.x >= ctx.canvas.width - a.w || a.x <= 0))) {
    state.left = !state.left;
    state.aliens.forEach(r => r.forEach(c => c.y += state.drop));
  }

  state.shots.forEach(s => {
    s.y -= 1;
    const deadAlien = aliensFlat.findIndex(a => !a.dead && rectsIntersect(a, s));
    if (deadAlien >= 0) {
      const deadRow = Math.floor(deadAlien / 10);
      const deadCol = deadAlien - deadRow * 10;
      state.aliens[deadRow][deadCol].dead = true;
      s.gone = true;
      state.score += 1;
      document.querySelector('span').textContent = state.score;
    }
  });

  state.bombs.forEach(b => { b.y += 1; if (rectsIntersect(b, state.canon)) { state.over = true; return; }});

  if (Date.now() - (state.lastB + state.freq * 2) > 0) { state.lastB = Date.now(); dropBomb(); }
  state.aliens.forEach(r => r.forEach(c => { c.x = state.left ? c.x - state.aV : c.x + state.aV; }));

  state.canon.x += state.canon.v;
  if (state.canon.x < 0) { state.canon.x = 0; state.canon.v = 0; }
  if (state.canon.x > ctx.canvas.width - state.canon.w) { state.canon.x = ctx.canvas.width - state.canon.w; state.canon.v = 0; }
};

const draw = () => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.fillRect(state.canon.x, state.canon.y, 10, 10);
  state.shots.forEach(s => ctx.fillRect(s.x, s.y, s.w, s.h));
  state.bombs.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
  state.aliens.forEach(row => row.forEach(col => !col.dead && ctx.fillRect(col.x, col.y, col.w, col.h)));
};

const main = () => { if (!state.over) { update(); draw(); } requestAnimationFrame(main); };

const init = (cx = 125, cy = 375, s = 0, v = 0.5) => {
  state = { lastS: 0, lastB: 0, freq: 500, spacing: 20, aW: 15, aH: 10, bW: 2, bH: 2, aV: v, drop: 10, left: true, score: s, over: false };
  state.canon = { x: cx, y: cy, w: 10, h: 10, v: 0, fire: false };
  state.shots = [];
  state.bombs = [];
  state.aliens = [[], [], [], [], []];
  state.aliens.forEach((row, i) => {
    for (let j = 0; j < 10; j++) { row.push({ x: j * state.spacing, y: i * state.spacing, w: state.aW, h: state.aH }); }
  });
};

init();
main();
