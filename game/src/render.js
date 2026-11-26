// All canvas drawing: the dusk city, the Mahjong rings and drones, the armored
// hero in chase view, and the HUD — every panel shaped like a Mahjong tile with
// a gold trim. No images anywhere: every glyph is drawn with canvas paths.
import { PALETTE, VIEW } from './config.js';
import { project, ringRadiusPx } from './world.js';

const { width: W, height: H, horizon: HOR } = VIEW;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A Mahjong tile panel: ivory face, gold double border, red corner dots.
export function drawTile(ctx, x, y, w, h, title, value, accent = PALETTE.gold) {
  ctx.save();
  ctx.fillStyle = 'rgba(7,40,31,0.55)';
  rr(ctx, x + 3, y + 4, w, h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ivory;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  rr(ctx, x + 4, y + 4, w - 8, h - 8, 7);
  ctx.stroke();
  ctx.fillStyle = PALETTE.red;
  for (const [cx, cy] of [[x + 11, y + 11], [x + w - 11, y + 11], [x + 11, y + h - 11], [x + w - 11, y + h - 11]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.goldDark;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x + 14, y + 22);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText(value, x + 14, y + h - 12);
  ctx.restore();
}

// A bamboo stick (one combo level): green stalk with red joints.
function drawBamboo(ctx, x, y, h) {
  ctx.save();
  ctx.fillStyle = '#2e8b57';
  rr(ctx, x, y, 9, h, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(x, y + h * 0.33, 9, 3);
  ctx.fillRect(x, y + h * 0.66, 9, 3);
  ctx.fillStyle = '#57b981';
  ctx.fillRect(x + 2, y + 3, 2, h - 6);
  ctx.restore();
}

// The red dragon glyph on a drone tile: a coiled stroke with horns.
function drawDragon(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.bezierCurveTo(-12, -4, -2, -10, 4, -6);
  ctx.bezierCurveTo(10, -2, 8, 6, 2, 8);
  ctx.bezierCurveTo(-2, 9, -4, 6, -2, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -6);
  ctx.lineTo(8, -11);
  ctx.moveTo(0, -8);
  ctx.lineTo(2, -13);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(5, -4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSky(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, HOR + 60);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.55, PALETTE.skyMid);
  g.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HOR + 60);
  // Red sun, like the centre dot of a circle tile.
  const sunX = W * 0.72;
  const sunY = HOR - 66;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
  glow.addColorStop(0, 'rgba(231,76,60,0.55)');
  glow.addColorStop(1, 'rgba(231,76,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 130, sunY - 130, 260, 260);
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
  ctx.stroke();
  // Drifting clouds.
  ctx.fillStyle = 'rgba(243,234,211,0.10)';
  for (let i = 0; i < 5; i += 1) {
    const cx = ((time * 12 + i * 260) % (W + 300)) - 150;
    const cy = 60 + i * 36;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 60, cy + 6, 60, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSkyline(ctx, layer, color, windowColor, drift) {
  ctx.fillStyle = color;
  for (const b of layer) {
    const x = ((b.x + drift) % (W + 80) + W + 80) % (W + 80) - 40;
    const base = HOR;
    ctx.fillRect(x, base - b.h, b.w, b.h);
    if (b.pagoda) {
      for (let t = 0; t < 3; t += 1) {
        const w2 = b.w * (1 - t * 0.22);
        ctx.fillRect(x + (b.w - w2) / 2, base - b.h - 12 - t * 12, w2, 6);
      }
    }
    ctx.fillStyle = windowColor;
    for (const [c, r] of b.windows) {
      ctx.fillRect(x + 5 + c * 14, base - b.h + 8 + r * 18, 6, 8);
    }
    ctx.fillStyle = color;
  }
}

function drawGround(ctx, world) {
  // Jade ground with a perspective grid and a river band.
  const g = ctx.createLinearGradient(0, HOR, 0, H);
  g.addColorStop(0, '#0a3d2d');
  g.addColorStop(1, '#04160f');
  ctx.fillStyle = g;
  ctx.fillRect(0, HOR, W, H - HOR);
  // River band with gold sparkles.
  ctx.fillStyle = '#0f5b4a';
  ctx.fillRect(0, HOR + 130, W, 46);
  ctx.fillStyle = PALETTE.goldBright;
  for (const s of world.riverSparkle) {
    ctx.globalAlpha = 0.25 + s.s * 0.3;
    ctx.fillRect(s.x * W, HOR + 134 + s.y * 38, 3 * s.s, 2);
  }
  ctx.globalAlpha = 1;
  // Perspective lines converging on the horizon.
  ctx.strokeStyle = 'rgba(216,169,59,0.28)';
  ctx.lineWidth = 1.5;
  for (let i = -8; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 46, HOR);
    ctx.lineTo(W / 2 + i * 190, H);
    ctx.stroke();
  }
  // Horizontal lines rushing toward the viewer.
  for (let i = 0; i < 5; i += 1) {
    const t = (i / 5 + world.gridOffset / 5) % 1;
    const y = HOR + (H - HOR) * t * t;
    ctx.strokeStyle = `rgba(216,169,59,${0.10 + t * 0.22})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Runway strip at takeoff: gold dashes down the centre.
  if (world.runway > 0) {
    ctx.save();
    ctx.globalAlpha = world.runway;
    ctx.fillStyle = '#123a2d';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 26, HOR + 10);
    ctx.lineTo(W / 2 + 26, HOR + 10);
    ctx.lineTo(W / 2 + 150, H);
    ctx.lineTo(W / 2 - 150, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    for (let i = 0; i < 6; i += 1) {
      const t = i / 6;
      const y = HOR + 20 + (H - HOR - 30) * t * t;
      const wdt = 6 + t * 14;
      ctx.fillRect(W / 2 - wdt / 2, y, wdt, 10 + t * 16);
    }
    ctx.restore();
  }
}

function drawBuildings(ctx, world) {
  for (const b of world.buildings) {
    const p = project(b.x, 0, b.z);
    const w = b.w * 900 * p.scale;
    const h = b.h * 700 * p.scale;
    const x = p.x - w / 2;
    const y = p.y - h;
    ctx.fillStyle = '#0b2e24';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#0e4436';
    ctx.fillRect(x, y, w, 5);
    if (b.lit) {
      ctx.fillStyle = 'rgba(242,201,76,0.75)';
      const cols = Math.max(1, Math.floor(w / 16));
      const rows = Math.max(1, Math.floor(h / 20));
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          if ((c * 7 + r * 3) % 5 === 0) ctx.fillRect(x + 5 + c * 16, y + 8 + r * 20, 5, 7);
        }
      }
    }
    // Red warning tile on the roof.
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(x + w / 2 - 4, y - 6, 8, 6);
  }
}

function drawRing(ctx, ring, time) {
  const p = project(ring.x, ring.y, ring.z);
  const r = ringRadiusPx(ring);
  if (r < 4) return;
  const pulse = 1 + Math.sin(time * 3 + ring.x * 5) * 0.04;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(pulse, pulse);
  const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.5);
  glow.addColorStop(0, 'rgba(242,201,76,0.28)');
  glow.addColorStop(1, 'rgba(242,201,76,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
  // Outer gold ring.
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = Math.max(3, r * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.goldDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  // Circle-tile pips: four small gold dots and a red centre.
  ctx.fillStyle = PALETTE.gold;
  for (const [dx, dy] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
    ctx.beginPath();
    ctx.arc(dx * r, dy * r, Math.max(2, r * 0.09), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.red;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(3, r * 0.13), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDrone(ctx, drone, time) {
  const p = project(drone.x, drone.y, drone.z);
  const s = 34 * p.scale + 10;
  ctx.save();
  ctx.translate(p.x, p.y + Math.sin(drone.wobble) * 4);
  ctx.rotate(Math.sin(drone.wobble * 0.7) * 0.12);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, -s / 2 + 3, -s / 2 + 4, s, s, 8);
  ctx.fill();
  ctx.fillStyle = '#12291f';
  rr(ctx, -s / 2, -s / 2, s, s, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  rr(ctx, -s / 2 + 3, -s / 2 + 3, s - 6, s - 6, 6);
  ctx.stroke();
  drawDragon(ctx, 0, 0, s / 34, PALETTE.redBright);
  ctx.restore();
}

function drawMissile(ctx, m) {
  const p = project(m.x, m.y, m.z);
  const s = 10 * p.scale + 6;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = 'rgba(243,234,211,0.5)';
  ctx.lineWidth = s * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -s * 2.4);
  ctx.lineTo(0, -s * 0.6);
  ctx.stroke();
  ctx.fillStyle = PALETTE.redBright;
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.4);
  ctx.lineTo(s * 0.55, s * 0.7);
  ctx.lineTo(-s * 0.55, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOrb(ctx, o) {
  const p = project(o.x, o.y, Math.max(0, o.z));
  const r = 7 * p.scale + 4;
  ctx.save();
  ctx.fillStyle = 'rgba(231,76,60,0.35)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.redBright;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd9d4';
  ctx.beginPath();
  ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBolt(ctx, b) {
  const p = project(b.x, b.y, Math.max(0, b.z));
  ctx.save();
  ctx.strokeStyle = PALETTE.thruster;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 14);
  ctx.lineTo(p.x, p.y - 14);
  ctx.stroke();
  ctx.fillStyle = '#eaf7ff';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The armored hero from behind: gold pauldrons, jade armor, red cape, twin
// thrusters. Original art, drawn with canvas paths.
function drawHero(ctx, hero, time) {
  const hx = 640 + hero.x * 260;
  const hy = 560 - hero.y * 180;
  const bob = Math.sin(time * 6) * 3;
  const tilt = Math.max(-0.28, Math.min(0.28, -hero.vx * 0.35));
  ctx.save();
  ctx.translate(hx, hy + bob);
  ctx.rotate(tilt);
  if (hero.invulnerable > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45;
  // Thruster flames.
  for (const dx of [-16, 16]) {
    const fl = 26 + Math.sin(time * 22 + dx) * 8 + hero.throttle * 18;
    const g = ctx.createLinearGradient(0, 34, 0, 34 + fl);
    g.addColorStop(0, '#eaf7ff');
    g.addColorStop(0.5, PALETTE.thruster);
    g.addColorStop(1, 'rgba(127,212,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(dx - 7, 34);
    ctx.lineTo(dx + 7, 34);
    ctx.lineTo(dx, 34 + fl);
    ctx.closePath();
    ctx.fill();
  }
  // Cape: red, fluttering behind.
  ctx.fillStyle = PALETTE.red;
  ctx.beginPath();
  ctx.moveTo(-24, -34);
  ctx.quadraticCurveTo(-52 - Math.sin(time * 5) * 8, 0, -38, 52 + Math.sin(time * 7) * 6);
  ctx.quadraticCurveTo(-12, 44, 0, 50);
  ctx.quadraticCurveTo(12, 44, 38, 52 + Math.sin(time * 7 + 1) * 6);
  ctx.quadraticCurveTo(52 + Math.sin(time * 5) * 8, 0, 24, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.redBright;
  ctx.beginPath();
  ctx.moveTo(-24, -34);
  ctx.quadraticCurveTo(-30, 0, -20, 40);
  ctx.quadraticCurveTo(0, 48, 20, 40);
  ctx.quadraticCurveTo(30, 0, 24, -34);
  ctx.closePath();
  ctx.fill();
  // Boots / legs.
  ctx.fillStyle = '#234a3c';
  rr(ctx, -20, 22, 15, 22, 5);
  ctx.fill();
  rr(ctx, 5, 22, 15, 22, 5);
  ctx.fill();
  // Torso armor: jade plates with gold trim.
  ctx.fillStyle = PALETTE.jadeMid;
  rr(ctx, -26, -34, 52, 58, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2.5;
  rr(ctx, -26, -34, 52, 58, 10);
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(10, -8);
  ctx.lineTo(0, 12);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.fill();
  // Pauldrons.
  ctx.fillStyle = PALETTE.goldBright;
  ctx.beginPath();
  ctx.arc(-28, -26, 13, 0, Math.PI * 2);
  ctx.arc(28, -26, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.goldDark;
  ctx.beginPath();
  ctx.arc(-28, -26, 5, 0, Math.PI * 2);
  ctx.arc(28, -26, 5, 0, Math.PI * 2);
  ctx.fill();
  // Arms out to the sides, fists glowing.
  ctx.strokeStyle = PALETTE.jadeMid;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -18);
  ctx.lineTo(-52, 2);
  ctx.moveTo(26, -18);
  ctx.lineTo(52, 2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.beginPath();
  ctx.arc(-53, 3, 7, 0, Math.PI * 2);
  ctx.arc(53, 3, 7, 0, Math.PI * 2);
  ctx.fill();
  // Helmet from behind: dark with a gold crest and visor slit.
  ctx.fillStyle = '#14332a';
  ctx.beginPath();
  ctx.arc(0, -48, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -48, 19, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillRect(-3, -70, 6, 14);
  ctx.fillStyle = PALETTE.thruster;
  ctx.fillRect(-14, -52, 28, 3);
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const p of particles.list) {
    ctx.globalAlpha = Math.max(0, p.life * 1.6);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, hero, mission, progress, banner) {
  const alt = Math.round(120 + hero.y * 880);
  const spd = Math.round(180 + hero.throttle * 440);
  const hdg = Math.round(((360 - hero.x * 25) % 360 + 360) % 360);
  // Score tile + combo bamboo.
  drawTile(ctx, 20, 18, 210, 74, 'SCORE', hero.score.toLocaleString('en-US'));
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillStyle = PALETTE.goldDark;
  ctx.fillText('COMBO', 244, 40);
  for (let i = 0; i < Math.min(hero.combo, 8); i += 1) drawBamboo(ctx, 244 + i * 13, 48, 34);
  if (hero.combo > 0) {
    ctx.fillStyle = PALETTE.red;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(`x${(1 + hero.combo * 0.25).toFixed(2)}`, 244, 102);
  }
  // Mission tile.
  drawTile(ctx, W - 300, 18, 280, 74, `MISSION ${mission.id} — ${mission.name}`, progress, PALETTE.red);
  // Flight instruments: three small tiles.
  drawTile(ctx, 20, H - 92, 130, 74, 'ALTITUDE', `${alt} m`);
  drawTile(ctx, 162, H - 92, 130, 74, 'SPEED', `${spd}`);
  drawTile(ctx, 304, H - 92, 130, 74, 'HEADING', `${String(hdg).padStart(3, '0')}°`);
  // Fuel bar + hull circles, bottom right: title and percent on the top
  // line, the fuel bar in the middle, five hull circles along the bottom.
  const fx = W - 300;
  const fy = H - 92;
  drawTile(ctx, fx, fy, 280, 74, 'FUEL', '', PALETTE.jadeLight);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(hero.fuel)}%`, fx + 266, fy + 24);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0b3d33';
  rr(ctx, fx + 14, fy + 34, 252, 12, 6);
  ctx.fill();
  ctx.fillStyle = hero.fuel < 25 ? PALETTE.redBright : PALETTE.jadeLight;
  rr(ctx, fx + 14, fy + 34, Math.max(0, 252 * hero.fuel / 100), 12, 6);
  ctx.fill();
  // Hull as five red circles (Mahjong circles), filled per 20 hull.
  for (let i = 0; i < 5; i += 1) {
    const cx = fx + 24 + i * 24;
    const cy = fy + 60;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = hero.hull > i * 20 ? PALETTE.red : 'rgba(192,57,43,0.25)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Mission banner.
  if (banner) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, banner.alpha);
    ctx.fillStyle = 'rgba(7,40,31,0.8)';
    rr(ctx, W / 2 - 260, 112, 520, 54, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2.5;
    rr(ctx, W / 2 - 260, 112, 520, 54, 12);
    ctx.stroke();
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(banner.text, W / 2, 148);
    ctx.restore();
  }
}

function drawTitleWall(ctx) {
  // A wall of ivory Mahjong tiles behind the title.
  ctx.fillStyle = PALETTE.jadeDeep;
  ctx.fillRect(0, 0, W, H);
  const tw = 86;
  const th = 118;
  for (let row = -1; row < 8; row += 1) {
    for (let col = -1; col < 16; col += 1) {
      const x = col * tw + (row % 2 === 0 ? 0 : tw / 2);
      const y = row * th;
      ctx.fillStyle = row % 2 === 0 ? 'rgba(243,234,211,0.06)' : 'rgba(243,234,211,0.10)';
      rr(ctx, x + 4, y + 4, tw - 8, th - 8, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(216,169,59,0.35)';
      ctx.lineWidth = 2;
      rr(ctx, x + 8, y + 8, tw - 16, th - 16, 6);
      ctx.stroke();
      // Suit glyphs: circles, bamboo, character.
      const kind = (row * 7 + col) % 3;
      ctx.fillStyle = 'rgba(216,169,59,0.5)';
      if (kind === 0) {
        ctx.beginPath();
        ctx.arc(x + tw / 2, y + th / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.red;
        ctx.beginPath();
        ctx.arc(x + tw / 2, y + th / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === 1) {
        for (let i = 0; i < 3; i += 1) drawBamboo(ctx, x + tw / 2 - 16 + i * 13, y + th / 2 - 18, 36);
      } else {
        ctx.font = 'bold 34px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('萬', x + tw / 2, y + th / 2 + 12);
      }
    }
  }
}

export function render(ctx, game) {
  const { state, hero, world, entities, particles, time, banner, mission } = game;
  ctx.save();
  if (hero.shake > 0) {
    ctx.translate((Math.random() - 0.5) * hero.shake * 14, (Math.random() - 0.5) * hero.shake * 14);
  }
  drawSky(ctx, time);
  drawSkyline(ctx, world.far, '#0a2e25', 'rgba(242,201,76,0.35)', time * 2);
  drawGround(ctx, world);
  drawSkyline(ctx, world.near, '#07231b', 'rgba(242,201,76,0.6)', time * 6);
  drawBuildings(ctx, world);
  for (const e of entities) {
    if (e.kind === 'ring') drawRing(ctx, e, time);
    else if (e.kind === 'drone') drawDrone(ctx, e, time);
    else if (e.kind === 'missile') drawMissile(ctx, e);
    else if (e.kind === 'orb') drawOrb(ctx, e);
    else if (e.kind === 'bolt') drawBolt(ctx, e);
  }
  drawParticles(ctx, particles);
  if (state === 'playing' || state === 'paused') {
    // Ground shadow anchors the hero in the city below.
    const shX = 640 + hero.x * 260;
    const shScale = 1 - hero.y * 0.55;
    ctx.save();
    ctx.globalAlpha = 0.32 * shScale;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(shX, 724, 62 * shScale, 11 * shScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Thruster trail: fading gold dots behind the hero.
    for (const t of hero.trail) {
      if (t.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, t.life * 2.2);
      ctx.fillStyle = PALETTE.goldBright;
      ctx.beginPath();
      ctx.arc(640 + t.x * 260, 560 - t.y * 180 + 30, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const b of hero.shots) drawBolt(ctx, b);
    drawHero(ctx, hero, time);
    drawHud(ctx, hero, mission, game.progressText(), banner);
  }
  ctx.restore();

  if (state === 'title') {
    drawTitleWall(ctx);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 84px Georgia, serif';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 18;
    ctx.fillText('AVENGERS', W / 2, 250);
    ctx.fillStyle = PALETTE.redBright;
    ctx.fillText('DOOMSDAY', W / 2, 340);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText('— MAHJONG SKIES —', W / 2, 392);
    ctx.font = '19px Georgia, serif';
    ctx.fillStyle = PALETTE.ivoryDim;
    ctx.fillText('Fly AEGIS-7 over the burning city. Thread the gold rings,', W / 2, 448);
    ctx.fillText('blast the Void drones, and reach the Doomsday Gate.', W / 2, 476);
    // Controls tile.
    ctx.fillStyle = 'rgba(7,40,31,0.85)';
    rr(ctx, W / 2 - 300, 510, 600, 92, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2.5;
    rr(ctx, W / 2 - 300, 510, 600, 92, 12);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = '17px Georgia, serif';
    ctx.fillText('MOUSE / ARROWS — steer      W / S — throttle', W / 2, 542);
    ctx.fillText('SPACE / CLICK — fire blaster      P — pause      M — mute', W / 2, 570);
    ctx.fillStyle = Math.floor(time * 2) % 2 === 0 ? PALETTE.goldBright : PALETTE.ivory;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText('CLICK OR PRESS ENTER TO FLY', W / 2, 660);
    ctx.restore();
  }

  if (state === 'paused') {
    ctx.save();
    ctx.fillStyle = 'rgba(4,22,15,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('PAUSED', W / 2, H / 2 - 10);
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Press P to keep flying', W / 2, H / 2 + 40);
    ctx.restore();
  }

  if (state === 'gameover') {
    ctx.save();
    ctx.fillStyle = 'rgba(20,4,2,0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.redBright;
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('MISSION FAILED', W / 2, 300);
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = '26px Georgia, serif';
    ctx.fillText(game.overReason, W / 2, 356);
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.fillText(`SCORE  ${hero.score.toLocaleString('en-US')}`, W / 2, 430);
    ctx.fillStyle = PALETTE.ivoryDim;
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Press R to fly again', W / 2, 500);
    ctx.restore();
  }

  if (state === 'victory') {
    ctx.save();
    ctx.fillStyle = 'rgba(7,40,31,0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('DOOMSDAY AVERTED', W / 2, 280);
    ctx.fillStyle = PALETTE.ivory;
    ctx.font = '24px Georgia, serif';
    ctx.fillText('AEGIS-7 flew the gate. The city stands — for now.', W / 2, 336);
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.fillText(`SCORE  ${hero.score.toLocaleString('en-US')}`, W / 2, 420);
    ctx.fillStyle = PALETTE.ivoryDim;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Rings ${hero.rings}   •   Drones down ${hero.kills}   •   Distance ${world.distance.toFixed(1)} km`, W / 2, 470);
    ctx.fillText('Press R to fly again', W / 2, 530);
    ctx.restore();
  }
}
