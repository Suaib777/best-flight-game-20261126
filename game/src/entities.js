// Hero, drones, missiles, shots and particles, plus the collision rules.
// The hero is an original armored flyer ("AEGIS-7"); the enemies are original
// Void drones — dark jade tiles with a red dragon glyph — and Doom missiles.
import { HERO, SCORE } from './config.js';
import { project } from './world.js';

export function createHero() {
  return {
    x: 0, y: 0.45, vx: 0, vy: 0,
    throttle: 0.55,
    fuel: HERO.startFuel,
    hull: HERO.startHull,
    score: 0,
    combo: 0,
    comboTimer: 0,
    rings: 0,
    kills: 0,
    shots: [],
    fireCooldown: 0,
    invulnerable: 0,
    shake: 0,
    trail: [],
  };
}

export function createDrone(rng, x, y) {
  return {
    kind: 'drone', x, y, z: 1,
    hp: 1,
    shootTimer: 1.2 + rng() * 1.4,
    wobble: rng() * Math.PI * 2,
    dead: false,
  };
}

export function createMissile(x, y) {
  return { kind: 'missile', x, y, z: 1, dead: false, smoke: 0 };
}

export function createOrb(x, y, z, vx, vy) {
  return { kind: 'orb', x, y, z, vx, vy, dead: false };
}

export function createParticles() {
  const list = [];
  return {
    list,
    burst(x, y, color, n, speed) {
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.8);
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, color });
      }
    },
    update(dt) {
      for (const p of list) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt; }
      for (let i = list.length - 1; i >= 0; i -= 1) if (list[i].life <= 0) list.splice(i, 1);
    },
  };
}

// Steer the hero toward the mouse (chase view) or the arrow keys, work the
// throttle, burn fuel, and keep the combo clock ticking.
export function updateHero(hero, input, dt) {
  input.poll();
  const targetX = input.mouseX * 2 - 1;
  const targetY = 1 - input.mouseY * 1.35; // mouse up = climb
  let ax = 0;
  let ay = 0;
  if (input.steerX !== 0 || input.steerY !== 0) {
    ax = input.steerX;
    ay = input.steerY;
  } else {
    ax = (targetX - hero.x) * 2.4;
    ay = (targetY - hero.y) * 2.4;
  }
  hero.vx += (ax * 3.2 - hero.vx * 4.5) * dt;
  hero.vy += (ay * 3.2 - hero.vy * 4.5) * dt;
  hero.x = Math.max(-1, Math.min(1, hero.x + hero.vx * dt));
  hero.y = Math.max(0.05, Math.min(1, hero.y + hero.vy * dt));
  if (input.throttleUp) hero.throttle = Math.min(1, hero.throttle + dt * 0.7);
  if (input.throttleDown) hero.throttle = Math.max(0.15, hero.throttle - dt * 0.7);
  const drain = hero.throttle > 0.8 ? HERO.fuelDrainFull : hero.throttle < 0.3 ? HERO.fuelDrainLow : HERO.fuelDrainCruise;
  hero.fuel = Math.max(0, hero.fuel - drain * dt);
  if (hero.comboTimer > 0) {
    hero.comboTimer -= dt;
    if (hero.comboTimer <= 0) hero.combo = 0;
  }
  if (hero.invulnerable > 0) hero.invulnerable -= dt;
  if (hero.shake > 0) hero.shake -= dt * 2;
  hero.fireCooldown -= dt;
  hero.trail.unshift({ x: hero.x, y: hero.y, life: 0.35 });
  if (hero.trail.length > 14) hero.trail.pop();
  for (const t of hero.trail) t.life -= dt;
}

// Fire a blaster bolt straight ahead; returns the new bolt or null.
export function heroFire(hero) {
  if (hero.fireCooldown > 0) return null;
  hero.fireCooldown = 0.22;
  const bolt = { kind: 'bolt', x: hero.x, y: hero.y, z: 0.05, dead: false };
  hero.shots.push(bolt);
  return bolt;
}

export function addScore(hero, base) {
  const mult = 1 + hero.combo * 0.25;
  hero.score += Math.round(base * mult);
  hero.combo += 1;
  hero.comboTimer = 5;
}

// Move drones, missiles, orbs and bolts one step; returns events for the game.
export function updateEntities(list, hero, dt, rng, speed) {
  const events = [];
  for (const e of list) {
    if (e.kind === 'drone') {
      e.z -= dt * (0.3 + speed * 0.5);
      e.wobble += dt * 2;
      e.x += Math.sin(e.wobble) * 0.12 * dt;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.z > 0.15 && e.z < 0.9) {
        e.shootTimer = 1.6 + rng() * 1.2;
        events.push({ type: 'droneShot', from: e });
      }
      if (e.z <= 0) {
        e.dead = true;
        events.push({ type: 'dronePassed', drone: e });
      }
    } else if (e.kind === 'missile') {
      e.z -= dt * (0.55 + speed * 0.5);
      e.x += (hero.x - e.x) * 0.35 * dt;
      e.y += (hero.y - e.y) * 0.35 * dt;
      e.smoke += dt;
      if (e.z <= 0) {
        e.dead = true;
        events.push({ type: 'missileArrived', missile: e });
      }
    } else if (e.kind === 'orb') {
      e.z -= dt * (0.4 + speed * 0.4);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.z <= 0) {
        e.dead = true;
        events.push({ type: 'orbArrived', orb: e });
      }
    } else if (e.kind === 'bolt') {
      e.z += dt * 1.4;
      if (e.z >= 1) e.dead = true;
    }
  }
  // Bolts hit drones in the same lane: bolt z catches the drone's z.
  for (const b of list) {
    if (b.kind !== 'bolt' || b.dead) continue;
    for (const d of list) {
      if (d.kind !== 'drone' || d.dead) continue;
      if (Math.abs(b.z - d.z) < 0.16 && Math.abs(b.x - d.x) < 0.16 && Math.abs(b.y - d.y) < 0.18) {
        b.dead = true;
        d.dead = true;
        d.hp = 0;
        events.push({ type: 'droneKilled', drone: d });
        break;
      }
    }
  }
  return events;
}

// A projectile reaching the hero plane hurts only when it is in the hero's
// lane; a ring scores when the hero passes through its centre.
export function nearHero(e, hero, radius) {
  const p = project(e.x, e.y, Math.max(0, e.z));
  const hp = { x: 640 + hero.x * 260, y: 560 - hero.y * 180 };
  const dx = (p.x - hp.x) / 640;
  const dy = (p.y - hp.y) / 400;
  return Math.hypot(dx, dy) < radius;
}

export function ringPassed(ring, hero) {
  const dx = Math.abs(ring.x - hero.x);
  const dy = Math.abs(ring.y - hero.y);
  return dx < ring.r * 0.85 && dy < ring.r * 0.85;
}

export { SCORE };
