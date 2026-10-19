(() => {
  'use strict';

  const W = 200;
  const H = 116;
  const SCALE = 3;
  const EMPTY = 0;
  const $ = (id) => document.getElementById(id);
  const canvas = $('particleCanvas');
  const screenCtx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const renderCanvas = document.createElement('canvas');
  renderCanvas.width = W; renderCanvas.height = H;
  const ctx = renderCanvas.getContext('2d', { alpha: false, desynchronized: true, willReadFrequently: true });
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;

  const elements = [
    { id: 1, key: 'dust', name: 'Star Dust', group: 'matter', symbol: '✦', color: '#d9b9ff', desc: 'Fine cosmic grains fall and gather into glowing dunes.', behavior: 'powder', density: 2 },
    { id: 2, key: 'sand', name: 'Sand', group: 'matter', symbol: '◈', color: '#f2c66d', desc: 'Golden grains cascade, pile up, and settle into slopes.', behavior: 'powder', density: 3 },
    { id: 3, key: 'water', name: 'Water', group: 'liquid', symbol: '◒', color: '#59cfff', desc: 'A cool, flowing liquid that puts out fire and cools lava.', behavior: 'liquid', density: 3 },
    { id: 4, key: 'oil', name: 'Cosmic Oil', group: 'liquid', symbol: '●', color: '#e7a2ff', desc: 'A light, slippery fluid. It floats on water and catches fire.', behavior: 'liquid', density: 1 },
    { id: 5, key: 'acid', name: 'Acid', group: 'liquid', symbol: '◉', color: '#9cff76', desc: 'Reactive green acid slowly eats through many materials.', behavior: 'acid', density: 3 },
    { id: 6, key: 'stone', name: 'Moon Rock', group: 'matter', symbol: '⬢', color: '#9ca8c6', desc: 'A sturdy rock for dams, towers, and little lunar caves.', behavior: 'solid', density: 5 },
    { id: 7, key: 'wall', name: 'Void Wall', group: 'matter', symbol: '▦', color: '#667094', desc: 'An indestructible boundary to contain your experiments.', behavior: 'solid', density: 9 },
    { id: 8, key: 'wood', name: 'Driftwood', group: 'matter', symbol: '▰', color: '#d99b72', desc: 'Light organic matter that can burn when exposed to heat.', behavior: 'solid', density: 4 },
    { id: 9, key: 'plant', name: 'Xeno Flora', group: 'life', symbol: '❋', color: '#61efb1', desc: 'Alien greenery grows slowly near water and burns near fire.', behavior: 'plant', density: 2 },
    { id: 10, key: 'fire', name: 'Stardust Fire', group: 'energy', symbol: '✹', color: '#ff966d', desc: 'Bright flame that rises, spreads to fuel, then fades to smoke.', behavior: 'fire', density: 0 },
    { id: 11, key: 'lava', name: 'Magma', group: 'energy', symbol: '✺', color: '#ff5d72', desc: 'Heavy molten rock. It glows, burns plants, and steams water.', behavior: 'lava', density: 5 },
    { id: 12, key: 'smoke', name: 'Nebula Smoke', group: 'energy', symbol: '☁', color: '#9da0c7', desc: 'Soft plumes drift upward and slowly dissolve into the void.', behavior: 'gas', density: 0 },
    { id: 13, key: 'steam', name: 'Steam', group: 'energy', symbol: '≋', color: '#a7e8f7', desc: 'Warm vapor rises from water touched by fire or magma.', behavior: 'gas', density: 0 },
    { id: 14, key: 'ice', name: 'Cryo Ice', group: 'matter', symbol: '❄', color: '#9beeff', desc: 'A brittle frozen block that melts near intense heat.', behavior: 'ice', density: 4 },
    { id: 15, key: 'crystal', name: 'Prism Crystal', group: 'matter', symbol: '✧', color: '#c79bff', desc: 'A luminous mineral. Plasma can crystallize dust into more.', behavior: 'solid', density: 5 },
    { id: 16, key: 'metal', name: 'Meteor Iron', group: 'matter', symbol: '⬡', color: '#adb9d6', desc: 'Dense alien metal that resists acid and heat.', behavior: 'solid', density: 7 },
    { id: 17, key: 'plasma', name: 'Plasma', group: 'energy', symbol: 'ϟ', color: '#ff89ed', desc: 'Unstable stellar energy rises and transforms nearby particles.', behavior: 'plasma', density: 0 },
    { id: 18, key: 'void', name: 'Void Core', group: 'energy', symbol: '◉', color: '#8188ff', desc: 'A tiny black-hole seed that swallows nearby matter.', behavior: 'void', density: 9 }
  ];
  const byId = [null, ...elements];
  const byKey = Object.fromEntries(elements.map(e => [e.key, e]));
  const worlds = {
    nebula: { label: 'NEBULA REACH', top: '#080b21', mid: '#16133b', low: '#080e20', nebulaA: 'rgba(113,63,202,.26)', nebulaB: 'rgba(26,145,184,.14)', star: '#c9d7ff' },
    arctic: { label: 'FROST MOON', top: '#061728', mid: '#0d3451', low: '#071522', nebulaA: 'rgba(55,182,225,.24)', nebulaB: 'rgba(121,222,244,.12)', star: '#d4f7ff' },
    ember: { label: 'EMBERFALL', top: '#1c0a23', mid: '#40162f', low: '#100b20', nebulaA: 'rgba(240,74,90,.22)', nebulaB: 'rgba(255,159,72,.13)', star: '#ffe4cc' },
    ocean: { label: 'DEEP CURRENT', top: '#041722', mid: '#0b2a45', low: '#061221', nebulaA: 'rgba(24,176,168,.2)', nebulaB: 'rgba(54,111,220,.14)', star: '#c3fff5' }
  };

  const cells = new Uint8Array(W * H);
  const age = new Uint16Array(W * H);
  const movedAt = new Uint32Array(W * H);
  let stepNumber = 0;
  let selectedKey = 'dust';
  let selectedId = 1;
  let activeFilter = 'all';
  let activeWorld = 'nebula';
  let brushSize = 5;
  let tool = 'brush';
  let running = true;
  let showGlow = true;
  let showGrid = false;
  let reducedMotion = false;
  let isDrawing = false;
  let strokeStart = null;
  let lastPointer = null;
  let snapshot = null;
  let toastTimer = 0;
  let lastFrameTime = 0;
  let lastTickTime = 0;
  let fpsFrames = 0;
  let fpsStart = performance.now();
  let fps = 60;
  let lastUIUpdate = 0;
  let sdkInitialized = false;
  let sdkPlaying = false;

  const stars = Array.from({ length: 100 }, (_, i) => ({
    x: (Math.sin(i * 9283.17) * 10000 % 1 + 1) % 1 * W,
    y: (Math.sin(i * 1729.31 + 17) * 10000 % 1 + 1) % 1 * H,
    r: i % 9 === 0 ? 0.7 : 0.35 + (i % 4) * 0.12,
    phase: i * 0.67,
    bright: 0.22 + (i % 7) * 0.07
  }));

  const hexRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mixHex = (hex, amount) => {
    const [r, g, b] = hexRgb(hex);
    const f = amount >= 0 ? 255 : 0;
    const a = Math.abs(amount);
    return `rgb(${Math.round(r + (f-r)*a)},${Math.round(g + (f-g)*a)},${Math.round(b + (f-b)*a)})`;
  };
  const index = (x, y) => y * W + x;
  const inBounds = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
  const isLiquid = (id) => id === 3 || id === 4 || id === 5 || id === 11;
  const isFuel = (id) => id === 8 || id === 9 || id === 4 || id === 1 || id === 2;
  const isHot = (id) => id === 10 || id === 11 || id === 17;
  const isProtected = (id) => id === 7 || id === 16 || id === 15 || id === 18;

  function toast(message, actionLabel = '', action = null) {
    const box = $('toast');
    $('toastMessage').textContent = message;
    const button = $('toastAction');
    button.hidden = !actionLabel;
    button.textContent = actionLabel || '';
    button.onclick = action || null;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('show'), 3300);
  }

  function saveSnapshot() {
    snapshot = { cells: cells.slice(), age: age.slice() };
    $('undoBtn').disabled = false;
  }

  function undo() {
    if (!snapshot) return;
    const currentCells = cells.slice();
    const currentAge = age.slice();
    cells.set(snapshot.cells);
    age.set(snapshot.age);
    snapshot = { cells: currentCells, age: currentAge };
    $('undoBtn').disabled = false;
    toast('Last change undone.');
    updateStats();
  }

  function setParticle(x, y, id, life = 0) {
    if (!inBounds(x, y)) return;
    const i = index(x, y);
    cells[i] = id;
    age[i] = life || (id === 10 ? 2 + Math.random() * 12 : id === 11 ? 0 : 0);
    movedAt[i] = stepNumber;
  }

  function replaceParticle(i, id, life = 0) {
    cells[i] = id;
    age[i] = life;
    movedAt[i] = stepNumber;
  }

  function moveParticle(from, to) {
    const a = cells[from], b = cells[to];
    const aa = age[from], ab = age[to];
    cells[to] = a; age[to] = aa;
    cells[from] = b; age[from] = ab;
    movedAt[from] = stepNumber; movedAt[to] = stepNumber;
  }

  function targetCanBeEntered(sourceId, targetId) {
    if (targetId === EMPTY) return true;
    if (!isLiquid(targetId) && targetId !== 12 && targetId !== 13) return false;
    if (sourceId === 1 || sourceId === 2) return true;
    if (isLiquid(sourceId) && isLiquid(targetId)) {
      return byId[sourceId].density > byId[targetId].density && sourceId !== 4;
    }
    return false;
  }

  function tryMove(i, x, y, dx, dy, sourceId) {
    const nx = x + dx, ny = y + dy;
    if (!inBounds(nx, ny)) return false;
    const to = index(nx, ny);
    if (movedAt[to] === stepNumber) return false;
    if (!targetCanBeEntered(sourceId, cells[to])) return false;
    moveParticle(i, to);
    return true;
  }

  function neighbors(x, y, callback) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (inBounds(nx, ny)) callback(nx, ny, index(nx, ny), dx, dy);
      }
    }
  }

  function updateParticle(i, x, y, id) {
    const direction = ((x + y + stepNumber) & 1) ? 1 : -1;
    const downY = y + 1;
    if (id === 1 || id === 2) {
      if (tryMove(i, x, y, 0, 1, id)) return;
      if (Math.random() < 0.5) {
        if (tryMove(i, x, y, direction, 1, id) || tryMove(i, x, y, -direction, 1, id)) return;
      } else if (tryMove(i, x, y, -direction, 1, id) || tryMove(i, x, y, direction, 1, id)) return;
      if (id === 1 && Math.random() < 0.012 && inBounds(x + direction, y) && cells[index(x + direction, y)] === EMPTY) tryMove(i, x, y, direction, 0, id);
      return;
    }
    if (id === 5) {
      neighbors(x, y, (nx, ny, ni) => {
        const n = cells[ni];
        if (n === 3) { if (Math.random() < 0.05) replaceParticle(i, 13, 0); }
        else if (n !== 0 && !isProtected(n) && n !== 5 && n !== 13 && Math.random() < 0.02) {
          replaceParticle(ni, EMPTY, 0);
          if (Math.random() < 0.12) replaceParticle(i, EMPTY, 0);
        }
      });
      if (cells[i] !== 5) return;
    }
    if (id === 11) {
      neighbors(x, y, (nx, ny, ni) => {
        const n = cells[ni];
        if (n === 3) { replaceParticle(ni, 13, 0); if (Math.random() < 0.68) replaceParticle(i, 6, 0); }
        else if (isFuel(n) && Math.random() < 0.055) replaceParticle(ni, 10, 2);
        else if (n === 14 && Math.random() < 0.12) replaceParticle(ni, 3, 0);
      });
      if (cells[i] !== 11) return;
    }
    if (id === 3 || id === 4 || id === 5 || id === 11) {
      if (id === 4 && inBounds(x, downY) && cells[index(x, downY)] === 3) {
        if (Math.random() < 0.06) tryMove(i, x, y, 0, -1, id);
      } else if (tryMove(i, x, y, 0, 1, id)) return;
      if (Math.random() < 0.7 && (tryMove(i, x, y, direction, 1, id) || tryMove(i, x, y, -direction, 1, id))) return;
      const spread = id === 11 ? 1 : id === 5 ? 3 : 4;
      if (Math.random() < (id === 11 ? 0.48 : 0.83)) {
        const side = Math.random() < 0.5 ? direction : -direction;
        for (let s = 1; s <= spread; s++) {
          if (!inBounds(x + side * s, y)) break;
          const target = index(x + side * s, y);
          if (cells[target] === EMPTY && movedAt[target] !== stepNumber) {
            moveParticle(i, target); return;
          }
          if (cells[target] !== EMPTY) break;
        }
      }
      // In the Arctic world, a small fraction of still water freezes.
      if (id === 3 && activeWorld === 'arctic' && Math.random() < 0.0004) replaceParticle(i, 14, 0);
      return;
    }
    if (id === 10) {
      age[i]++;
      let fueled = false;
      neighbors(x, y, (nx, ny, ni) => {
        const neighbor = cells[ni];
        if (neighbor === 3) {
          if (Math.random() < 0.18) { replaceParticle(ni, 13, 2); fueled = true; }
        } else if ((neighbor === 8 || neighbor === 9 || neighbor === 4 || neighbor === 1 || neighbor === 2) && Math.random() < (neighbor === 4 ? 0.12 : 0.025)) {
          replaceParticle(ni, 10, 1 + Math.random() * 8); fueled = true;
        } else if (neighbor === 14 && Math.random() < 0.12) replaceParticle(ni, 3, 0);
      });
      if (age[i] > (fueled ? 55 : 24) + Math.random() * 15) { replaceParticle(i, Math.random() < 0.7 ? 12 : EMPTY, 0); return; }
      if (Math.random() < 0.16 && tryMove(i, x, y, 0, -1, id)) return;
      if (Math.random() < 0.16 && (tryMove(i, x, y, direction, -1, id) || tryMove(i, x, y, -direction, -1, id))) return;
      return;
    }
    if (id === 12 || id === 13) {
      age[i]++;
      if (age[i] > (id === 12 ? 42 : 32) + Math.random() * 28) { replaceParticle(i, EMPTY, 0); return; }
      if (tryMove(i, x, y, 0, -1, id)) return;
      const side = Math.random() < 0.5 ? direction : -direction;
      if (Math.random() < 0.55 && (tryMove(i, x, y, side, -1, id) || tryMove(i, x, y, -side, -1, id))) return;
      if (Math.random() < 0.25) tryMove(i, x, y, side, 0, id);
      return;
    }
    if (id === 9) {
      let hasWater = false;
      neighbors(x, y, (nx, ny, ni) => {
        if (isHot(cells[ni]) && Math.random() < 0.15) replaceParticle(i, 10, 3);
        if (cells[ni] === 3) hasWater = true;
      });
      if (cells[i] !== 9 || !hasWater) return;
      if (Math.random() < 0.012) {
        const growDir = Math.random() < 0.68 ? -1 : (Math.random() < 0.5 ? -1 : 1);
        const nx = x + (Math.random() < 0.5 ? -1 : 1), ny = y + growDir;
        if (inBounds(nx, ny) && cells[index(nx, ny)] === EMPTY) replaceParticle(index(nx, ny), 9, 0);
      }
      return;
    }
    if (id === 14) {
      let heated = false;
      neighbors(x, y, (nx, ny, ni) => { if (cells[ni] === 10 || cells[ni] === 11 || cells[ni] === 17) heated = true; });
      if (heated && Math.random() < 0.13) replaceParticle(i, 3, 0);
      return;
    }
    if (id === 17) {
      age[i]++;
      if (age[i] > 20 + Math.random() * 20) { replaceParticle(i, 12, 0); return; }
      neighbors(x, y, (nx, ny, ni) => {
        const n = cells[ni];
        if (n === 1 || n === 2) { if (Math.random() < 0.13) replaceParticle(ni, 15, 0); }
        else if (n === 3) { if (Math.random() < 0.25) replaceParticle(ni, 13, 0); }
        else if (n === 8 || n === 9 || n === 4) { if (Math.random() < 0.08) replaceParticle(ni, 10, 1); }
      });
      if (Math.random() < 0.2 && tryMove(i, x, y, 0, -1, id)) return;
      if (Math.random() < 0.2 && (tryMove(i, x, y, direction, -1, id) || tryMove(i, x, y, -direction, -1, id))) return;
      return;
    }
    if (id === 18) {
      neighbors(x, y, (nx, ny, ni) => {
        if (cells[ni] !== 0 && cells[ni] !== 7 && cells[ni] !== 18 && Math.random() < 0.24) replaceParticle(ni, EMPTY, 0);
      });
    }
    // Stone, wall, wood, crystal and metal are intentionally stationary.
  }

  function tickSimulation() {
    stepNumber++;
    const odd = stepNumber & 1;
    for (let y = H - 1; y >= 0; y--) {
      const start = ((y + odd) & 1) ? W - 1 : 0;
      const end = start === 0 ? W : -1;
      const dx = start === 0 ? 1 : -1;
      for (let x = start; x !== end; x += dx) {
        const i = index(x, y);
        if (movedAt[i] === stepNumber) continue;
        const id = cells[i];
        if (!id) continue;
        updateParticle(i, x, y, id);
      }
    }
  }

  function makeTerrain() {
    cells.fill(0); age.fill(0); movedAt.fill(0);
    // A gentle sandy shelf with an irregular profile.
    for (let x = 0; x < W; x++) {
      const hill = Math.floor(9 + 5 * Math.sin(x * 0.048) + 2 * Math.sin(x * 0.13));
      for (let y = H - hill; y < H; y++) {
        if (y >= H - 2 || Math.random() > 0.15) setParticle(x, y, Math.random() < 0.12 ? 6 : 2);
      }
    }
    // A visible little pool inside the shelf, with a stepped sand bank.
    const poolLeft = 128, poolRight = 164;
    for (let x = poolLeft; x <= poolRight; x++) {
      const edge = Math.min(x - poolLeft, poolRight - x);
      const surface = H - 5 - Math.min(5, Math.floor(edge / 4));
      for (let y = H - 12; y < H - 2; y++) {
        if (y < surface) continue;
        if (x < poolLeft + 2 || x > poolRight - 2 || y >= H - 3) setParticle(x, y, 2);
        else setParticle(x, y, 3);
      }
    }
    for (let x = 38; x < 50; x++) {
      const top = H - 15 - Math.floor(Math.sin((x - 38) / 12 * Math.PI) * 4);
      for (let y = top; y < H - 8; y++) if (Math.random() > 0.12) setParticle(x, y, 6);
    }
    // Xeno flora sprouts out of the sand.
    [[24,H-14],[27,H-16],[31,H-14],[72,H-13],[75,H-16],[79,H-14],[174,H-14],[179,H-16]].forEach(([x,y], n) => {
      setParticle(x,y,9); if (n % 2 === 0) setParticle(x+1,y+1,9);
    });
    // Crystal formations are small colored highlights.
    [[48,H-18],[49,H-19],[50,H-18],[104,H-13],[105,H-14],[106,H-13],[W-30,H-16],[W-29,H-17]].forEach(([x,y]) => setParticle(x,y,15));
    // A modest magma pocket, safely walled by stone.
    for (let x = W - 16; x < W - 5; x++) {
      setParticle(x,H-7,6); setParticle(x,H-6,6);
      if (x > 205 && x < 214) { setParticle(x,H-5,11); setParticle(x,H-4,11); }
    }
    // Sprinkle a little dust overhead for a living first frame.
    for (let k = 0; k < 54; k++) {
      const x = 18 + Math.floor(Math.random() * (W - 36));
      const y = 8 + Math.floor(Math.random() * 30);
      if (cells[index(x,y)] === 0) setParticle(x,y, Math.random() < .72 ? 1 : 2);
    }
    render(); updateStats();
  }

  function drawBackground() {
    const world = worlds[activeWorld];
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, world.top); bg.addColorStop(.54, world.mid); bg.addColorStop(1, world.low);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (!reducedMotion) {
      const g1 = ctx.createRadialGradient(W * .29, H * .26, 1, W * .29, H * .26, W * .62);
      g1.addColorStop(0, world.nebulaA); g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
      const g2 = ctx.createRadialGradient(W * .8, H * .6, 1, W * .8, H * .6, W * .44);
      g2.addColorStop(0, world.nebulaB); g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    }
    for (const s of stars) {
      const twinkle = reducedMotion ? .8 : .55 + .45 * Math.sin(stepNumber * .055 + s.phase);
      ctx.globalAlpha = s.bright * twinkle;
      ctx.fillStyle = world.star;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (s.r > .65 && showGlow && !reducedMotion) {
        ctx.globalAlpha = .12 * twinkle;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // A soft atmospheric horizon gives the sandbox depth without blocking play.
    const horizon = ctx.createLinearGradient(0, H - 24, 0, H);
    horizon.addColorStop(0, 'rgba(64,78,147,0)'); horizon.addColorStop(1, 'rgba(26,35,79,.13)');
    ctx.fillStyle = horizon; ctx.fillRect(0, H - 24, W, 24);
    if (showGrid) {
      ctx.strokeStyle = 'rgba(151,173,255,.09)'; ctx.lineWidth = .35;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = 0; y <= H; y += 10) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }
  }

  const colorCache = [null, ...elements.map(el => hexRgb(el.color))];
  const glowIds = new Set([10, 11, 15, 17, 18]);

  function brightenPixel(data, x, y, rgb, strength) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const p = (y * W + x) * 4;
    data[p] = Math.min(255, data[p] + (rgb[0] - data[p]) * strength);
    data[p + 1] = Math.min(255, data[p + 1] + (rgb[1] - data[p + 1]) * strength);
    data[p + 2] = Math.min(255, data[p + 2] + (rgb[2] - data[p + 2]) * strength);
  }

  function render() {
    drawBackground();
    const image = ctx.getImageData(0, 0, W, H);
    const data = image.data;
    // Composite subtle colored light into neighboring pixels before the sharp particle pass.
    if (showGlow && !reducedMotion) {
      for (let i = 0; i < cells.length; i++) {
        const id = cells[i];
        if (!glowIds.has(id)) continue;
        const x = i % W, y = (i / W) | 0, rgb = colorCache[id];
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const d2 = dx * dx + dy * dy;
            if (d2 === 0 || d2 > 5) continue;
            brightenPixel(data, x + dx, y + dy, rgb, d2 <= 1 ? .12 : .045);
          }
        }
      }
    }
    // A typed pixel buffer is much faster than issuing a canvas draw call for every grain.
    for (let i = 0; i < cells.length; i++) {
      const id = cells[i];
      if (!id) continue;
      const p = i * 4, base = colorCache[id];
      let r = base[0], g = base[1], b = base[2];
      const tone = ((i * 17 + (i >> 3) * 31) % 13) / 100;
      let mix = 0;
      if (id === 3 || id === 4 || id === 5) mix = tone;
      else if (id === 6 || id === 7 || id === 16) mix = tone - .045;
      else if (id === 10 || id === 11 || id === 15 || id === 17) mix = tone + .035;
      if (mix >= 0) { r += (255-r)*mix; g += (255-g)*mix; b += (255-b)*mix; }
      else { r *= 1+mix; g *= 1+mix; b *= 1+mix; }
      if ((id === 15 || id === 17) && (i + stepNumber) % 11 === 0) { r = Math.min(255,r+28); g = Math.min(255,g+22); b = Math.min(255,b+28); }
      data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255;
      // Add a restrained one-pixel highlight to solids and crystals.
      if ((id === 6 || id === 7 || id === 15 || id === 16) && i >= W) {
        const above = p - W * 4;
        if (cells[i - W] === id) { data[above] = Math.min(255,data[above]+7); data[above+1] = Math.min(255,data[above+1]+7); data[above+2] = Math.min(255,data[above+2]+7); }
      }
    }
    ctx.putImageData(image, 0, 0);
    screenCtx.imageSmoothingEnabled = true;
    screenCtx.clearRect(0, 0, canvas.width, canvas.height);
    screenCtx.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
  }

  function updateStats() {
    let count = 0;
    for (let i = 0; i < cells.length; i++) if (cells[i]) count++;
    $('particleCount').textContent = count.toLocaleString();
    $('fpsCount').textContent = String(fps);
    $('runStatus').textContent = running ? 'SIMULATION LIVE' : 'SIMULATION PAUSED';
    $('runStatus').previousElementSibling.style.background = running ? '#52eab5' : '#f0c66d';
  }

  function animationLoop(now) {
    requestAnimationFrame(animationLoop);
    if (document.hidden) return;
    if (!lastTickTime || now - lastTickTime >= 1000 / 30) {
      if (running) tickSimulation();
      render();
      fpsFrames++;
      lastTickTime = now;
    }
    if (now - fpsStart >= 1000) {
      fps = Math.round((fpsFrames * 1000) / (now - fpsStart)); fpsFrames = 0; fpsStart = now;
    }
    if (now - lastUIUpdate > 650) { updateStats(); lastUIUpdate = now; }
    lastFrameTime = now;
  }

  function drawAt(gx, gy, id = selectedId, size = brushSize) {
    const r = Math.max(1, Math.round(size / 2));
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + .7) continue;
        const x = gx + dx, y = gy + dy;
        if (!inBounds(x, y)) continue;
        const i = index(x, y);
        if (tool === 'eraser' || id === EMPTY) {
          cells[i] = EMPTY; age[i] = 0;
        } else if (Math.random() > .1 || size < 4) {
          // Painting replaces existing matter, except that the Void Wall blocks other elements.
          if (cells[i] !== 7 || id === 7) {
            cells[i] = id; age[i] = id === 10 ? Math.floor(Math.random() * 6) : 0;
          }
        }
      }
    }
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(W - 1, Math.floor((event.clientX - rect.left) / rect.width * W))),
      y: Math.max(0, Math.min(H - 1, Math.floor((event.clientY - rect.top) / rect.height * H)))
    };
  }

  function paintLine(from, to, id) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(from.x + dx * s / steps), y = Math.round(from.y + dy * s / steps);
      drawAt(x, y, id);
    }
  }

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault(); canvas.focus({ preventScroll: true });
    saveSnapshot();
    isDrawing = true; lastPointer = pointFromEvent(event); strokeStart = lastPointer;
    if (event.button === 2) { drawAt(lastPointer.x, lastPointer.y, EMPTY); }
    else if (tool === 'line') { drawAt(lastPointer.x, lastPointer.y, selectedId); }
    else { drawAt(lastPointer.x, lastPointer.y, selectedId); }
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!isDrawing || !lastPointer) return;
    const p = pointFromEvent(event);
    if (tool === 'line' && event.buttons !== 2) {
      render();
      // A live line preview is deliberately not stamped into the field until release.
      const rect = canvas.getBoundingClientRect();
      screenCtx.save(); screenCtx.scale(SCALE, SCALE);
      screenCtx.strokeStyle = 'rgba(206,196,255,.7)'; screenCtx.lineWidth = .65; screenCtx.setLineDash([1.6, 1.8]);
      screenCtx.beginPath(); screenCtx.moveTo(strokeStart.x, strokeStart.y); screenCtx.lineTo(p.x, p.y); screenCtx.stroke(); screenCtx.restore();
    } else {
      const id = event.buttons === 2 ? EMPTY : selectedId;
      paintLine(lastPointer, p, id);
    }
    lastPointer = p;
  });
  function endDrawing(event) {
    if (!isDrawing) return;
    const p = pointFromEvent(event);
    if (tool === 'line' && event.button !== 2 && strokeStart) paintLine(strokeStart, p, selectedId);
    isDrawing = false; lastPointer = null; strokeStart = null;
    render(); updateStats();
  }
  canvas.addEventListener('pointerup', endDrawing);
  canvas.addEventListener('pointercancel', () => { isDrawing = false; lastPointer = null; strokeStart = null; });
  // Browser-level pointer capture also keeps strokes intact when the cursor crosses the canvas edge.

  function selectElement(key) {
    if (!byKey[key]) return;
    selectedKey = key; selectedId = byKey[key].id;
    if (tool === 'eraser') setTool('brush');
    document.querySelectorAll('.element-button').forEach(btn => {
      const selected = btn.dataset.key === key;
      btn.classList.toggle('selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    const el = byKey[key];
    $('selectedSymbol').textContent = el.symbol; $('selectedSymbol').style.color = el.color;
    $('selectedName').textContent = el.name; $('selectedDesc').textContent = el.desc;
    $('brushReadout').textContent = `BRUSH · ${brushSize}`;
  }

  function buildElementButtons() {
    const grid = $('elementGrid'); grid.innerHTML = '';
    const search = $('elementSearch').value.trim().toLowerCase();
    const visible = elements.filter(el => (activeFilter === 'all' || el.group === activeFilter) && (!search || `${el.name} ${el.key} ${el.group}`.toLowerCase().includes(search)));
    for (const el of visible) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'element-button' + (el.key === selectedKey ? ' selected' : '');
      btn.dataset.key = el.key; btn.setAttribute('aria-pressed', el.key === selectedKey ? 'true' : 'false');
      btn.title = `${el.name}: ${el.desc}`;
      const visual = document.createElement('span'); visual.className = 'element-visual'; visual.textContent = el.symbol; visual.style.color = el.color;
      const label = document.createElement('span'); label.className = 'element-title'; label.textContent = el.name;
      btn.append(visual, label); btn.addEventListener('click', () => selectElement(el.key)); grid.append(btn);
    }
    if (!visible.length) {
      const empty = document.createElement('p'); empty.style.cssText = 'grid-column:1/-1;font-size:10px;color:#7e86a5;line-height:1.6;padding:10px 4px'; empty.textContent = 'No elements match that search.'; grid.append(empty);
    }
    // UI may be filtered; keep the selected element card accurate even when it is hidden.
  }

  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('active', active); btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    buildElementButtons();
  }

  function setTool(next) {
    tool = next;
    $('brushTool').classList.toggle('active', next === 'brush');
    $('eraseTool').classList.toggle('active', next === 'eraser');
    $('lineTool').classList.toggle('active', next === 'line');
    canvas.style.cursor = next === 'eraser' ? 'cell' : next === 'line' ? 'crosshair' : 'crosshair';
    if (next === 'eraser') toast('Eraser ready. Draw over particles to remove them.');
  }

  function setPaused(paused) {
    running = !paused;
    $('pauseLabel').textContent = running ? 'Pause' : 'Resume';
    $('pauseBtn').querySelector('.pause-glyph').textContent = running ? 'Ⅱ' : '▶';
    if (running) startCrazyGameplay(); else stopCrazyGameplay();
    updateStats();
  }

  function chooseWorld(key) {
    if (!worlds[key]) return;
    activeWorld = key;
    document.querySelectorAll('.world-card').forEach(btn => btn.classList.toggle('selected', btn.dataset.world === key));
    $('worldLabel').textContent = worlds[key].label;
    toast(`${worlds[key].label.toLowerCase().replace(/^./, s => s.toUpperCase())} selected.`);
    render();
  }

  function clearField() {
    saveSnapshot();
    cells.fill(0); age.fill(0); movedAt.fill(0);
    render(); updateStats();
    toast('Field cleared.', 'Undo', undo);
  }

  function saveScene() {
    try {
      const payload = { version: 1, width: W, height: H, cells: Array.from(cells), age: Array.from(age), world: activeWorld, selected: selectedKey, brushSize, savedAt: new Date().toISOString() };
      localStorage.setItem('cosmicdust-scene-v1', JSON.stringify(payload));
      toast('Scene saved in this browser.');
    } catch (err) {
      toast('Could not save here. Your browser may block local storage.');
    }
  }

  function loadScene() {
    try {
      const raw = localStorage.getItem('cosmicdust-scene-v1');
      if (!raw) { toast('No saved scene yet. Use Save first.'); return; }
      const payload = JSON.parse(raw);
      if (payload.version !== 1 || payload.width !== W || payload.height !== H || !Array.isArray(payload.cells) || payload.cells.length !== cells.length) throw new Error('Scene is incompatible');
      saveSnapshot();
      cells.set(payload.cells); if (Array.isArray(payload.age) && payload.age.length === age.length) age.set(payload.age); else age.fill(0);
      chooseWorld(worlds[payload.world] ? payload.world : 'nebula');
      if (byKey[payload.selected]) selectElement(payload.selected);
      if (payload.brushSize) setBrush(Number(payload.brushSize));
      render(); updateStats(); toast('Your saved scene is back.');
    } catch (err) {
      console.warn('Could not load CosmicDust scene:', err); toast('Saved scene could not be read.');
    }
  }

  function exportPng() {
    render();
    const link = document.createElement('a');
    link.download = `cosmicdust-${activeWorld}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link); link.click(); link.remove();
    toast('Artwork exported as a PNG image.');
  }

  function setBrush(value) {
    brushSize = Math.max(1, Math.min(18, Math.round(value)));
    $('brushSize').value = String(brushSize); $('brushValue').textContent = `${brushSize} px`; $('brushReadout').textContent = `BRUSH · ${brushSize}`;
  }

  function stepOnce() {
    if (running) setPaused(true);
    tickSimulation(); render(); updateStats();
  }

  function initCrazyGames() {
    try {
      if (!window.CrazyGames || !window.CrazyGames.SDK) return;
      const sdk = window.CrazyGames.SDK;
      Promise.resolve(sdk.init()).then(() => {
        sdkInitialized = true;
        // Respect platform audio preferences; CosmicDust currently has no sound effects.
        try {
          const settings = sdk.game && sdk.game.settings;
          if (settings && settings.muteAudio === true) document.body.dataset.muted = 'true';
          if (sdk.game && sdk.game.addSettingsChangeListener) sdk.game.addSettingsChangeListener((next) => {
            if (next && next.muteAudio === true) document.body.dataset.muted = 'true';
          });
        } catch (err) { /* Optional SDK settings are not needed for offline play. */ }
        if (running) startCrazyGameplay();
      }).catch(err => console.info('CrazyGames SDK unavailable; continuing without platform features.', err));
    } catch (err) {
      console.info('CrazyGames SDK unavailable; continuing offline.', err);
    }
  }

  function startCrazyGameplay() {
    if (!sdkInitialized || sdkPlaying) return;
    try { window.CrazyGames.SDK.game.gameplayStart(); sdkPlaying = true; } catch (err) { /* Safe outside CrazyGames. */ }
  }
  function stopCrazyGameplay() {
    if (!sdkInitialized || !sdkPlaying) return;
    try { window.CrazyGames.SDK.game.gameplayStop(); sdkPlaying = false; } catch (err) { /* Safe outside CrazyGames. */ }
  }

  // Element selection and search.
  buildElementButtons(); selectElement('dust');
  document.querySelectorAll('.filter-tab').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
  $('elementSearch').addEventListener('input', buildElementButtons);
  $('randomElement').addEventListener('click', () => {
    const pool = elements.filter(el => activeFilter === 'all' || el.group === activeFilter);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || elements[0];
    selectElement(chosen.key); toast(`Surprise pick: ${chosen.name}.`);
  });

  // Environment and field settings.
  document.querySelectorAll('.world-card').forEach(btn => btn.addEventListener('click', () => chooseWorld(btn.dataset.world)));
  $('glowToggle').addEventListener('change', e => { showGlow = e.target.checked; render(); });
  $('gridToggle').addEventListener('change', e => { showGrid = e.target.checked; render(); });
  $('motionToggle').addEventListener('change', e => { reducedMotion = e.target.checked; render(); });
  $('brushSize').addEventListener('input', e => setBrush(Number(e.target.value)));
  $('brushTool').addEventListener('click', () => setTool('brush'));
  $('eraseTool').addEventListener('click', () => setTool('eraser'));
  $('lineTool').addEventListener('click', () => setTool('line'));
  $('undoBtn').addEventListener('click', undo);
  $('saveSceneBtn').addEventListener('click', saveScene);
  $('loadSceneBtn').addEventListener('click', loadScene);
  $('exportBtn').addEventListener('click', exportPng);
  $('clearBtn').addEventListener('click', clearField);
  $('seedBtn').addEventListener('click', () => { saveSnapshot(); makeTerrain(); toast('A tiny ecosystem has been seeded.'); });
  $('pauseBtn').addEventListener('click', () => setPaused(running));
  $('stepBtn').addEventListener('click', stepOnce);
  $('dismissTip').addEventListener('click', () => $('dismissTip').closest('.tip-strip').remove());
  $('togglePanels').addEventListener('click', () => {
    $('elementPanel').classList.toggle('mobile-hidden');
    $('settingsPanel').classList.toggle('mobile-hidden');
    const hidden = $('elementPanel').classList.contains('mobile-hidden');
    $('togglePanels').textContent = hidden ? '☰' : '×';
    toast(hidden ? 'Controls tucked away.' : 'Controls are visible.');
  });

  // Help overlay.
  const help = $('helpOverlay');
  function openHelp() { help.hidden = false; $('gotItBtn').focus(); }
  function closeHelp() { help.hidden = true; $('helpBtn').focus(); }
  $('helpBtn').addEventListener('click', openHelp);
  $('helpClose').addEventListener('click', closeHelp);
  $('gotItBtn').addEventListener('click', closeHelp);
  help.addEventListener('click', e => { if (e.target === help) closeHelp(); });

  // Keyboard shortcuts. Don't steal browser shortcuts while typing in the search field.
  window.addEventListener('keydown', event => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); return; }
    if (event.code === 'Space') { event.preventDefault(); setPaused(running); }
    else if (event.key.toLowerCase() === 'b') setTool('brush');
    else if (event.key.toLowerCase() === 'e') setTool('eraser');
    else if (event.key.toLowerCase() === 'l') setTool('line');
    else if (event.key === '[') setBrush(brushSize - 1);
    else if (event.key === ']') setBrush(brushSize + 1);
    else if (event.key >= '1' && event.key <= '9') {
      const el = elements[Number(event.key) - 1]; if (el) selectElement(el.key);
    } else if (event.key === 'Escape' && !help.hidden) closeHelp();
  });

  // The browser naturally throttles background tabs; avoid extra simulation work there.
  // CrazyGames specifically handles focus/visibility, so platform gameplay events are not changed here.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastTickTime = 0; });

  // No external assets are required. The optional platform SDK never blocks the game itself.
  makeTerrain();
  setBrush(5);
  window.addEventListener('load', initCrazyGames, { once: true });
  requestAnimationFrame(animationLoop);
})();
