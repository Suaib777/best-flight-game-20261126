// The city the hero flies over: a recognisable dusk skyline, a river with
// bridges, a runway strip at the start of a sortie, and the gold Mahjong rings
// that mark the flight path. Everything is generated from a seed, so a scene
// replays identically.
import { PALETTE, VIEW } from './config.js';
import { range } from './random.js';

// Project a world point (x: -1..1 lateral, y: 0..1 altitude, z: 1 far -> 0 near)
// onto the screen. Far objects cluster at the horizon; near ones spread wide.
export function project(x, y, z) {
  const spread = 1 - z;
  return {
    x: VIEW.width / 2 + x * (140 + 620 * spread),
    y: VIEW.horizon + (1 - y) * (40 + 380 * spread),
    scale: 0.12 + 0.88 * spread,
  };
}

export function createWorld(rng) {
  // Two parallax skyline layers: far silhouettes and nearer lit towers.
  function skyline(count, minW, maxW, minH, maxH) {
    const out = [];
    let x = -40;
    while (x < VIEW.width + 40) {
      const w = range(rng, minW, maxW);
      const h = range(rng, minH, maxH);
      const windows = [];
      const cols = Math.max(1, Math.floor(w / 14));
      const rows = Math.max(1, Math.floor(h / 18));
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          if (rng() < 0.45) windows.push([c, r]);
        }
      }
      out.push({ x, w, h, windows, pagoda: rng() < 0.16 });
      x += w + range(rng, 4, 26);
    }
    return out;
  }

  const world = {
    rng,
    far: skyline(46, 34, 90, 40, 130),
    near: skyline(30, 46, 120, 70, 210),
    // Ground buildings that approach the hero plane; |x| > 0.55 are scenery,
    // a few near the centre must be flown over (climb above y 0.32) or dodged.
    buildings: [],
    // Perspective ground lines.
    gridOffset: 0,
    riverSparkle: Array.from({ length: 40 }, () => ({ x: rng(), y: rng(), s: range(rng, 0.5, 1.6) })),
    distance: 0, // kilometres flown this sortie
    runway: 1, // 1 at takeoff, fades as the strip scrolls behind
  };

  world.spawnBuilding = () => {
    const centre = rng() < 0.3;
    world.buildings.push({
      x: centre ? range(rng, -0.28, 0.28) : (rng() < 0.5 ? -1 : 1) * range(rng, 0.55, 1.05),
      z: 1,
      w: range(rng, 0.06, 0.14),
      h: range(rng, 0.12, 0.3),
      lit: rng() < 0.7,
    });
  };

  world.update = (dt, speed) => {
    world.distance += speed * dt * 0.35;
    world.gridOffset = (world.gridOffset + dt * (0.25 + speed)) % 1;
    world.runway = Math.max(0, world.runway - dt * 0.09);
    for (const b of world.buildings) b.z -= dt * (0.22 + speed * 0.55);
    world.buildings = world.buildings.filter((b) => b.z > -0.15);
    while (world.buildings.length < 9) world.spawnBuilding();
    for (const s of world.riverSparkle) {
      s.y += dt * 0.05;
      if (s.y > 1) { s.y = 0; s.x = rng(); }
    }
  };

  return world;
}

// A gold Mahjong ring: concentric circles with pips, like a circle-suit tile.
export function createRing(x, y, big = false) {
  return { kind: 'ring', x, y, z: 1, r: big ? 0.34 : 0.17, big, passed: false, sparkle: 0 };
}

export function ringRadiusPx(ring) {
  const p = project(ring.x, ring.y, ring.z);
  return Math.max(6, ring.r * 340 * p.scale);
}
